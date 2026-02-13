import { Injectable, signal, effect, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Theme = 'dark' | 'midnight' | 'light' | 'solarized' | 'dracula' | 'nord' | 'rose-pine' | 'gruvbox' | 'monokai' | 'synthwave';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  
  theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
        effect(() => {
            const currentTheme = this.theme();
            document.documentElement.classList.remove('theme-dark', 'theme-midnight', 'theme-light', 'theme-solarized', 'theme-dracula', 'theme-nord', 'theme-rose-pine', 'theme-gruvbox', 'theme-monokai', 'theme-synthwave');
            document.documentElement.classList.add(`theme-${currentTheme}`);
        });
    }
  }

  private getInitialTheme(): Theme {
    if (isPlatformBrowser(this.platformId)) {
        try {
            const savedTheme = localStorage.getItem('vichara-theme');
            if (savedTheme === 'dark' || savedTheme === 'midnight' || savedTheme === 'light' || savedTheme === 'solarized' || savedTheme === 'dracula' || savedTheme === 'nord' || savedTheme === 'rose-pine' || savedTheme === 'gruvbox' || savedTheme === 'monokai' || savedTheme === 'synthwave') {
                return savedTheme;
            }
        } catch (e) {
            console.error('Could not access localStorage for theme', e);
        }
    }
    return 'dark'; // Default theme
  }

  setTheme(theme: Theme) {
    this.theme.set(theme);
    if (isPlatformBrowser(this.platformId)) {
        try {
            localStorage.setItem('vichara-theme', theme);
        } catch (e) {
            console.error('Could not save theme to localStorage', e);
        }
    }
  }
}