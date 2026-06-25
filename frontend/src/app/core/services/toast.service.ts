import { inject, Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

/** Atajo sobre PrimeNG MessageService para notificaciones consistentes. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messages = inject(MessageService);

  success(detail: string, summary = 'Listo'): void {
    this.messages.add({ severity: 'success', summary, detail });
  }

  error(detail: string, summary = 'Error'): void {
    this.messages.add({ severity: 'error', summary, detail });
  }

  info(detail: string, summary = 'Información'): void {
    this.messages.add({ severity: 'info', summary, detail });
  }
}
