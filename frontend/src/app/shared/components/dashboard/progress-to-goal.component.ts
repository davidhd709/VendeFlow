import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-to-goal',
  standalone: true,
  template: `
    <section class="goal">
      <div class="head">
        <div>
          <h3>{{ title }}</h3>
          <p>{{ subtitle }}</p>
        </div>
        <strong>{{ safePercent() }}%</strong>
      </div>
      <div class="track">
        <div class="fill" [style.width.%]="safePercent()"></div>
      </div>
      <div class="meta">
        <span>{{ currentLabel }}</span>
        <span>{{ targetLabel }}</span>
      </div>
    </section>
  `,
  styles: [
    `
      .goal {
        border: 1px solid var(--sf-border);
        border-radius: 14px;
        background: #fff;
        padding: 0.95rem 1rem;
      }
      .head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.8rem;
      }
      h3 {
        margin: 0;
        font-size: 0.95rem;
      }
      p {
        margin: 0.2rem 0 0;
        color: var(--sf-text-muted);
        font-size: 0.78rem;
      }
      .head strong {
        font-size: 1.1rem;
        color: var(--sf-primary);
      }
      .track {
        margin-top: 0.75rem;
        height: 10px;
        background: var(--sf-surface-2);
        border-radius: 999px;
        overflow: hidden;
      }
      .fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #2563eb, #10b981);
      }
      .meta {
        margin-top: 0.45rem;
        display: flex;
        justify-content: space-between;
        color: var(--sf-text-muted);
        font-size: 0.75rem;
      }
    `,
  ],
})
export class ProgressToGoalComponent {
  @Input() title = 'Progreso mensual';
  @Input() subtitle = 'Avance frente a la meta';
  @Input() percent: number | null = 0;
  @Input() currentLabel = '';
  @Input() targetLabel = '';

  safePercent(): number {
    const p = this.percent ?? 0;
    if (!Number.isFinite(p)) return 0;
    return Math.max(0, Math.min(100, Math.round(p)));
  }
}

