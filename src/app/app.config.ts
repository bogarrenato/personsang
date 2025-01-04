import {
  ApplicationConfig,
  importProvidersFrom,
  makeEnvironmentProviders,
  provideZoneChangeDetection,
  // APP_EFFECTS,
  ENVIRONMENT_INITIALIZER,
  APP_INITIALIZER,
  inject,
  provideAppInitializer,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { appRoutes } from './app.routes';
import { ToastrModule, provideToastr } from 'ngx-toastr';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthStore } from '@my-workspace/shared/util-auth';
// import { provideStore } from '@ngrx/signals';
// export function initializeAuth(authStore: AuthStore) {
//   return () => authStore.checkAuthStatus();
// }

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.token();


  if (token) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(authReq);
  }

  return next(req);
};


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    // AuthSto,
    provideAnimations(), // szükséges az animációkhoz
    provideHttpClient(withInterceptors([tokenInterceptor])),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
    }),
    importProvidersFrom([ToastrModule.forRoot()]),
    provideAnimationsAsync(),

    AuthStore, // Provide the store
    provideAppInitializer(async () => {
      const store = inject(AuthStore);
      await store.checkAuthStatus();
      return Promise.resolve();
    }),
  ],
};
