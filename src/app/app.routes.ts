import { Route } from '@angular/router';
import { AppComponent } from './app.component';
import { authGuard } from './guards/auth.guard';
import { DashboardComponent } from './dashboard.component';
import { LoginComponent } from './login.component';

export const appRoutes: Route[] = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    // canActivate: [authGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },
      //   { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'members',
        loadChildren: () => {
          // console.log('Trying to load members module');
          return import('@features/members').then((m) => {
            // console.log('Loaded module:', m);
            return m.membersRoutes;
          });
        }
      }
    ],
  },
];
