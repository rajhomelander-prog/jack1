import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-trivia',
  templateUrl: './trivia.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class TriviaComponent {
  gameService = inject(GameService);

  session = this.gameService.gameSession;
  timer = this.gameService.timer;
  results = this.gameService.results;

  startGame(): void {
    this.gameService.startGame();
  }

  submitAnswer(optionId: string): void {
    this.gameService.submitAnswer(optionId);
  }
}
