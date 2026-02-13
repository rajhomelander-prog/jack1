import { Injectable, signal, computed, effect } from '@angular/core';

// --- ENUMS & TYPES ---
export enum PlayerColor {
  Red = 'Red',
  Green = 'Green',
  Blue = 'Blue',
  Yellow = 'Yellow',
}

export enum GameStatus {
  Lobby = 'Lobby',
  InProgress = 'InProgress',
  GameOver = 'GameOver',
}

export interface Piece {
  id: number;
  color: PlayerColor;
  /** -1 is at base, 0-51 is on main track, 52-57 is on home stretch, 58 is finished */
  position: number; 
}

export interface Player {
  color: PlayerColor;
  isAI: boolean;
  pieces: Piece[];
}

export interface GameState {
  status: GameStatus;
  isRolling: boolean;
  message: string;
}

// --- CONSTANTS ---
const TOTAL_TRACK_SQUARES = 52;
const HOME_STRETCH_START = 52;
const FINISHED_POSITION = 58;

// Map colors to their starting track position
const START_POSITIONS: Record<PlayerColor, number> = {
  [PlayerColor.Red]: 0,
  [PlayerColor.Green]: 13,
  [PlayerColor.Blue]: 39,
  [PlayerColor.Yellow]: 26,
};

// Map colors to the position before their home stretch
const HOME_ENTRANCES: Record<PlayerColor, number> = {
  [PlayerColor.Red]: 50,
  [PlayerColor.Green]: 11,
  [PlayerColor.Blue]: 37,
  [PlayerColor.Yellow]: 24,
};

const SAFE_ZONES = [0, 8, 13, 21, 26, 34, 39, 47];

// --- 2D POSITIONING CONSTANTS ---

const CELL_PERCENT = 100 / 15; // 15 cells in a row/column

const BASE_CENTERS: Record<PlayerColor, { x: number, y: number }> = {
    [PlayerColor.Red]: { x: 3 * CELL_PERCENT, y: 3 * CELL_PERCENT },
    [PlayerColor.Green]: { x: 12 * CELL_PERCENT, y: 3 * CELL_PERCENT },
    [PlayerColor.Blue]: { x: 3 * CELL_PERCENT, y: 12 * CELL_PERCENT },
    [PlayerColor.Yellow]: { x: 12 * CELL_PERCENT, y: 12 * CELL_PERCENT },
};

const PIECE_OFFSETS = [
    { x: -0.75, y: -0.75 }, { x: 0.75, y: -0.75 },
    { x: -0.75, y: 0.75 }, { x: 0.75, y: 0.75 }
];

const PATH_COORDS = [
    { x: 1, y: 6 }, { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 4, y: 6 }, { x: 5, y: 6 },
    { x: 6, y: 5 }, { x: 6, y: 4 }, { x: 6, y: 3 }, { x: 6, y: 2 }, { x: 6, y: 1 }, { x: 6, y: 0 },
    { x: 7, y: 0 }, { x: 8, y: 0 },
    { x: 8, y: 1 }, { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 },
    { x: 9, y: 6 }, { x: 10, y: 6 }, { x: 11, y: 6 }, { x: 12, y: 6 }, { x: 13, y: 6 }, { x: 14, y: 6 },
    { x: 14, y: 7 }, { x: 14, y: 8 },
    { x: 13, y: 8 }, { x: 12, y: 8 }, { x: 11, y: 8 }, { x: 10, y: 8 }, { x: 9, y: 8 },
    { x: 8, y: 9 }, { x: 8, y: 10 }, { x: 8, y: 11 }, { x: 8, y: 12 }, { x: 8, y: 13 }, { x: 8, y: 14 },
    { x: 7, y: 14 }, { x: 6, y: 14 },
    { x: 6, y: 13 }, { x: 6, y: 12 }, { x: 6, y: 11 }, { x: 6, y: 10 }, { x: 6, y: 9 },
    { x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 }, { x: 0, y: 8 },
    { x: 0, y: 7 }, { x: 0, y: 6 }
].map(c => ({ x: (c.x + 0.5) * CELL_PERCENT, y: (c.y + 0.5) * CELL_PERCENT }));

const HOME_STRETCH_COORDS: Record<PlayerColor, { x: number, y: number }[]> = {
    [PlayerColor.Red]: Array.from({ length: 6 }, (_, i) => ({ x: i + 1, y: 7 })),
    [PlayerColor.Green]: Array.from({ length: 6 }, (_, i) => ({ x: 7, y: i + 1 })),
    [PlayerColor.Yellow]: Array.from({ length: 6 }, (_, i) => ({ x: 13 - i, y: 7 })),
    [PlayerColor.Blue]: Array.from({ length: 6 }, (_, i) => ({ x: 7, y: 13 - i })),
};

