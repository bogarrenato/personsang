import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injectable,
  Input,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  Observable,
  Subject,
  catchError,
  debounceTime,
  firstValueFrom,
  map,
  take,
  takeUntil,
} from 'rxjs';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { AuthStore, User } from '@my-workspace/shared/util-auth';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import { MatInputModule } from '@angular/material/input';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

export interface Pagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  result: T;
  pagination: Pagination;
}

export interface Message {
  id: number;
  senderId: number;
  senderUsername: string;
  senderPhotoUrl: string;
  recipientId: number;
  recipientUsername: string;
  recipientPhotoUrl: string;
  content: string;
  dateRead?: Date;
  messageSent: Date;
}

export interface Group {
  name: string;
  connections: Connection[];
}

interface Connection {
  connectionId: string;
  username: string;
}

const DEFAULT_PAGINATION: Pagination = {
  currentPage: 1,
  itemsPerPage: 10,
  totalItems: 0,
  totalPages: 0,
};

function parsePaginationHeader(header: string | null): Pagination {
  if (!header) return DEFAULT_PAGINATION;

  try {
    return JSON.parse(header);
  } catch {
    // console.warn('Failed to parse pagination header, using default values');
    return DEFAULT_PAGINATION;
  }
}

export function getPaginatedResult<T>(
  url: string,
  params: HttpParams,
  http: HttpClient
): Observable<PaginatedResult<T>> {
  return http
    .get<T>(url, {
      observe: 'response',
      params,
    })
    .pipe(
      map((response) => {
        if (!response.body) {
          throw new Error('Server returned empty response body');
        }

        const paginatedResult: PaginatedResult<T> = {
          result: response.body,
          pagination: parsePaginationHeader(response.headers.get('Pagination')),
        };

        return paginatedResult;
      }),
      catchError((error) => {
        // console.error('Error fetching paginated data:', error);
        throw error;
      })
    );
}

export function getPaginationHeaders(
  pageNumber: number,
  pageSize: number
): HttpParams {
  return new HttpParams()
    .set('pageNumber', pageNumber.toString())
    .set('pageSize', pageSize.toString());
}

export type MessageContainer = 'Unread' | 'Inbox' | 'Outbox';

export const environment = {
  production: false,
  apiUrl: 'https://localhost:5001/api/',
  hubUrl: 'https://localhost:5001/hubs/',
};


@Injectable({
  providedIn: 'root',
})
export class PresenceService {
  hubUrl = environment.hubUrl;
  private hubConnection: HubConnection | undefined;

  // BehaviorSubject helyett Signal
  private onlineUsersSource = signal<string[]>([]);
  onlineUsers = this.onlineUsersSource.asReadonly();

  constructor(private toastr: ToastrService, private router: Router) {}

  createHubConnection(user: User) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl + 'presence', {
        accessTokenFactory: () => user.token,
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection.start().catch((error) => console.log(error));

    this.hubConnection.on('UserIsOnline', (username) => {
      // Signal update online users
      this.onlineUsersSource.update((users: string[]) => [...users, username]);
    });

    this.hubConnection.on('UserIsOffline', (username) => {
      // Signal update offline users
      this.onlineUsersSource.update((users: string[]) =>
        users.filter((x) => x !== username)
      );
    });

    this.hubConnection.on('GetOnlineUsers', (usernames: string[]) => {
      // Signal set online users
      this.onlineUsersSource.set(usernames);
    });

    this.hubConnection.on('NewMessageReceived', ({ username, knownAs }) => {
      this.toastr
        .info(knownAs + ' has sent you a new message!')
        .onTap.pipe(take(1))
        .subscribe(() =>
          this.router.navigateByUrl('/members/' + username + '?tab=3')
        );
    });
  }

  stopHubConnection() {
    if (!this.hubConnection) return;
    this.hubConnection.stop().catch((error) => console.log(error));
  }
}




@Injectable({
  providedIn: 'root',
})
export class MessageService {
  baseUrl = environment.apiUrl;
  hubUrl = environment.hubUrl;
  private hubConnection: HubConnection | undefined;
  private messageThreadSource = new BehaviorSubject<Message[]>([]);
  messageThread$ = this.messageThreadSource.asObservable();

  constructor(private http: HttpClient) {}

