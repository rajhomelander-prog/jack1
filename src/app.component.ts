import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';
import { LeftSidebarComponent } from './components/left-sidebar/left-sidebar.component';
import { RightSidebarComponent } from './components/right-sidebar/right-sidebar.component';
import { MobileNavComponent } from './components/mobile-nav/mobile-nav.component';
import { TopNavComponent } from './components/top-nav/top-nav.component';
import { StoryViewerComponent } from './components/story-viewer/story-viewer.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    LeftSidebarComponent,
    RightSidebarComponent,
    MobileNavComponent,
    TopNavComponent,
    StoryViewerComponent
  ]
})
export class AppComponent {
  private router = inject(Router);
  private themeService = inject(ThemeService); // Initialize the theme service

  private currentUrl = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map(event => event.urlAfterRedirects)
    )
  );

  isLoginPage = computed(() => this.currentUrl() === '/login');
}