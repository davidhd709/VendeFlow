import { Component } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  template: `
    <div class="loading">
      <i class="pi pi-spin pi-spinner"></i>
      <span>Cargando…</span>
    </div>
  `,
  styles: [
    `
      .loading {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        justify-content: center;
        padding: 2.5rem;
        color: var(--p-text-muted-color, #6b7280);
      }
    `,
  ],
})
export class LoadingComponent {}
