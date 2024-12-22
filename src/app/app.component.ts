import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NxWelcomeComponent } from './nx-welcome.component';
import { NotificationService } from '@my-workspace/shared/util-common';
import { AuthStore } from '@my-workspace/shared/util-auth';

@Component({
  imports: [NxWelcomeComponent, RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'my-workspace';
  notif = inject(NotificationService);
authStore = inject(AuthStore);

  ngOnInit(): void {
    console.log(this.authStore)
    // console.log('lefut');
    this.notif.showSuccess('asd');
  }
}
