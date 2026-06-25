import { Component, Input } from '@angular/core';

export interface StatusBreakdownItem {
  label: string;
  count: number;
}

@Component({
  selector: 'app-status-breakdown',
  standalone: true,
  template: `
    <div class="grid">
      @for (item of items; track item.label) {
        <article class="status">
          <span class="label">{{ item.label }}</span>
          <strong>{{ item.count }}</strong>
        </article>
      }
    </div>
  `,
  styles: [
    `
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 0.5rem;
      }
      .status {
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        background: #fff;
        padding: 0.55rem 0.65rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .label {
        color: var(--sf-text-muted);
        font-size: 0.76rem;
      }
      strong {
        font-size: 0.9rem;
      }
    `,
  ],
})
export class StatusBreakdownComponent {
  @Input() items: StatusBreakdownItem[] = [];
}

