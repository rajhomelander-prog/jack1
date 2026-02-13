import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-left-sidebar',
  templateUrl: './left-sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, RouterLinkActive]
})
export class LeftSidebarComponent {
  private profileService = inject(ProfileService);
  userProfile = this.profileService.userProfile;

  navItems = signal([
    { name: 'Home', route: '/', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5' },
    { name: 'Explore', route: '/learn', icon: 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z' },
    { name: 'Game', route: '/game', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { name: 'Messages', route: '/chat', icon: 'M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193l-3.722.267c-.317.027-.631.052-.946.078a16.513 16.513 0 0 1-7.527 0c-.315-.026-.629-.051-.946-.078l-3.722-.267A2.25 2.25 0 0 1 3 14.894V10.608c0-.97.616-1.813 1.5-2.097' },
    { name: 'Notifications', route: '/notifications', icon: 'M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0' },
    { name: 'Marketplace', route: '/market', icon: 'M13.5 21v-7.5A2.25 2.25 0 0 0 11.25 11.25H4.5A2.25 2.25 0 0 0 2.25 13.5V21M3 3h18M5.25 3v18m13.5-18v18M9 6.75h6.375a3.375 3.375 0 0 1 3.375 3.375v1.5a2.25 2.25 0 0 1-2.25 2.25H9' },
  ]);
}