  createHubConnection(user: User, otherUsername: string) {
    this.hubConnection = new HubConnectionBuilder()
      .withUrl(this.hubUrl + 'message?user=' + otherUsername, {
        accessTokenFactory: () => user.token,
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .catch((error) => console.log(error))
      .finally(() => {});

    this.hubConnection.on('ReceiveMessageThread', (messages) => {
      this.messageThreadSource.next(messages);
    });

    this.hubConnection.on('NewMessage', (message) => {
      this.messageThread$.pipe(take(1)).subscribe((messages) => {
        this.messageThreadSource.next([...messages, message]);
      });
    });

    this.hubConnection.on('UpdatedGroup', (group: Group) => {  // Itt group és nem {connections}
      this.messageThread$.pipe(take(1)).subscribe((messages) => {  // take(1) kell, különben memory leak!
        // Új tömböt hozunk létre a változások miatt
        const updatedMessages = messages.map(message => ({
          ...message,
          dateRead: message.dateRead || new Date()
        }));
        this.messageThreadSource.next(updatedMessages);
      });
    });
  }

  stopHubConnection() {
    if (this.hubConnection) {
      this.messageThreadSource.next([]);
      this.hubConnection.stop();
    }
  }

  getMessages(
    pageNumber: number,
    pageSize: number,
    container: MessageContainer
  ): Observable<PaginatedResult<Message[]>> {
    const params = getPaginationHeaders(pageNumber, pageSize).set(
      'Container',
      container
    );

    return getPaginatedResult<Message[]>(
      `${this.baseUrl}messages`,
      params,
      this.http
    );
  }

  getMessageThread(username: string) {
    return this.http.get<Message[]>(
      this.baseUrl + 'messages/thread/' + username
    );
  }

  async sendMessage(username: string, content: string) {
    if (!this.hubConnection) {
      return;
    }
    return this.hubConnection
      .invoke('SendMessage', { recipientUsername: username, content })
      .catch((error) => console.log(error));
  }

  deleteMessage(id: number) {
    return this.http.delete(this.baseUrl + 'messages/' + id);
  }
}

export interface MessageState {
  messages: Message[];
  pagination: Pagination | null;
  loading: boolean;
  sending: boolean;
  activeMessage: Message | null;
}

export const initialState: MessageState = {
  messages: [],
  pagination: null,
  loading: false,
  sending: false,
  activeMessage: null,
};
// message.store.ts
export const MessageStore = signalStore(
  { providedIn: 'root' },
  withState<MessageState>(initialState),
  withComputed((store) => ({
    isLoading: computed(() => store.loading()),
    isSending: computed(() => store.sending()),
  })),
  withMethods((store) => {
    const messageService = inject(MessageService);
    const authStore = inject(AuthStore);
    const destroyRef = inject(DestroyRef);

    // SignalR üzenetek figyelése
    messageService.messageThread$
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((messages) => {
        if (messages.length > 0) {
          patchState(store, { messages });
        }
      });

    return {
      async loadMessageThread(username: string) {
        patchState(store, { loading: true });

        try {
          const messages = await firstValueFrom(
            messageService.getMessageThread(username)
          );

          // SignalR kapcsolat létrehozása
          const currentUser = authStore.loginRequest().data;
          if (currentUser) {
            messageService.createHubConnection(currentUser, username);
          }

          patchState(store, {
            messages: messages,
            loading: false,
          });
        } catch (error) {
          console.error('Failed to load message thread:', error);
          patchState(store, { loading: false });
        }
      },

      async sendMessage(recipientUsername: string, content: string) {
        patchState(store, { sending: true });

        try {
          await messageService.sendMessage(recipientUsername, content);
          // Itt nem szükséges manuálisan frissíteni a messages-t,
          // mert a SignalR subscription automatikusan frissíti
          patchState(store, { sending: false });
        } catch (error) {
          console.error('Failed to send message:', error);
          patchState(store, { sending: false });
        }
      },

      setActiveMessage(message: Message) {
        patchState(store, { activeMessage: message });
      },

      stopHubConnection() {
        messageService.stopHubConnection();
      },
    };
  })
);

@Component({
  selector: 'lib-member-messages',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
  ],
  templateUrl: './member-messages.component.html',
  styleUrl: './member-messages.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberMessagesComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;
  username = input.required<string>();
  messageForm: FormGroup;
  protected readonly messageStore = inject(MessageStore);
  protected readonly authStore = inject(AuthStore);
  private destroy$ = new Subject<void>();

  constructor(private fb: FormBuilder, private messageService: MessageService) {
    this.messageForm = this.fb.group(
      {
        content: [''], // Először validátorok nélkül hozzuk létre
      },
      {
        updateOn: 'submit', // Form szinten állítjuk be, hogy csak submit-nál validáljon
      }
    );
  }

  ngOnInit() {
    if (this.username) {
      this.messageStore.loadMessageThread(this.username());
    }

    // Figyelje az új üzeneteket és scrollozzon le
    this.messageService.messageThread$
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(100) // Várakozás az üzenet renderelésére
      )
      .subscribe(() => {
        this.scrollToBottom();
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private scrollToBottom() {
    try {
      const element = this.scrollContainer.nativeElement;
      element.scrollTo({
        top: element.scrollHeight,
        behavior: 'smooth',
      });
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  async sendMessage() {
    if (this.messageForm.valid) {
      const content = this.messageForm.get('content')?.value;
      await this.messageStore.sendMessage(this.username(), content);
      this.messageForm.reset();

      // Üzenet küldése után azonnal scrollozzon le
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }
}
