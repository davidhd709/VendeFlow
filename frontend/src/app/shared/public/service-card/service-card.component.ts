import { Component, Input } from '@angular/core';
import { ServiceItem } from '@core/models/website-config.model';

@Component({
  selector: 'app-service-card',
  standalone: true,
  template: `
    <article class="card" [style.--brand]="brandColor || '#2563eb'">
      <div class="icon">
        <i [class]="iconClass()"></i>
      </div>
      <h3>{{ service.title }}</h3>
      @if (service.description) {
        <p class="text-muted">{{ service.description }}</p>
      }
    </article>
  `,
  styles: [
    `
      :host { display: block; height: 100%; }
      .card {
        height: 100%;
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 16px;
        padding: 1.4rem;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
        transition: transform 0.15s var(--sf-ease),
          box-shadow 0.15s var(--sf-ease),
          border-color 0.15s var(--sf-ease);
      }
      .card:hover {
        transform: translateY(-3px);
        box-shadow: var(--sf-shadow);
        border-color: color-mix(in srgb, var(--brand) 30%, var(--sf-border));
      }
      .icon {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: color-mix(in srgb, var(--brand) 12%, transparent);
        color: var(--brand);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        margin-bottom: 0.45rem;
      }
      h3 {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 700;
      }
      p {
        margin: 0;
        font-size: 0.9rem;
        line-height: 1.55;
      }
      :host-context(.site-theme-shell[data-theme='premium']) .card,
      :host-context(.preview-theme-shell[data-theme='premium']) .card {
        border-radius: 10px;
        border-color: #d6d3d1;
        box-shadow: none;
        padding: 1rem;
      }
      :host-context(.site-theme-shell[data-theme='premium']) .card:hover,
      :host-context(.preview-theme-shell[data-theme='premium']) .card:hover {
        transform: none;
      }
      :host-context(.site-theme-shell[data-theme='premium']) .icon,
      :host-context(.preview-theme-shell[data-theme='premium']) .icon {
        border-radius: 9px;
        background: color-mix(in srgb, var(--brand) 18%, #f5f5f4);
      }
      :host-context(.site-theme-shell[data-theme='vibrant']) .card,
      :host-context(.preview-theme-shell[data-theme='vibrant']) .card {
        border-radius: 20px;
        border-color: color-mix(in srgb, var(--brand) 38%, #93c5fd);
        box-shadow: 0 14px 34px rgba(14, 116, 144, 0.14);
      }
      :host-context(.site-theme-shell[data-theme='vibrant']) .icon,
      :host-context(.preview-theme-shell[data-theme='vibrant']) .icon {
        border-radius: 14px;
        background: color-mix(in srgb, var(--brand) 24%, #dbeafe);
      }
    `,
  ],
})
export class ServiceCardComponent {
  @Input({ required: true }) service!: ServiceItem;
  @Input() brandColor: string | null | undefined = '#2563eb';

  iconClass(): string {
    const raw = (this.service.icon || 'pi-check').replace(/^pi\s+/, '');
    return `pi ${raw.startsWith('pi-') ? raw : 'pi-' + raw}`;
  }
}
