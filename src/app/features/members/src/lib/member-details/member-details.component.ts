import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, map, tap } from 'rxjs';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { Member } from '../members/members.component';
import { HttpClient } from '@angular/common/http';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
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
  protected store = inject(MemberDetailsStore);
  private route = inject(ActivatedRoute);
  private messageStore = inject(MessageStore);

  ngOnInit() {
    this.route.params
      .pipe(
        map((params) => params['username']),
        tap((username) => {
          // console.log(username);
          this.store.loadMember(username);
        })
      )
      .subscribe();
  }


  onTabChange(event: MatTabChangeEvent) {
    // Ha elnavigálunk a Messages tabról, leállítjuk a connection-t
    if (event.index !== 3) {
      this.messageStore.stopHubConnection();
    }
  }

  ngOnDestroy() {
    // Komponens megsemmisülésekor is állítsuk le a connection-t
    this.messageStore.stopHubConnection();
  }
}
