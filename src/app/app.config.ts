import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { appRoutes } from './app.routes';
import { ToastrModule, provideToastr } from 'ngx-toastr';
import { provideHttpClient } from '@angular/common/http';
// import { provideStore } from '@ngrx/signals';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),
    // AuthSto,
    provideAnimations(), // szükséges az animációkhoz
    provideHttpClient(),
    provideToastr({
      timeOut: 3000,
      positionClass: 'toast-top-right',
    }),
    importProvidersFrom([ToastrModule.forRoot()]),
  ],
};
