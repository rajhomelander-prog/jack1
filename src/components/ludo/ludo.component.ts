import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LudoService } from '../../services/ludo.service';
import { GameStatus, PlayerColor, Piece } from '../../services/ludo.service';

@Component({
  selector: 'app-ludo',
  templateUrl: './ludo.component.html',
  styleUrls: ['./ludo.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class LudoComponent {
  ludoService = inject(LudoService);

  gameState = this.ludoService.gameState;
  players = this.ludoService.players;
  activePlayer = this.ludoService.activePlayer;
  diceValue = this.ludoService.diceValue;
  winner = this.ludoService.winner;
  movablePieces = this.ludoService.movablePieces;

  // Expose for template
  PlayerColor = PlayerColor;
  GameStatus = GameStatus;
  
  // A map to get player object by color for easier access in template
  playerMap = computed(() => {
    const map = new Map<PlayerColor, any>();
    this.players().forEach(p => map.set(p.color, p));
    return map;
  });

  diceAnimationClass = computed(() => {
    if (this.gameState().isRolling) {
      return 'rolling';
    }
    return `show-${this.diceValue()}`;
  });

  startGame() {
    this.ludoService.startGame();
  }

  rollDice() {
    this.ludoService.rollDice();
  }
  
  movePiece(pieceId: number) {
    this.ludoService.movePiece(pieceId);
  }

  getPiecePosition(piece: Piece) {
    return this.ludoService.getPiecePosition(piece);
  }
}
