import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

@Component({
  selector: 'app-empty-dashboard-state',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent],
  template: `
    <div class="wrapper">
      <app-empty-state [icon]="icon" [title]="title" [description]="description" />
      @if (actionLabel && actionLink) {
        <a class="action" [routerLink]="actionLink">{{ actionLabel }}</a>
      }
    </div>
  `,
  styles: [
    `
      .wrapper {
        border: 1px dashed var(--sf-border-strong);
        border-radius: 12px;
        background: var(--sf-surface-2);
        padding: 0.8rem;
      }
      .action {
        display: inline-flex;
        margin: 0.25rem auto 0;
        color: var(--sf-primary);
        font-weight: 600;
        justify-content: center;
        width: 100%;
      }
      .action:hover { text-decoration: underline; }
    `,
  ],
})
export class EmptyDashboardStateComponent {
  @Input() icon = 'pi pi-inbox';
  @Input() title = 'Sin datos';
  @Input() description = 'Aún no hay información para mostrar.';
  @Input() actionLabel = '';
  @Input() actionLink = '';
}

