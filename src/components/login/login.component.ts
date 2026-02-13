import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class LoginComponent {
  private router = inject(Router);

  login() {
    // In a real app, this would involve an auth service.
    // Here, we just navigate to the main feed.
    this.router.navigate(['/']);
  }
}
