import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicTacToeService } from '../../services/tictactoe.service';

@Component({
  selector: 'app-tictactoe',
  templateUrl: './tictactoe.component.html',
  styleUrls: ['./tictactoe.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class TicTacToeComponent {
  private gameService = inject(TicTacToeService);

  board = this.gameService.board;
  currentPlayer = this.gameService.currentPlayer;
  winner = this.gameService.winner;
  isGameOver = this.gameService.isGameOver;
  winningCombination = this.gameService.winningCombination;

  statusMessage = computed(() => {
    if (this.isGameOver()) {
      const win = this.winner();
      if (win === 'X') return 'You Win!';
      if (win === 'O') return 'AI Wins!';
      return "It's a Draw!";
    }
    return this.currentPlayer() === 'X' ? 'Your Turn' : 'AI is thinking...';
  });
  
  winnerLineClass = computed(() => {
    const combo = this.winningCombination();
    if (!combo) return '';
    
    // Rows
    if (combo.join('') === '012') return 'win-row-1';
    if (combo.join('') === '345') return 'win-row-2';
    if (combo.join('') === '678') return 'win-row-3';
    
    // Columns
    if (combo.join('') === '036') return 'win-col-1';
    if (combo.join('') === '147') return 'win-col-2';
    if (combo.join('') === '258') return 'win-col-3';

    // Diagonals
    if (combo.join('') === '048') return 'win-diag-1';
    if (combo.join('') === '246') return 'win-diag-2';
    
    return '';
  });

  handleSquareClick(index: number): void {
    this.gameService.playerMove(index);
  }

  startGame(): void {
    this.gameService.startGame();
  }
}
