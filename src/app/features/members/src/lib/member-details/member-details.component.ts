import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, firstValueFrom, map, skip, take, takeUntil, tap } from 'rxjs';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Member } from '../members/members.component';
import { HttpClient } from '@angular/common/http';
import { MatTabChangeEvent, MatTabGroup, MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MemberMessagesComponent, MessageStore } from "../member-messages/member-messages.component";

export const MemberDetailsStore = signalStore(
  { providedIn: 'root' },
  withState<{ 
    member: Member | null,
    selectedUser: string | null 
  }>({ 
    member: null,
    selectedUser: null 
  }),
  withMethods((store) => {
    const http = inject(HttpClient);
    return {
      async loadMember(username: string) {
        patchState(store, { selectedUser: username });
        const member = await firstValueFrom(
          http.get<Member>(`https://localhost:5001/api/users/${username}`)
        );
        patchState(store, { member });
      },
    };
  })
);
@Component({
  selector: 'lib-member-details',
  imports: [CommonModule, MatTabsModule, MatIconModule, MemberMessagesComponent],
  templateUrl: './member-details.component.html',
  styleUrl: './member-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberDetailsComponent implements OnInit, OnDestroy {
  @ViewChild('tabGroup') tabGroup!: MatTabGroup;
  
  protected store = inject(MemberDetailsStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageStore = inject(MessageStore);
  private destroy$ = new Subject<void>();

  // Új property a selected tab indexhez
  protected selectedTabIndex = 0;

  ngOnInit() {
    this.route.params
      .pipe(
        map((params) => params['username']),
        tap((username) => {
          this.store.loadMember(username);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();

    // Query params figyelése és selectedTabIndex beállítása
    this.route.queryParams
      .pipe(
        takeUntil(this.destroy$),
        tap(params => {
          if (params['tab'] !== undefined) {
            this.selectedTabIndex = parseInt(params['tab']);
          }
        })
      )
      .subscribe();
  }

  onTabChange(event: MatTabChangeEvent) {
    if (event.index !== 3) {
      this.messageStore.stopHubConnection();
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: event.index },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  ngOnDestroy() {
    this.messageStore.stopHubConnection();
    this.destroy$.next();
    this.destroy$.complete();
  }
}