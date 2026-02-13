import { Injectable, signal, computed } from '@angular/core';

export type Player = 'X' | 'O';
export type Square = Player | null;
export type Board = Square[];
export type Winner = Player | 'draw' | null;

const WINNING_COMBINATIONS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

@Injectable({
  providedIn: 'root'
})
export class TicTacToeService {
  board = signal<Board>(Array(9).fill(null));
  currentPlayer = signal<Player>('X');
  winner = signal<Winner>(null);
  winningCombination = signal<number[] | null>(null);
  
  isGameOver = computed(() => this.winner() !== null);
  isDraw = computed(() => this.winner() === 'draw');

  constructor() {
    this.startGame();
  }

  startGame(): void {
    this.board.set(Array(9).fill(null));
    this.currentPlayer.set('X');
    this.winner.set(null);
    this.winningCombination.set(null);
  }

  playerMove(index: number): void {
    if (this.board()[index] || this.isGameOver() || this.currentPlayer() === 'O') {
      return;
    }

    this.updateBoard(index, 'X');

    if (!this.isGameOver()) {
      // AI's turn
      setTimeout(() => this.aiMove(), 500);
    }
  }

  private updateBoard(index: number, player: Player): void {
    this.board.update(b => {
      const newBoard = [...b];
      newBoard[index] = player;
      return newBoard;
    });

    const winInfo = this.checkWinner(this.board());
    if (winInfo) {
      this.winner.set(winInfo.winner);
      this.winningCombination.set(winInfo.combination);
    } else if (this.board().every(square => square !== null)) {
      this.winner.set('draw');
    } else {
      this.currentPlayer.update(p => p === 'X' ? 'O' : 'X');
    }
  }

  private aiMove(): void {
    const bestMove = this.minimax(this.board(), 'O').index;
    if (bestMove !== undefined) {
      this.updateBoard(bestMove, 'O');
    }
  }

  private checkWinner(board: Board): { winner: Player, combination: number[] } | null {
    for (const combination of WINNING_COMBINATIONS) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a] as Player, combination };
      }
    }
    return null;
  }

  private minimax(currentBoard: Board, player: Player): { score: number; index?: number } {
    const availableSpots = currentBoard.map((sq, i) => sq === null ? i : null).filter(i => i !== null) as number[];

    const winInfo = this.checkWinner(currentBoard);
    if (winInfo) {
      return { score: winInfo.winner === 'O' ? 10 : -10 };
    }
    if (availableSpots.length === 0) {
      return { score: 0 };
    }

    const moves: { score: number; index: number }[] = [];

    for (const spot of availableSpots) {
      const newBoard = [...currentBoard];
      newBoard[spot] = player;
      const result = this.minimax(newBoard, player === 'O' ? 'X' : 'O');
      moves.push({ score: result.score, index: spot });
    }

    let bestMove: { score: number; index?: number };
    if (player === 'O') {
      bestMove = moves.reduce((best, move) => move.score > best.score ? move : best, { score: -Infinity });
    } else {
      bestMove = moves.reduce((best, move) => move.score < best.score ? move : best, { score: Infinity });
    }

    return bestMove;
  }
}
