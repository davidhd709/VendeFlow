import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

export type AlertTone = 'info' | 'warn' | 'danger' | 'success';

@Component({
  selector: 'app-alert-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="alert" [attr.data-tone]="tone">
      <div class="head">
        <i [class]="icon"></i>
        <h4>{{ title }}</h4>
      </div>
      <p>{{ description }}</p>
      @if (actionLabel && actionLink) {
        <a class="cta" [routerLink]="actionLink">{{ actionLabel }}</a>
      }
    </article>
  `,
  styles: [
    `
      .alert {
        border: 1px solid var(--sf-border);
        border-radius: 12px;
        background: #fff;
        padding: 0.8rem 0.9rem;
      }
      .alert[data-tone='warn'] {
        background: #fffbeb;
        border-color: rgba(180, 83, 9, 0.2);
      }
      .alert[data-tone='danger'] {
        background: #fef2f2;
        border-color: rgba(220, 38, 38, 0.2);
      }
      .alert[data-tone='success'] {
        background: #ecfdf5;
        border-color: rgba(5, 150, 105, 0.2);
      }
      .head {
        display: flex;
        gap: 0.55rem;
        align-items: center;
      }
      .head i { color: var(--sf-primary); }
      h4 {
        margin: 0;
        font-size: 0.86rem;
      }
      p {
        margin: 0.45rem 0 0;
        font-size: 0.8rem;
        color: var(--sf-text-muted);
      }
      .cta {
        display: inline-flex;
        margin-top: 0.5rem;
        color: var(--sf-primary);
        font-size: 0.8rem;
        font-weight: 700;
      }
      .cta:hover { text-decoration: underline; }
    `,
  ],
})
export class AlertCardComponent {
  @Input() title = '';
  @Input() description = '';
  @Input() icon = 'pi pi-info-circle';
  @Input() tone: AlertTone = 'info';
  @Input() actionLabel = '';
  @Input() actionLink = '';
}

