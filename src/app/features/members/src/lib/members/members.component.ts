import { Component, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
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
interface PaginationHeader {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
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

        // Convert frontend 0-based index to backend 1-based index
        const backendPageNumber = pageIndex + 1;

        const params = new HttpParams()
          .set('pageNumber', backendPageNumber.toString())
          .set('pageSize', pageSize.toString());

        try {
          const response = await firstValueFrom(
            http.get<Member[]>(`https://localhost:5001/api/users`, {
              observe: 'response',
              params,
            })
          );

          // Alapértelmezett értékek
          let currentPage = pageIndex;
          let itemsPerPage = pageSize;
          let totalItems = 0;

          // Pagination header feldolgozása
          const paginationHeader = response.headers.get('Pagination');
          if (paginationHeader) {
            try {
              const parsed = JSON.parse(paginationHeader) as PaginationHeader;
              // Csak akkor frissítjük az értékeket, ha sikeresen parse-oltuk
              currentPage = parsed.currentPage > 0 ? parsed.currentPage - 1 : 0;
              itemsPerPage = parsed.itemsPerPage;
              totalItems = parsed.totalItems;
            } catch (error) {
              console.error('Failed to parse pagination header:', error);
            }
          }

          patchState(store, {
            members: response.body ?? [],
            total: totalItems,
            pageIndex: currentPage,
            pageSize: itemsPerPage,
            loading: false,
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
  standalone: true,
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
  pageSizeOptions = [3, 5, 10, 25]; // Added 3 to match initial pageSize

  ngOnInit() {
    // Initial load with stored pageIndex and pageSize
    this.store.loadMembers(this.pageIndex(), this.pageSize());
  }

  onPageChange(event: PageEvent) {
    // Update store and load new data
    this.store.loadMembers(event.pageIndex, event.pageSize);
  }

  navigateToDetails(username: string): void {
    this.router.navigate([username], { relativeTo: this.activatedRoute });
  }
}
