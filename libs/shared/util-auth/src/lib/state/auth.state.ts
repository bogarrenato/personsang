import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { Observable, firstValueFrom, map, tap } from 'rxjs';
import { PresenceService } from 'src/app/features/members/src/lib/member-messages/member-messages.component';

// libs/shared/auth/src/lib/types/request-state.ts
export type RequestState<TData, TError = Error> = {
  data: TData | null;
  isLoading: boolean;
  error: TError | null;
};

// libs/shared/auth/src/lib/models/auth.models.ts
export interface User {
  id: string;
  username: string;

  photoUrl: string;
  knownAs: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  loginRequest: {
    data: User | null;
    isLoading: boolean;
    error: Error | null;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = 'https://localhost:5001/api/';

  constructor(private http: HttpClient) {}

  login(credentials: LoginCredentials) {
    return this.http
      .post<User>(`${this.API_URL}account/login`, credentials, {
        observe: 'response', // Teljes response megfigyelése
        withCredentials: true, // Fontos a sütik miatt
      })
      .pipe(
        tap((response) => {
          console.log('=== Login Response Details ===');
          console.log('Status:', response.status);

          console.log('\n=== All Response Headers ===');
          response.headers.keys().forEach((key) => {
            console.log(`${key}:`, response.headers.get(key));
          });

          console.log('\n=== Set-Cookie Headers ===');
          const cookies = response.headers.getAll('Set-Cookie');
          if (cookies) {
            cookies.forEach((cookie) => console.log('Cookie:', cookie));
          }

          console.log('\n=== Current Document Cookies ===');
          console.log(document.cookie || 'No accessible cookies');

          return response.body; // Visszaadjuk az eredeti response body-t
        }),
        map((response) => response.body) // Csak a body-t adjuk vissza a subscriber-eknek
      );
  }

  logout() {
    return this.http.post(
      `${this.API_URL}account/logout`,
      {},
      {
        withCredentials: true,
      }
    );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<User>('https://localhost:5001/api/account/current');
  }
}

@Injectable({ providedIn: 'root' })
export class TokenService {
  private readonly TOKEN_KEY = 'auth_token';

  setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }
}
export interface AuthState {
  loginRequest: {
    data: User | null;
    isLoading: boolean;
    error: Error | null;
  };
}

// auth.store.ts
const initialState: AuthState = {
  loginRequest: {
    data: null,
    isLoading: false,
    error: null,
  },
};

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>(initialState),
  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.loginRequest().data),
    username: computed(() => store.loginRequest().data?.username ?? null),
    isLoading: computed(() => store.loginRequest().isLoading),
  })),
  withMethods((store, presenceService = inject(PresenceService)) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return {
      async login(credentials: LoginCredentials): Promise<void> {
        patchState(store, {
          loginRequest: { data: null, isLoading: true, error: null },
        });

        try {
          const user = await firstValueFrom(authService.login(credentials));

          patchState(store, {
            loginRequest: { data: user, isLoading: false, error: null },
          });

          // Store minimal user info in sessionStorage for page refreshes
          // sessionStorage.setItem('user_authenticated', 'true');

          router.navigate(['/members']);
        } catch (error) {
          patchState(store, {
            loginRequest: {
              data: null,
              isLoading: false,
              error: error as Error,
            },
          });
          throw error;
        }
      },

      async logout(): Promise<void> {
        try {
          // Elküldjük a kijelentkezési kérést
          await firstValueFrom(authService.logout());

          // Töröljük a sessionStorage-t
          // sessionStorage.removeItem('user_authenticated');

          // Töröljük az auth állapotot
          patchState(store, {
            loginRequest: { data: null, isLoading: false, error: null },
          });
          presenceService.stopHubConnection();

          // Átnavigálunk a login oldalra
          await router.navigate(['/login']);
        } catch (error) {
          console.error('Logout error:', error);
          throw error;
        }
      },
      clearAuth(): void {
        // sessionStorage.removeItem('user_authenticated');
        patchState(store, {
          loginRequest: {
            data: null,
            isLoading: false,
            error: null,
          },
        });
      },

      async checkAuthStatus(): Promise<void> {
        try {
          const user = await firstValueFrom(authService.getCurrentUser());

          patchState(store, {
            loginRequest: {
              data: user,
              isLoading: false,
              error: null,
            },
          });
        } catch (error) {
          // sessionStorage.removeItem('user_authenticated');
          patchState(store, {
            loginRequest: {
              data: null,
              isLoading: false,
              error: error as Error,
            },
          });
          router.navigate(['/login']);
        }
      },
    };
  })
);
