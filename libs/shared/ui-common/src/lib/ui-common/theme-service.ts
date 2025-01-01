import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private document = inject(DOCUMENT);
  isDarkTheme = signal<boolean>(this.loadInitialTheme());

  constructor() {
    this.setupThemeEffect();
  }

  private loadInitialTheme(): boolean {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.applyTheme(savedTheme === 'dark');
      return savedTheme === 'dark';
    }
    return false;
  }

  private setupThemeEffect(): void {
    effect(() => {
      const isDark = this.isDarkTheme();
      this.applyTheme(isDark);
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
  }

  toggleTheme(): void {
    this.isDarkTheme.update((dark) => !dark);
  }

  private applyTheme(isDark: boolean): void {
    const html = this.document.documentElement;
    if (isDark) {
      html.classList.add('dark-theme');
    } else {
      html.classList.remove('dark-theme');
    }
  }
}
