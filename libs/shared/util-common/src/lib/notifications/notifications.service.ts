import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private readonly toastr: ToastrService) {}

  showError(message?: string, title?: string): void {
    message = message || 'There is an error';

    title = title || 'Error';

    this.toastr.error(message, title);
  }

  showSuccess(message?: string, title?: string) {
    message = message || '';
    title = title || 'Success';

    this.toastr.success(message, title);
  }
}
