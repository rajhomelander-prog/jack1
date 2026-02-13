import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { FeedComponent } from './components/feed/feed.component';
import { ProfileComponent } from './components/profile/profile.component';
import { LearnComponent } from './components/learn/learn.component';
import { MarketComponent } from './components/market/market.component';
import { ChatComponent } from './components/chat/chat.component';
import { NotificationsComponent } from './components/notifications/notifications.component';
import { SettingsComponent } from './components/settings/settings.component';
import { GameComponent } from './components/game/game.component';
import { WebNovelComponent } from './components/web-novel/web-novel.component';
import { MangaComponent } from './components/manga/manga.component';
import { LudoComponent } from './components/ludo/ludo.component';
import { TriviaComponent } from './components/trivia/trivia.component';
import { ChessComponent } from './components/chess/chess.component';
import { TicTacToeComponent } from './components/tictactoe/tictactoe.component';

export const APP_ROUTES: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'learn', component: LearnComponent },
  { path: 'market', component: MarketComponent },
  { path: 'chat', component: ChatComponent },
  { path: 'game', component: GameComponent },
  { path: 'game/ludo', component: LudoComponent, data: { showBackButton: true, backNavigationTarget: '/game' } },
  { path: 'game/trivia', component: TriviaComponent, data: { showBackButton: true, backNavigationTarget: '/game' } },
  { path: 'game/chess', component: ChessComponent, data: { showBackButton: true, backNavigationTarget: '/game' } },
  { path: 'game/tictactoe', component: TicTacToeComponent, data: { showBackButton: true, backNavigationTarget: '/game' } },
  { path: 'novel/:id', component: WebNovelComponent, data: { showBackButton: true, backNavigationTarget: '/learn' } },
  { path: 'manga/:id', component: MangaComponent, data: { showBackButton: true, backNavigationTarget: '/learn' } },
  { path: 'notifications', component: NotificationsComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '', component: FeedComponent },
  { path: '**', redirectTo: '', pathMatch: 'full' }
];