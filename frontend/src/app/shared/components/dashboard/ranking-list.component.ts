import { Component, Input } from '@angular/core';

export interface RankingItem {
  label: string;
  value: string;
  detail?: string;
  tone?: 'info' | 'success' | 'warn' | 'danger';
}

@Component({
  selector: 'app-ranking-list',
  standalone: true,
  template: `
    <ol class="ranked">
      @for (item of items; track item.label + $index) {
        <li [attr.data-tone]="item.tone || 'info'">
          <span class="pos">{{ $index + 1 }}</span>
          <div class="label-wrap">
            <strong>{{ item.label }}</strong>
            @if (item.detail) {
              <small>{{ item.detail }}</small>
            }
          </div>
          <span class="value">{{ item.value }}</span>
        </li>
      }
    </ol>
  `,
  styles: [
    `
      .ranked {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
      }
      li {
        display: grid;
        grid-template-columns: auto 1fr auto;
        gap: 0.65rem;
        align-items: center;
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        background: var(--sf-surface-2);
        padding: 0.45rem 0.6rem;
      }
      .pos {
        width: 24px;
        height: 24px;
        border-radius: 7px;
        border: 1px solid var(--sf-border);
        background: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.74rem;
        font-weight: 700;
        color: var(--sf-text-muted);
      }
      .label-wrap {
        display: grid;
      }
      .label-wrap strong {
        font-size: 0.86rem;
      }
      .label-wrap small {
        color: var(--sf-text-muted);
        font-size: 0.74rem;
      }
      .value {
        font-weight: 700;
        color: var(--sf-text);
        font-size: 0.8rem;
      }
      li[data-tone='success'] .value { color: var(--sf-success); }
      li[data-tone='warn'] .value { color: #b45309; }
      li[data-tone='danger'] .value { color: var(--sf-danger); }
    `,
  ],
})
export class RankingListComponent {
  @Input() items: RankingItem[] = [];
}