Object.keys(HOME_STRETCH_COORDS).forEach(key => {
    HOME_STRETCH_COORDS[key as PlayerColor] = HOME_STRETCH_COORDS[key as PlayerColor].map(c => ({
        x: (c.x + 0.5) * CELL_PERCENT,
        y: (c.y + 0.5) * CELL_PERCENT
    }));
});

const HOME_COORDS: Record<PlayerColor, { x: number, y: number }> = {
    [PlayerColor.Red]: { x: 7.5 * CELL_PERCENT, y: 6.5 * CELL_PERCENT },
    [PlayerColor.Green]: { x: 8.5 * CELL_PERCENT, y: 7.5 * CELL_PERCENT },
    [PlayerColor.Yellow]: { x: 7.5 * CELL_PERCENT, y: 8.5 * CELL_PERCENT },
    [PlayerColor.Blue]: { x: 6.5 * CELL_PERCENT, y: 7.5 * CELL_PERCENT },
};


@Injectable({
  providedIn: 'root'
})
export class LudoService {
  gameState = signal<GameState>({ status: GameStatus.Lobby, isRolling: false, message: '' });
  players = signal<Player[]>([]);
  activePlayerColor = signal<PlayerColor | null>(null);
  diceValue = signal<1 | 2 | 3 | 4 | 5 | 6>(1);
  winner = signal<PlayerColor | null>(null);

  private turnRollCount = 0; // To track consecutive 6s

  // --- COMPUTED SIGNALS ---
  activePlayer = computed(() => {
    const color = this.activePlayerColor();
    return this.players().find(p => p.color === color) || null;
  });

  private blockades = computed(() => {
    const blockadeMap = new Map<number, PlayerColor>();
    const allPieces = this.players().flatMap(p => p.pieces);
    const positions = new Map<number, Piece[]>();

    for (const piece of allPieces) {
      if (piece.position >= 0 && piece.position < HOME_STRETCH_START) {
        const occupants = positions.get(piece.position) || [];
        occupants.push(piece);
        positions.set(piece.position, occupants);
      }
    }

    for (const [pos, occupants] of positions.entries()) {
      if (occupants.length > 1) {
        blockadeMap.set(pos, occupants[0].color);
      }
    }
    return blockadeMap;
  });

  movablePieces = computed(() => {
    const player = this.activePlayer();
    const dice = this.diceValue();
    const state = this.gameState();
    
    if (!player || state.isRolling) return [];
    
    const movable: number[] = [];
    player.pieces.forEach(piece => {
      if (this.canMovePiece(piece, player, dice)) {
        movable.push(piece.id);
      }
    });
    return movable;
  });

  // --- EFFECTS ---
  constructor() {
    // Effect to handle AI turns
    effect(() => {
      const player = this.activePlayer();
      if (player?.isAI && this.gameState().status === GameStatus.InProgress) {
        // Ensure there are no pending state updates before AI acts
        setTimeout(() => this.handleAITurn(), 1000);
      }
    }, { allowSignalWrites: true });
  }


  // --- PUBLIC API ---
  startGame(): void {
    const newPlayers: Player[] = [
      { color: PlayerColor.Red, isAI: false, pieces: this.createPieces(PlayerColor.Red) },
      { color: PlayerColor.Green, isAI: true, pieces: this.createPieces(PlayerColor.Green) },
      { color: PlayerColor.Yellow, isAI: true, pieces: this.createPieces(PlayerColor.Yellow) },
      { color: PlayerColor.Blue, isAI: true, pieces: this.createPieces(PlayerColor.Blue) },
    ];
    this.players.set(newPlayers);
    this.activePlayerColor.set(PlayerColor.Red); // Red always starts
    this.winner.set(null);
    this.gameState.set({ status: GameStatus.InProgress, isRolling: false, message: '' });
    this.diceValue.set(1);
    this.turnRollCount = 0;
  }

  rollDice(): void {
    if (this.gameState().isRolling || this.activePlayer()?.isAI) return;
    if (this.movablePieces().length > 0 && this.diceValue() !== 6) return; // Must move piece if possible

    this.gameState.update(s => ({ ...s, isRolling: true, message: '' }));
    
    const roll = (Math.floor(Math.random() * 6) + 1) as (1|2|3|4|5|6);

    setTimeout(() => {
      this.diceValue.set(roll);
      this.gameState.update(s => ({ ...s, isRolling: false }));
      this.handleDiceRollResult(roll);
    }, 500);
  }

