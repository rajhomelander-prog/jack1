import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
})
export class GameComponent {
  games = [
    {
      name: 'Astrology Trivia Challenge',
      description: 'Test your cosmic knowledge. You have 3 lives. Answer before the timer runs out!',
      link: '/game/trivia',
      icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'
    },
    {
      name: 'Classic Ludo',
      description: 'The original board game experience. A nostalgic and authentic game for all ages.',
      link: '/game/ludo',
      icon: 'M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9'
    },
    {
      name: 'Classic Chess',
      description: 'The ultimate game of strategy. Plan your moves and outwit your opponent.',
      link: '/game/chess',
      icon: 'm18 10 1.5-1.5a2.121 2.121 0 0 0-3-3L15 7l.5 3.5-2 2-3-1-1.5 3 3.5 1.5 2-2L18 10Z M21 21h-2v-2h-2v-2h-2v-2h-2v-2h-2V9h-2V7h-2V5h-2V3h2v2h2v2h2v2h2v2h2v2h2v2h2v2Z'
    },
    {
      name: 'Tic-Tac-Toe',
      description: 'A classic game of wits. Can you beat the unbeatable AI?',
      link: '/game/tictactoe',
      icon: 'M6 18 18 6M6 6l12 12'
    }
  ];
}
