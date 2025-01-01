import { Route } from '@angular/router';
import { MembersComponent } from './members/members.component';

export const membersRoutes: Route[] = [
  { path: '', component: MembersComponent },
  {
    path: ':username',
    loadComponent: () =>
      import('./member-details/member-details.component').then(
        (m) => m.MemberDetailsComponent
      ),
  },
];
