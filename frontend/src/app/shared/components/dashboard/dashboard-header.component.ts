import { Component, Input } from '@angular/core';

export type DashboardSummaryTone = 'info' | 'success' | 'warn' | 'danger';

export interface DashboardSummaryItem {
  label: string;
  value: string;
  tone?: DashboardSummaryTone;
}

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  template: `
    <header class="dh">
      <div>
        <span class="eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        @if (subtitle) {
          <p class="subtitle">{{ subtitle }}</p>
        }
      </div>

      <div class="meta">
        @if (periodLabel) {
          <span class="period-pill">
            <i class="pi pi-calendar"></i> {{ periodLabel }}
          </span>
        }
        @for (item of summary; track item.label) {
          <span class="summary-pill" [attr.data-tone]="item.tone || 'info'">
            <strong>{{ item.value }}</strong>
            <small>{{ item.label }}</small>
          </span>
        }
      </div>
    </header>
  `,
  styles: [
    `
      .dh {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1.25rem;
      }
      .eyebrow {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.09em;
        color: var(--sf-primary);
      }
      h1 {
        margin: 0.2rem 0 0;
        font-size: 1.55rem;
        letter-spacing: -0.02em;
      }
      .subtitle {
        margin: 0.35rem 0 0;
        color: var(--sf-text-muted);
        font-size: 0.9rem;
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.45rem;
      }
      .period-pill,
      .summary-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        border: 1px solid var(--sf-border);
        border-radius: 999px;
        background: #fff;
        color: var(--sf-text);
        font-size: 0.75rem;
        padding: 0.35rem 0.65rem;
      }
      .summary-pill small {
        color: var(--sf-text-muted);
      }
      .summary-pill[data-tone='success'] {
        background: var(--sf-success-soft);
        border-color: rgba(5, 150, 105, 0.25);
      }
      .summary-pill[data-tone='warn'] {
        background: var(--sf-warn-soft);
        border-color: rgba(180, 83, 9, 0.2);
      }
      .summary-pill[data-tone='danger'] {
        background: var(--sf-danger-soft);
        border-color: rgba(220, 38, 38, 0.2);
      }
      @media (max-width: 760px) {
        .dh {
          flex-direction: column;
        }
        .meta {
          justify-content: flex-start;
        }
      }
    `,
  ],
})
export class DashboardHeaderComponent {
  @Input() eyebrow = 'Dashboard';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() periodLabel = '';
  @Input() summary: DashboardSummaryItem[] = [];
}

