import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-mobile-nav',
  templateUrl: './mobile-nav.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, RouterLinkActive]
})
export class MobileNavComponent {
  navItems = signal([
    { name: 'Home', route: '/', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5' },
    { name: 'People', route: '/profile', icon: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-1.063M15 19.128v-3.328a4.5 4.5 0 0 0-3-4.128M15 19.128v-3.328a4.5 4.5 0 0 1 3-4.128M15 19.128c-3.336 0-6.463-1.256-8.829-3.421M12 11.628a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0Zm-9 0a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0Z' },
    { name: 'Game', route: '/game', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Market', route: '/market', icon: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941' },
    { name: 'Notify', route: '/notifications', icon: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0' },
  ]);
}