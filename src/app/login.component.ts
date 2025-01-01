import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  Renderer2,
  effect,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NotificationService } from '@my-workspace/shared/util-common';
import { LoginStore } from './app.component';
import { ThemeService } from '@my-workspace/shared/ui-common';

@Component({
  selector: 'app-login',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  title = 'my-workspace';
  notif = inject(NotificationService);
  private fb = inject(FormBuilder);
  private renderer = inject(Renderer2);
  protected loginStore = inject(LoginStore);
  private readonly router = inject(Router);

  protected themeService = inject(ThemeService);
  isDarkTheme = this.themeService.isDarkTheme;

  readonly loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    // this.notif.showSuccess('asd');
    // Téma betöltése localStorage-ból
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.isDarkTheme.set(savedTheme === 'dark');
      this.applyTheme(savedTheme === 'dark');
    }
  }

  async onSubmit() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      await this.loginStore.login(username, password);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      this.renderer.addClass(document.body, 'dark-theme');
    } else {
      this.renderer.removeClass(document.body, 'dark-theme');
    }
  }
}
