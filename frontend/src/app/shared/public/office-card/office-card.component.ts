import { Component, computed, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicOffice } from '@core/models/catalog.model';
import { buildWa } from '../wa-link.util';

@Component({
  selector: 'app-office-card',
  standalone: true,
  imports: [RouterLink],
  template: `
    <article class="card">
      <div class="head">
        <div class="pin"><i class="pi pi-map-marker"></i></div>
        <div>
          <h3>{{ office.name }}</h3>
          @if (office.city) {
            <div class="text-muted text-sm">{{ office.city }}</div>
          }
        </div>
      </div>

      @if (office.address) {
        <div class="row">
          <i class="pi pi-home"></i>
          <span>{{ office.address }}</span>
        </div>
      }
      @if (office.phone) {
        <div class="row">
          <i class="pi pi-phone"></i>
          <a [href]="'tel:' + office.phone">{{ office.phone }}</a>
        </div>
      }

      <div class="actions">
        <a
          [routerLink]="['/cotizar']"
          [queryParams]="{ sub: subdomain, office: office.id }"
          class="btn btn-primary"
        >
          <i class="pi pi-bolt"></i> Cotizar en esta oficina
        </a>
        @if (office.phone) {
          <a
            [href]="waLink()"
            target="_blank"
            rel="noopener"
            class="btn btn-wa"
          >
            <i class="pi pi-whatsapp"></i> WhatsApp
          </a>
        }
      </div>
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
        gap: 0.65rem;
        transition: box-shadow 0.15s var(--sf-ease), transform 0.15s var(--sf-ease);
      }
      .card:hover {
        transform: translateY(-2px);
        box-shadow: var(--sf-shadow);
      }
      .head {
        display: flex;
        gap: 0.75rem;
        align-items: center;
      }
      .pin {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: var(--sf-primary-soft);
        color: var(--sf-primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.05rem;
      }
      h3 { margin: 0; font-size: 1.05rem; font-weight: 700; }
      .row {
        display: flex;
        gap: 0.55rem;
        align-items: center;
        color: var(--sf-text);
        font-size: 0.9rem;
      }
      .row i { color: var(--sf-text-muted); width: 16px; }
      .row a { color: var(--sf-text); }
      .actions {
        margin-top: auto;
        padding-top: 0.85rem;
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }
      .btn {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        padding: 0.55rem 0.75rem;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.82rem;
        text-decoration: none;
      }
      .btn-primary {
        background: var(--sf-success);
        color: #fff;
      }
      .btn-wa {
        background: #25d366;
        color: #fff;
      }
      .btn:hover { text-decoration: none; filter: brightness(0.97); }
      :host-context(.site-theme-shell[data-theme='premium']) .card,
      :host-context(.preview-theme-shell[data-theme='premium']) .card {
        border-radius: 10px;
        border-color: #d6d3d1;
        box-shadow: none;
        gap: 0.5rem;
        padding: 1rem;
      }
      :host-context(.site-theme-shell[data-theme='premium']) .card:hover,
      :host-context(.preview-theme-shell[data-theme='premium']) .card:hover {
        transform: none;
      }
      :host-context(.site-theme-shell[data-theme='premium']) .pin,
      :host-context(.preview-theme-shell[data-theme='premium']) .pin {
        border-radius: 8px;
        background: #ede9e5;
        color: #57534e;
      }
      :host-context(.site-theme-shell[data-theme='vibrant']) .card,
      :host-context(.preview-theme-shell[data-theme='vibrant']) .card {
        border-radius: 20px;
        border-color: #93c5fd;
        box-shadow: 0 14px 32px rgba(14, 116, 144, 0.14);
      }
      :host-context(.site-theme-shell[data-theme='vibrant']) .pin,
      :host-context(.preview-theme-shell[data-theme='vibrant']) .pin {
        background: linear-gradient(160deg, #dbeafe, #bfdbfe);
        color: #0369a1;
      }
    `,
  ],
})
export class OfficeCardComponent {
  @Input({ required: true }) office!: PublicOffice;
  @Input() subdomain = '';

  waLink = computed(() =>
    buildWa(this.office.phone, `Hola, quisiera info de la oficina ${this.office.name}`),
  );
}
