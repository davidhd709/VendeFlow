import { Component, Input } from '@angular/core';

export type StatTone = 'primary' | 'success' | 'warn' | 'danger' | 'neutral';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  template: `
    <article class="stat" [attr.data-tone]="tone">
      <div class="stat-icon">
        <i [class]="icon"></i>
      </div>
      <div class="stat-body">
        <div class="stat-label">{{ label }}</div>
        <div class="stat-value">{{ value }}</div>
        @if (hint) {
          <div class="stat-hint">{{ hint }}</div>
        }
      </div>
    </article>
  `,
  styles: [
    `
      .stat {
        background: var(--sf-surface);
        border: 1px solid var(--sf-border);
        border-radius: var(--sf-radius);
        box-shadow: var(--sf-shadow-sm);
        padding: 1.1rem 1.25rem;
        display: flex;
        gap: 1rem;
        align-items: flex-start;
      }
      .stat-icon {
        flex: 0 0 44px;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.15rem;
        background: var(--sf-primary-soft);
        color: var(--sf-primary);
      }
      .stat[data-tone='success'] .stat-icon {
        background: var(--sf-success-soft);
        color: var(--sf-success);
      }
      .stat[data-tone='warn'] .stat-icon {
        background: var(--sf-warn-soft);
        color: #b45309;
      }
      .stat[data-tone='danger'] .stat-icon {
        background: var(--sf-danger-soft);
        color: var(--sf-danger);
      }
      .stat[data-tone='neutral'] .stat-icon {
        background: var(--sf-surface-2);
        color: var(--sf-text-muted);
      }
      .stat-body { min-width: 0; }
      .stat-label {
        color: var(--sf-text-muted);
        font-size: 0.8125rem;
        font-weight: 500;
      }
      .stat-value {
        font-size: 1.75rem;
        font-weight: 700;
        line-height: 1.15;
        margin-top: 0.15rem;
        letter-spacing: -0.02em;
      }
      .stat-hint {
        color: var(--sf-text-muted);
        font-size: 0.78rem;
        margin-top: 0.35rem;
      }
    `,
  ],
})
export class StatCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: string | number = '';
  @Input() hint = '';
  @Input() icon = 'pi pi-chart-line';
  @Input() tone: StatTone = 'primary';
}
