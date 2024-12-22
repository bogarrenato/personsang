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
  token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  loginRequest: RequestState<User>;
}

import { HttpClient } from '@angular/common/http';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
// libs/shared/auth/src/lib/store/auth.store.ts
import { Injectable, computed, inject } from '@angular/core';
import {
    patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = '/api/auth';

  constructor(private http: HttpClient) {}

  login(credentials: LoginCredentials) {
    return this.http.post<User>(`${this.API_URL}/login`, credentials);
  }
}

const initialState: AuthState = {
  loginRequest: {
    data: null,
    isLoading: false,
    error: null,
  },
};

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

export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>(initialState),
  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.loginRequest().data),
    username: computed(() => store.loginRequest().data?.username ?? null),
    isLoading: computed(() => store.loginRequest().isLoading),
  })),
  withMethods((store) => {
    // Inject dependencies
    const authService = inject(AuthService);
    const tokenService = inject(TokenService);

    return {
      login: rxMethod<LoginCredentials>(
        pipe(
          tap(() => {
            patchState(store, {
              loginRequest: {
                data: null,
                isLoading: true,
                error: null,
              },
            });
          }),
          switchMap((credentials) =>
            authService.login(credentials).pipe(
              tap((user) => {
                tokenService.setToken(user.token);
                patchState(store, {
                  loginRequest: {
                    data: user,
                    isLoading: false,
                    error: null,
                  },
                });
              }),
              catchError((error: Error) => {
                patchState(store, {
                  loginRequest: {
                    data: null,
                    isLoading: false,
                    error,
                  },
                });
                return of(null);
              })
            )
          )
        )
      ),
      logout() {
        tokenService.removeToken();
        patchState(store, initialState);
      },
    };
  })
);
