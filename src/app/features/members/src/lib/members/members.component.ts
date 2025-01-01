import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
// import { Member } from './member.model';
import { inject } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { firstValueFrom } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
// import { environment } from '../environments/environment';
export interface Member {
  id: number;
  userName: string;
  photoUrl: string;
  age: number;
  knownAs: string;
  created: Date;
  lastActive: Date;
  gender: string;
  introduction: string;
  lookingFor: string;
  interests: string;
  city: string;
  country: string;
  photos: any[];
}

interface MembersState {
  members: Member[];
  loading: boolean;
  total: number;
  pageIndex: number;
  pageSize: number;
}

export const MembersStore = signalStore(
  { providedIn: 'root' },
  withState<MembersState>({
    members: [],
    loading: false,
    total: 0,
    pageIndex: 0,
    pageSize: 3,
  }),
  withMethods((store) => {
    const http = inject(HttpClient);

    return {
      async loadMembers(pageIndex: number, pageSize: number) {
        patchState(store, { loading: true });

        const params = new HttpParams()
          .set('pageNumber', pageIndex.toString())
          .set('pageSize', pageSize.toString());

        try {
          const response = await firstValueFrom(
            http.get<Member[]>(`https://localhost:5001/api/users`, {
              observe: 'response',
              params,
            })
          );

          patchState(store, {
            members: response.body ?? [],
            total: Number(response.headers.get('Pagination-Total')),
            loading: false,
            pageIndex,
            pageSize,
          });
        } catch (error) {
          patchState(store, { loading: false });
          throw error;
        }
      },
    };
  })
);

@Component({
  selector: 'lib-members',
  imports: [
    CommonModule,
    MatIconModule,
    MatTableModule,
    MatCardModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './members.component.html',
  styleUrl: './members.component.scss',
})
export class MembersComponent implements OnInit {
  store = inject(MembersStore);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  members = this.store.members;
  loading = this.store.loading;
  total = this.store.total;
  pageIndex = this.store.pageIndex;
  pageSize = this.store.pageSize;

  displayedColumns = ['photo', 'username', 'age', 'city'];

  ngOnInit() {
    this.store.loadMembers(0, 3);
  }

  onPageChange(event: PageEvent) {
    this.store.loadMembers(event.pageIndex, event.pageSize);
  }

  navigateToDetails(username: string): void {
    console.log('Navigating to member details:', username);
    this.router.navigate([username], { relativeTo: this.activatedRoute });
  }
}
