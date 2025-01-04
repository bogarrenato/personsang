import {
  Component,
  Injectable,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthStore } from '@my-workspace/shared/util-auth';
import {
  signalStore,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { patchState } from '@ngrx/signals';
import { DOCUMENT } from '@angular/common';
import { NavbarComponent } from './navbar.component';
import { PresenceService } from './features/members/src/lib/member-messages/member-messages.component';

export interface IAuthService {
  login(username: string, password: string): Promise<void>;
}

// auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService implements IAuthService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string): Promise<void> {
    return firstValueFrom(
      this.http.post<void>('https://localhost:5001/api/account/login', {
        username,
        password,
      })
    );
  }
}

type LoadingState = 'init' | 'loading' | 'loaded';
type ErrorState = { status: 'error'; error: string };
export type CallState = LoadingState | ErrorState;

// Type guard a hibakezeléshez
function isErrorState(state: CallState): state is ErrorState {
  return typeof state === 'object' && state.status === 'error';
}

export function withCallState() {
  return signalStoreFeature(
    withState<{ callState: CallState }>({ callState: 'init' }),
    withComputed(({ callState }) => ({
      loading: computed(() => callState() === 'loading'),
      loaded: computed(() => callState() === 'loaded'),
      error: computed(() => {
        const state = callState();
        return isErrorState(state) ? state.error : null;
      }),
    }))
  );
}

export interface LoginState {
  username: string;
  password: string;
}
export const LoginStore = signalStore(
  { providedIn: 'root' },
  withState<LoginState>({
    username: '',
    password: '',
  }),
  withCallState(),
  withMethods(
    (store, authStore = inject(AuthStore), router = inject(Router)) => ({
      async login(username: string, password: string) {
        patchState(store, {
          username,
          password,
          callState: 'loading',
        });

        try {
          await authStore.login({ username, password });
          // router.navigate(['/dashboard']);
          patchState(store, { callState: 'loaded' });
        } catch (error) {
          patchState(store, {
            callState: {
              status: 'error',
              error: (error as Error).message,
            },
          });
        }
      },

      resetForm() {
        patchState(store, {
          username: '',
          password: '',
          callState: 'init',
        });
      },
    })
  )
);
@Component({
  standalone: true,
  imports: [RouterOutlet, NavbarComponent],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  presenceService = inject(PresenceService);
  ngOnInit(): void {
    const storedUser = sessionStorage.getItem('user');
    console.log(storedUser)
    if (!storedUser) return;

    const user = JSON.parse(storedUser);
    this.presenceService.createHubConnection(user);
  }
}
