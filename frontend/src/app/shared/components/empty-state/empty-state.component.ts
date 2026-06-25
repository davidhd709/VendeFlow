import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="sf-empty">
      <div class="sf-empty-icon">
        <i [class]="icon"></i>
      </div>
      <h3>{{ title }}</h3>
      @if (description) {
        <p>{{ description }}</p>
      }
      <div class="sf-empty-actions">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      .sf-empty-actions {
        display: flex;
        gap: 0.5rem;
        margin-top: 1rem;
      }
      .sf-empty-actions:empty {
        display: none;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() icon = 'pi pi-inbox';
  @Input() title = 'Sin datos';
  @Input() description = '';
}
