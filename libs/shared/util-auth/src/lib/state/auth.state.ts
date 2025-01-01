import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';

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
  token: string | null;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API_URL = 'https://localhost:5001/api/';

  constructor(private http: HttpClient) {}

  login(credentials: LoginCredentials) {
    return this.http.post<User>(`${this.API_URL}account/login`, credentials);
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
  token: string | null; // Add token to state
}
export const initialState: AuthState = {
  loginRequest: {
    data: null,
    isLoading: false,
    error: null,
  },
  token: null,
};
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState<AuthState>(initialState),
  withComputed((store) => ({
    isAuthenticated: computed(() => !!store.loginRequest().data),
    username: computed(() => store.loginRequest().data?.username ?? null),
    isLoading: computed(() => store.loginRequest().isLoading),
    token: computed(() => store.token()),
  })),
  withMethods((store) => {
    const authService = inject(AuthService);
    const tokenService = inject(TokenService);

    return {
      async login(credentials: LoginCredentials): Promise<void> {
        patchState(store, {
          loginRequest: { data: null, isLoading: true, error: null },
          token: null,
        });

        try {
          const user = await firstValueFrom(authService.login(credentials));
          tokenService.setToken(user.token);

          patchState(store, {
            loginRequest: { data: user, isLoading: false, error: null },
            token: user.token,
          });
        } catch (error) {
          patchState(store, {
            loginRequest: {
              data: null,
              isLoading: false,
              error: error as Error,
            },
            token: null,
          });
          throw error;
        }
      },
    };
  })
);
