import { Component, EventEmitter, Input, Output } from '@angular/core';

const ICONS = [
  'pi-check', 'pi-check-circle', 'pi-star', 'pi-heart', 'pi-shield',
  'pi-bolt', 'pi-truck', 'pi-home', 'pi-building', 'pi-phone',
  'pi-envelope', 'pi-map-marker', 'pi-clock', 'pi-calendar', 'pi-users',
  'pi-user', 'pi-lock', 'pi-cog', 'pi-wrench', 'pi-shopping-cart',
  'pi-credit-card', 'pi-money-bill', 'pi-chart-bar', 'pi-chart-line', 'pi-thumbs-up',
  'pi-gift', 'pi-tag', 'pi-refresh', 'pi-search', 'pi-list',
  'pi-th-large', 'pi-image', 'pi-mobile', 'pi-desktop', 'pi-wifi',
  'pi-cloud', 'pi-database', 'pi-info-circle', 'pi-question-circle', 'pi-pencil',
  'pi-arrow-right', 'pi-globe', 'pi-comments', 'pi-bell', 'pi-send',
  'pi-download', 'pi-upload', 'pi-palette', 'pi-camera', 'pi-flag',
  'pi-print', 'pi-code', 'pi-server', 'pi-box', 'pi-headphones',
  'pi-bookmark', 'pi-eye', 'pi-exclamation-circle', 'pi-share-alt', 'pi-plus-circle',
];

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [],
  template: `
    <div class="picker-wrap">
      <button
        type="button"
        class="trigger"
        [class.open]="open"
        (click)="open = !open"
        [title]="value ? 'Cambiar icono: ' + value : 'Seleccionar icono'"
      >
        @if (value) {
          <i class="pi {{ value }}"></i>
        } @else {
          <i class="pi pi-plus" style="opacity:0.5"></i>
        }
        <span class="trigger-label">{{ value || 'Sin icono' }}</span>
        <i class="pi pi-angle-down caret" [class.rotated]="open"></i>
      </button>

      @if (open) {
        <div class="grid">
          <button
            type="button"
            class="none-btn"
            [class.active]="!value"
            (click)="pick('')"
            title="Sin icono"
          >
            —
          </button>
          @for (icon of ICONS; track icon) {
            <button
              type="button"
              class="icon-btn"
              [class.active]="value === icon"
              [title]="icon"
              (click)="pick(icon)"
            >
              <i class="pi {{ icon }}"></i>
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .picker-wrap { position: relative; }
      .trigger {
        width: 100%;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.42rem 0.65rem;
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 8px;
        font-size: 0.83rem;
        color: var(--sf-text);
        cursor: pointer;
        transition: border-color 0.12s;
      }
      .trigger:hover { border-color: var(--sf-border-strong); }
      .trigger.open { border-color: var(--sf-primary); }
      .trigger-label {
        flex: 1;
        text-align: left;
        font-size: 0.8rem;
        color: var(--sf-text-muted);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .caret {
        font-size: 0.7rem;
        color: var(--sf-text-muted);
        transition: transform 0.15s;
      }
      .caret.rotated { transform: rotate(180deg); }
      .grid {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        z-index: 50;
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 3px;
        padding: 0.5rem;
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
        max-height: 220px;
        overflow-y: auto;
      }
      .icon-btn, .none-btn {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: 1px solid transparent;
        background: transparent;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 0.85rem;
        color: var(--sf-text);
        transition: background 0.1s, border-color 0.1s, color 0.1s;
      }
      .none-btn { font-size: 0.7rem; color: var(--sf-text-muted); }
      .icon-btn:hover, .none-btn:hover {
        background: var(--sf-surface-2);
        border-color: var(--sf-border);
      }
      .icon-btn.active, .none-btn.active {
        background: var(--sf-primary-soft);
        border-color: var(--sf-primary);
        color: var(--sf-primary);
      }
    `,
  ],
})
export class IconPickerComponent {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  readonly ICONS = ICONS;
  open = false;

  pick(icon: string): void {
    this.valueChange.emit(icon);
    this.open = false;
  }
}
