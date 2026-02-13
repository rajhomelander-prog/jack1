import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChessService, GameStatus, CapturedPieces } from '../../services/chess.service';
import { Square, Piece } from 'chess.js';

@Component({
  selector: 'app-chess',
  templateUrl: './chess.component.html',
  styleUrls: ['./chess.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class ChessComponent {
  private chessService = inject(ChessService);

  // --- Signals from Service ---
  board = this.chessService.board;
  gameState = this.chessService.gameState;
  selectedSquare = this.chessService.selectedSquare;
  legalMoves = this.chessService.legalMoves;
  capturedPieces = this.chessService.capturedPieces;

  // --- Local Properties ---
  files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  
  // SVG paths for chess pieces
  pieceSvgs: { [key: string]: string } = {
    'wk': 'assets/chess/wK.svg',
    'wq': 'assets/chess/wQ.svg',
    'wr': 'assets/chess/wR.svg',
    'wb': 'assets/chess/wB.svg',
    'wn': 'assets/chess/wN.svg',
    'wp': 'assets/chess/wP.svg',
    'bk': 'assets/chess/bK.svg',
    'bq': 'assets/chess/bQ.svg',
    'br': 'assets/chess/bR.svg',
    'bb': 'assets/chess/bB.svg',
    'bn': 'assets/chess/bN.svg',
    'bp': 'assets/chess/bP.svg'
  };
  
   // --- Game Status Message ---
   gameStatusMessage = computed(() => {
    const state = this.gameState();
    if (state.status === 'GameOver') {
      if (state.isCheckmate) return `Checkmate! ${state.winner === 'w' ? 'White' : 'Black'} wins.`;
      if (state.isStalemate) return 'Stalemate! The game is a draw.';
      if (state.isDraw) return 'Draw!';
      return 'Game Over';
    }
    const turn = state.turn === 'w' ? 'White' : 'Black';
    if (state.isCheck) return `${turn}'s Turn (Check!)`;
    return `${turn}'s Turn`;
  });

  // --- Methods ---
  newGame(): void {
    this.chessService.startGame();
  }

  onSquareClick(rankIndex: number, fileIndex: number): void {
    const square = this.getSquare(rankIndex, fileIndex);
    this.chessService.handleSquareClick(square);
  }

  isSquareSelected(rankIndex: number, fileIndex: number): boolean {
    return this.selectedSquare() === this.getSquare(rankIndex, fileIndex);
  }

  isLegalMove(rankIndex: number, fileIndex: number): boolean {
    return this.legalMoves().includes(this.getSquare(rankIndex, fileIndex));
  }

  getPieceImage(piece: Piece | null): string | null {
    if (!piece) return null;
    const key = `${piece.color}${piece.type}`;
    return this.pieceSvgs[key] || null;
  }

  private getSquare(rankIndex: number, fileIndex: number): Square {
    return `${this.files[fileIndex]}${this.ranks[rankIndex]}` as Square;
  }
}