  movePiece(pieceId: number): void {
    const player = this.activePlayer();
    if (!player || this.gameState().isRolling || !this.movablePieces().includes(pieceId)) {
        return;
    }

    const pieceToMove = player.pieces.find(p => p.id === pieceId)!;
    const dice = this.diceValue();
    const newPosition = this.calculateNewPosition(pieceToMove, dice, player.color);

    // Knockout Logic (must happen before moving the new piece in)
    if (newPosition < HOME_STRETCH_START && !SAFE_ZONES.includes(newPosition)) {
      const occupants = this.getPiecesAtPosition(newPosition);
      // Can only knock out if it's a single opponent piece.
      if (occupants.length === 1 && occupants[0].color !== player.color) {
        this.updatePiecePosition(occupants[0].id, -1);
      }
    }
    
    // Update piece position
    this.updatePiecePosition(pieceId, newPosition);

    // Check for win condition
    if (this.checkWinCondition(player)) {
        this.winner.set(player.color);
        this.gameState.set({ status: GameStatus.GameOver, isRolling: false, message: '' });
        return;
    }

    // Next turn logic
    if (dice !== 6) {
        this.nextTurn();
    } else {
        // Rolled a 6, gets another turn
        this.gameState.update(s => ({...s, message: "Rolled a 6! Roll again."}));
    }
  }

  // --- PRIVATE LOGIC ---
  private handleDiceRollResult(roll: number): void {
      const player = this.activePlayer()!;
      
      if (roll === 6) {
          this.turnRollCount++;
      } else {
          this.turnRollCount = 0;
      }

      // Check for movable pieces with the new roll
      const hasMovablePieces = player.pieces.some(p => this.canMovePiece(p, player, roll));

      if (this.turnRollCount === 3) {
          // Three consecutive 6s, turn forfeited
          this.gameState.update(s => ({...s, message: "Three 6s! Turn forfeited."}));
          setTimeout(() => this.nextTurn(), 1500);
      } else if (!hasMovablePieces) {
          // No valid moves, pass turn unless it was a 6 (they get to roll again)
          if (roll !== 6) {
            this.gameState.update(s => ({...s, message: "No valid moves."}));
            setTimeout(() => this.nextTurn(), 1500);
          }
      }
  }

  private canMovePiece(piece: Piece, player: Player, dice: number): boolean {
    if (piece.position === FINISHED_POSITION) return false;

    if (piece.position === -1) {
      return dice === 6;
    }
    
    const newPosition = this.calculateNewPosition(piece, dice, player.color);

    if (newPosition > FINISHED_POSITION) {
        return false; // Cannot overshoot the finish line
    }

    // Path check for blockades
    if (piece.position < HOME_STRETCH_START) {
        const blockades = this.blockades();
        for (let i = 1; i < dice; i++) {
            const pathPos = (piece.position + i) % TOTAL_TRACK_SQUARES;
            const blockadeOwner = blockades.get(pathPos);
            if (blockadeOwner && blockadeOwner !== player.color) {
                return false; // Path blocked by opponent
            }
        }
    }

    // Destination check
    if (newPosition < HOME_STRETCH_START) {
        const occupants = this.getPiecesAtPosition(newPosition);
        // Cannot land on an opponent's blockade
        if (occupants.length > 1 && occupants[0].color !== player.color) {
            return false;
        }
    }
    
    return true;
  }

  private nextTurn(): void {
    const playerOrder = [PlayerColor.Red, PlayerColor.Green, PlayerColor.Yellow, PlayerColor.Blue];
    const currentIndex = playerOrder.indexOf(this.activePlayerColor()!);
    const nextIndex = (currentIndex + 1) % playerOrder.length;
    
    this.activePlayerColor.set(playerOrder[nextIndex]);
    this.turnRollCount = 0; // Reset for next player
    this.gameState.update(s => ({ ...s, message: '' }));
  }

  private updatePiecePosition(pieceId: number, newPosition: number): void {
      this.players.update(players => players.map(p => ({
          ...p,
          pieces: p.pieces.map(pc => pc.id === pieceId ? {...pc, position: newPosition} : pc)
      })));
  }
  
  private checkWinCondition(player: Player): boolean {
      return player.pieces.every(p => p.position === FINISHED_POSITION);
  }

  private createPieces(color: PlayerColor): Piece[] {
    const baseId = { Red: 0, Green: 10, Blue: 20, Yellow: 30 }[color];
    return Array.from({ length: 4 }, (_, i) => ({
      id: baseId + i,
      color,
      position: -1,
    }));
  }

