import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-section-card',
  standalone: true,
  template: `
    <section class="sc">
      @if (title || description) {
        <header class="sc-head">
          <div>
            <h3>{{ title }}</h3>
            @if (description) {
              <p class="text-muted">{{ description }}</p>
            }
          </div>
          <div class="sc-actions">
            <ng-content select="[slot=actions]" />
          </div>
        </header>
      }
      <div class="sc-body">
        <ng-content />
      </div>
    </section>
  `,
  styles: [
    `
      .sc {
        background: var(--sf-surface);
        border: 1px solid var(--sf-border);
        border-radius: var(--sf-radius);
        box-shadow: var(--sf-shadow-sm);
        overflow: hidden;
      }
      .sc-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.1rem 1.5rem;
        border-bottom: 1px solid var(--sf-border);
      }
      .sc-head h3 { margin: 0; font-size: 1rem; }
      .sc-head p { margin: 0.15rem 0 0; font-size: 0.85rem; }
      .sc-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .sc-body { padding: 1.25rem 1.5rem; }
    `,
  ],
})
export class SectionCardComponent {
  @Input() title = '';
  @Input() description = '';
}
