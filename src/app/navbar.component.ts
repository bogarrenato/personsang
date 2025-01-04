import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { AuthStore } from '@my-workspace/shared/util-auth';
import { Router } from '@angular/router';
import { ThemeService } from '@my-workspace/shared/ui-common';

@Component({
  selector: 'app-navbar',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatMenuModule,
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  authStore = inject(AuthStore);
  router = inject(Router);
  protected themeService = inject(ThemeService);
  isDarkTheme = this.themeService.isDarkTheme;

  getProfileImage(): string {
    // Return a default avatar if no profile image is available
    return 'https://www.gravatar.com/avatar/default?s=200';
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }

  logout(): void {
    // Implement logout logic here
    // You might want to call a method from your AuthStore
    this.router.navigate(['/login']);
  }

  navigateToMembers() {
    this.router.navigate(['/members']);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  getThemeIcon(): string {
    return this.isDarkTheme() ? 'light_mode' : 'dark_mode';
  }

  getThemeText(): string {
    return this.isDarkTheme() ? 'Light Mode' : 'Dark Mode';
  }

  // navigateToMembers() {
  //   this.router.navigate(['/members']);
  // }
}