  private handleAITurn() {
    const player = this.activePlayer();
    if (!player || !player.isAI || this.gameState().isRolling) return;
    
    // AI must move piece if possible before rolling again
    if (this.movablePieces().length > 0 && this.diceValue() !== 6) {
        const bestMove = this.findBestAIMove(this.movablePieces(), this.diceValue());
        this.movePiece(bestMove.pieceId);
        return;
    }

    // AI rolls the dice
    this.gameState.update(s => ({ ...s, isRolling: true, message: '' }));
    const roll = (Math.floor(Math.random() * 6) + 1) as (1|2|3|4|5|6);
    
    setTimeout(() => {
        this.diceValue.set(roll);
        this.gameState.update(s => ({ ...s, isRolling: false }));
        this.handleDiceRollResult(roll);

        // After roll result is handled, AI makes a move if possible
        setTimeout(() => {
            const movablePieceIds = this.movablePieces();
            if (movablePieceIds.length > 0) {
                const bestMove = this.findBestAIMove(movablePieceIds, roll);
                this.movePiece(bestMove.pieceId);
            }
        }, 800);

    }, 500);
  }

  private findBestAIMove(movablePieceIds: number[], dice: number): { pieceId: number, score: number } {
    const player = this.activePlayer()!;
    
    const scoredMoves = movablePieceIds.map(id => {
        const piece = player.pieces.find(p => p.id === id)!;
        const newPosition = this.calculateNewPosition(piece, dice, player.color);
        let score = 0;

        // 1. Highest Priority: Finishing a piece
        if (newPosition === FINISHED_POSITION) score += 100;

        // 2. High Priority: Knocking out an opponent
        if (newPosition < HOME_STRETCH_START && !SAFE_ZONES.includes(newPosition)) {
            const occupants = this.getPiecesAtPosition(newPosition);
            if (occupants.length === 1 && occupants[0].color !== player.color) {
                score += 75;
            }
        }
        
        // 3. Medium-High Priority: Landing on a safe zone
        if (SAFE_ZONES.includes(newPosition)) score += 50;

        // 4. Medium Priority: Getting a piece out of base
        if (piece.position === -1 && dice === 6) score += 40;

        // 5. Medium Priority: Forming a blockade
        if (newPosition < HOME_STRETCH_START) {
            const occupants = this.getPiecesAtPosition(newPosition);
            if (occupants.length === 1 && occupants[0].color === player.color) {
                score += 35;
            }
        }

        // 6. Low Priority: Progressing along the board
        if (piece.position >= 0 && piece.position < HOME_STRETCH_START) {
            const startPos = START_POSITIONS[player.color];
            const progress = (newPosition - startPos + TOTAL_TRACK_SQUARES) % TOTAL_TRACK_SQUARES;
            score += progress / 2;
        } else if (newPosition >= HOME_STRETCH_START) {
            score += newPosition; // Higher score for being in home stretch
        }

        // 7. Penalty: Leaving a safe zone for a non-safe zone
        if (SAFE_ZONES.includes(piece.position) && !SAFE_ZONES.includes(newPosition)) score -= 20;

        // 8. Penalty: Breaking a blockade
        if (this.getPiecesAtPosition(piece.position).length > 1) score -= 30;
        
        return { pieceId: id, score };
    });

    scoredMoves.sort((a, b) => b.score - a.score);
    return scoredMoves[0];
  }

  // --- UI POSITIONING & HELPER ---
  
  private getPiecesAtPosition(position: number): Piece[] {
    if (position < 0) return [];
    return this.players().flatMap(p => p.pieces).filter(p => p.position === position);
  }

  private calculateNewPosition(piece: Piece, dice: number, color: PlayerColor): number {
    if (piece.position === -1) {
        return dice === 6 ? START_POSITIONS[color] : -1;
    }

    if (piece.position >= HOME_STRETCH_START) {
        return piece.position + dice;
    }

    const homeEntrance = HOME_ENTRANCES[color];
    const movesToEntrance = (homeEntrance - piece.position + TOTAL_TRACK_SQUARES) % TOTAL_TRACK_SQUARES;

    if (dice > movesToEntrance) {
        const movesIntoStretch = dice - movesToEntrance;
        return HOME_STRETCH_START + movesIntoStretch - 1;
    } else {
        return (piece.position + dice) % TOTAL_TRACK_SQUARES;
    }
  }
  
  getPiecePosition(piece: Piece): { x: number; y: number } {
    if (piece.position === -1) {
      const baseCenter = BASE_CENTERS[piece.color];
      const pieceIndex = piece.id % 4;
      const offset = PIECE_OFFSETS[pieceIndex];
      return {
        x: baseCenter.x + (offset.x * CELL_PERCENT),
        y: baseCenter.y + (offset.y * CELL_PERCENT),
      };
    }

    if (piece.position === FINISHED_POSITION) {
       return HOME_COORDS[piece.color];
    }

    if (piece.position >= HOME_STRETCH_START) {
        const step = piece.position - HOME_STRETCH_START;
        return HOME_STRETCH_COORDS[piece.color][step];
    }

    return PATH_COORDS[piece.position];
  }
}