import { Component, Input } from '@angular/core';

export type KpiTone = 'info' | 'success' | 'warn' | 'danger';

@Component({
  selector: 'app-kpi-card',
  standalone: true,
  template: `
    <article class="kpi" [attr.data-tone]="tone">
      <div class="top">
        <span class="label">{{ label }}</span>
        <i [class]="icon"></i>
      </div>
      <div class="value">{{ value }}</div>
      @if (context) {
        <p class="context">{{ context }}</p>
      }
    </article>
  `,
  styles: [
    `
      .kpi {
        border: 1px solid var(--sf-border);
        border-radius: 14px;
        background: #fff;
        padding: 0.95rem 1rem;
        box-shadow: var(--sf-shadow-sm);
      }
      .top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.7rem;
      }
      .label {
        font-size: 0.8rem;
        color: var(--sf-text-muted);
        font-weight: 600;
      }
      i {
        width: 30px;
        height: 30px;
        border-radius: 9px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--sf-primary-soft);
        color: var(--sf-primary);
      }
      .kpi[data-tone='success'] i {
        background: var(--sf-success-soft);
        color: var(--sf-success);
      }
      .kpi[data-tone='warn'] i {
        background: var(--sf-warn-soft);
        color: #b45309;
      }
      .kpi[data-tone='danger'] i {
        background: var(--sf-danger-soft);
        color: var(--sf-danger);
      }
      .value {
        font-size: 1.55rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin-top: 0.35rem;
      }
      .context {
        margin: 0.25rem 0 0;
        font-size: 0.78rem;
        color: var(--sf-text-muted);
      }
    `,
  ],
})
export class KpiCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: string | number = '';
  @Input() context = '';
  @Input() icon = 'pi pi-chart-line';
  @Input() tone: KpiTone = 'info';
}

