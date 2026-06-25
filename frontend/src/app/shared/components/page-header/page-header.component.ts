import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  standalone: true,
  template: `
    <header class="ph">
      <div class="ph-text">
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p class="text-muted">{{ subtitle }}</p>
        }
      </div>
      <div class="ph-actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: [
    `
      .ph {
        display: flex;
        gap: 1rem;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 1.5rem;
      }
      .ph-text h1 {
        font-size: 1.5rem;
        margin: 0 0 0.25rem;
      }
      .ph-text p {
        margin: 0;
        font-size: 0.9rem;
      }
      .ph-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
      }
      @media (max-width: 640px) {
        .ph {
          flex-direction: column;
          align-items: flex-start;
        }
      }
    `,
  ],
})
export class PageHeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
}
