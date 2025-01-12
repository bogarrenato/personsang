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
import { Router, provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { appRoutes } from './app.routes';
import { ToastrModule, provideToastr } from 'ngx-toastr';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { AuthStore } from '@my-workspace/shared/util-auth';
import { catchError, throwError } from 'rxjs';
import { PresenceService } from './features/members/src/lib/member-messages/member-messages.component';
// import { provideStore } from '@ngrx/signals';
// export function initializeAuth(authStore: AuthStore) {
//   return () => authStore.checkAuthStatus();
// }

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  // Először klónozzuk a kérést a withCredentials beállítással
  const modifiedReq = req.clone({
    withCredentials: true,
  });

  // Visszatérünk a módosított kéréssel és kezeljük a hibákat
  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // Unauthorized - töröljük az auth állapotot és átirányítunk
        console.log('Unauthorized request, redirecting to login');
        authStore.clearAuth(); // Ezt implementálni kell az AuthStore-ban
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  // const token = authStore.token();

  // if (token) {
  //   const authReq = req.clone({
  //     setHeaders: {
  //       Authorization: `Bearer ${token}`,
  //     },
  //   });
  //   return next(authReq);
  // }

  return next(req);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    // AuthSto,
    provideAnimations(), // szükséges az animációkhoz
    provideHttpClient(withInterceptors([authInterceptor])),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
    }),
    importProvidersFrom([ToastrModule.forRoot()]),
    provideAnimationsAsync(),

    AuthStore, // Provide the store
    PresenceService,
    provideAppInitializer(async () => {
      const store = inject(AuthStore);
      const presenceService = inject(PresenceService);
      try {
        await store.checkAuthStatus();

        presenceService.createHubConnection();
        console.error('LEFUT AZ INIT HUB');
      } catch (error) {}
      return Promise.resolve();
    }),
  ],
};
