import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { Chess, Square, Piece, PieceSymbol, Color } from 'chess.js';

export type GameStatus = 'Lobby' | 'InProgress' | 'GameOver';

export interface GameState {
  status: GameStatus;
  turn: Color;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  winner?: Color;
}

export interface CapturedPieces {
  w: Piece[];
  b: Piece[];
}

@Injectable({
  providedIn: 'root'
})
export class ChessService {
  private chess = new Chess();
  
  // --- STATE SIGNALS ---
  gameState: WritableSignal<GameState> = signal(this.createGameState());
  board = signal(this.chess.board());
  selectedSquare = signal<Square | null>(null);
  capturedPieces = signal<CapturedPieces>({ w: [], b: [] });

  // --- COMPUTED SIGNALS ---
  legalMoves = computed(() => {
    const square = this.selectedSquare();
    if (!square) return [];
    return this.chess.moves({ square, verbose: true }).map(move => move.to);
  });

  // --- PUBLIC METHODS ---
  startGame(): void {
    this.chess.reset();
    this.board.set(this.chess.board());
    this.gameState.set(this.createGameState());
    this.selectedSquare.set(null);
    this.capturedPieces.set({ w: [], b: [] });
  }

  handleSquareClick(square: Square): void {
    if (this.gameState().status === 'GameOver') return;

    const currentSelection = this.selectedSquare();
    const pieceOnSquare = this.chess.get(square);
    const currentPlayer = this.gameState().turn;

    // If clicking on a piece of the current player
    if (pieceOnSquare && pieceOnSquare.color === currentPlayer) {
      this.selectedSquare.set(square);
      return;
    }

    // If a piece is selected and the click is a valid move
    if (currentSelection) {
      const isLegal = this.legalMoves().includes(square);
      if (isLegal) {
        this.movePiece(currentSelection, square);
      } else {
        // If clicking on another of your pieces, switch selection, otherwise deselect
        if (pieceOnSquare && pieceOnSquare.color === currentPlayer) {
          this.selectedSquare.set(square);
        } else {
          this.selectedSquare.set(null);
        }
      }
    }
  }

  // --- PRIVATE HELPER METHODS ---
  private movePiece(from: Square, to: Square): void {
    const move = this.chess.move({ from, to });
    
    // Handle capture
    if (move && move.captured) {
      const captured: Piece = { color: move.color === 'w' ? 'b' : 'w', type: move.captured };
      this.capturedPieces.update(caps => {
          const newCaps = { ...caps };
          if(captured.color === 'b') newCaps.w.push(captured);
          else newCaps.b.push(captured);
          return newCaps;
      });
    }

    // Update state
    this.board.set(this.chess.board());
    this.gameState.set(this.createGameState());
    this.selectedSquare.set(null);
  }

  private createGameState(): GameState {
    const status = this.chess.isGameOver() ? 'GameOver' : 'InProgress';
    let winner: Color | undefined = undefined;
    
    if (this.chess.isCheckmate()) {
        winner = this.chess.turn() === 'w' ? 'b' : 'w';
    }

    return {
      status: status,
      turn: this.chess.turn(),
      isCheck: this.chess.isCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isStalemate: this.chess.isStalemate(),
      isDraw: this.chess.isDraw(),
      winner: winner
    };
  }
}