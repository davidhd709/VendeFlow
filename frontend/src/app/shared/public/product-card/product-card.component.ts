import { CurrencyPipe } from '@angular/common';
import { Component, computed, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '@core/models/catalog.model';
import { CONDITION_LABEL } from '../public-defaults';
import { buildWa } from '../wa-link.util';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  template: `
    <article class="card">
      <div class="image">
        @if (product.imageUrl) {
          <img [src]="product.imageUrl" [alt]="product.name" />
        } @else {
          <div class="placeholder" aria-hidden="true">
            <div class="ph-phone">
              <div class="ph-notch"></div>
              <div class="ph-screen"></div>
            </div>
          </div>
        }
        @if (product.condition) {
          <span class="badge" [attr.data-cond]="product.condition">
            {{ condLabel() }}
          </span>
        }
      </div>

      <div class="body">
        <div class="brand-line">
          @if (product.brand) {
            <span class="brand">{{ product.brand }}</span>
          }
          @if (showSpecs()) {
            <span class="specs">
              @if (product.ram) { · {{ product.ram }} RAM }
              @if (product.storage) { · {{ product.storage }} }
              @if (product.color) { · {{ product.color }} }
            </span>
          }
        </div>

        <h3 class="title">{{ product.name }}</h3>

        @if (product.warranty) {
          <span class="warranty">
            <i class="pi pi-shield"></i>
            {{ product.warranty }}
          </span>
        }

        <div class="price-row">
          <div class="price">
            {{ priceNumber() | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
          </div>
          <span class="avail">
            <i class="pi pi-map-marker"></i>
            Consulta disponibilidad
          </span>
        </div>

        <div class="actions">
          <a
            [routerLink]="['/catalogo', product.slug]"
            [queryParams]="detailQueryParams()"
            class="btn btn-secondary"
          >
            <i class="pi pi-eye"></i> Ver detalle
          </a>
          <a
            [routerLink]="['/cotizar']"
            [queryParams]="quoteQueryParams()"
            class="btn btn-primary"
          >
            <i class="pi pi-bolt"></i> Cotizar este equipo
          </a>
          <a
            [href]="waLink()"
            target="_blank"
            rel="noopener"
            class="btn btn-wa"
          >
            <i class="pi pi-whatsapp"></i> Escribir por WhatsApp
          </a>
        </div>
      </div>
    </article>
  `,
  styles: [
    `
      :host { display: block; }
      .card {
        height: 100%;
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 16px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        transition: transform 0.15s var(--sf-ease),
          box-shadow 0.15s var(--sf-ease);
      }
      .card:hover {
        transform: translateY(-3px);
        box-shadow: var(--sf-shadow-lg);
      }
      .image {
        position: relative;
        aspect-ratio: 4 / 3;
        background: linear-gradient(180deg, #f8fafc, #e2e8f0);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      .image img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 12px;
      }
      .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
        position: relative;
      }
      .ph-phone {
        width: 80px;
        height: 140px;
        background: linear-gradient(160deg, #475569, #1e293b);
        border-radius: 14px;
        position: relative;
        box-shadow: 0 10px 24px -8px rgba(15, 23, 42, 0.4);
      }
      .ph-notch {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 32px;
        height: 8px;
        background: #0f172a;
        border-radius: 0 0 6px 6px;
      }
      .ph-screen {
        position: absolute;
        inset: 6px 4px;
        background: linear-gradient(180deg, #334155, #0f172a);
        border-radius: 10px;
      }
      .badge {
        position: absolute;
        top: 10px;
        left: 10px;
        background: #fff;
        border: 1px solid var(--sf-border);
        color: var(--sf-text-muted);
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.02em;
      }
      .badge[data-cond='NUEVO'] {
        background: var(--sf-success-soft);
        color: #047857;
        border-color: rgba(16, 185, 129, 0.3);
      }
      .badge[data-cond='USADO'] {
        background: var(--sf-warn-soft);
        color: #b45309;
        border-color: rgba(245, 158, 11, 0.3);
      }
      .badge[data-cond='REACONDICIONADO'] {
        background: var(--sf-primary-soft);
        color: var(--sf-primary);
        border-color: rgba(37, 99, 235, 0.25);
      }

      .body {
        padding: 1rem 1.1rem 1.1rem;
        display: flex;
        flex: 1;
        flex-direction: column;
        gap: 0.45rem;
      }
      .brand-line {
        font-size: 0.75rem;
        color: var(--sf-text-muted);
        font-weight: 600;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .specs { font-weight: 500; letter-spacing: 0; text-transform: none; color: var(--sf-text-muted); }
      .title {
        font-size: 1.05rem;
        font-weight: 700;
        margin: 0;
        line-height: 1.2;
        color: var(--sf-text);
        min-height: 2.45em;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .warranty {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        align-self: flex-start;
        margin-top: 0.1rem;
        background: rgba(16, 185, 129, 0.1);
        color: #047857;
        border: 1px solid rgba(16, 185, 129, 0.22);
        border-radius: 999px;
        padding: 0.2rem 0.5rem;
        font-size: 0.72rem;
        font-weight: 700;
      }
      .price-row {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.5rem;
        margin-top: 0.35rem;
      }
      .price {
        font-size: 1.25rem;
        font-weight: 800;
        color: var(--sf-text);
        font-variant-numeric: tabular-nums;
        letter-spacing: -0.01em;
      }
      .avail {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        color: var(--sf-text-muted);
        font-size: 0.72rem;
      }
      .actions {
        display: flex;
        gap: 0.5rem;
        margin-top: auto;
        padding-top: 0.85rem;
      }
      .btn {
        flex: 1;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
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
      .btn-secondary {
        background: #fff;
        color: var(--sf-text);
        border: 1px solid var(--sf-border);
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
      }
      :host-context(.site-theme-shell[data-theme='premium']) .card:hover,
      :host-context(.preview-theme-shell[data-theme='premium']) .card:hover {
        transform: none;
      }
      :host-context(.site-theme-shell[data-theme='premium']) .image,
      :host-context(.preview-theme-shell[data-theme='premium']) .image {
        background: linear-gradient(180deg, #f5f5f4, #e7e5e4);
      }
      :host-context(.site-theme-shell[data-theme='premium']) .body,
      :host-context(.preview-theme-shell[data-theme='premium']) .body {
        padding: 0.8rem 0.9rem;
      }
      :host-context(.site-theme-shell[data-theme='premium']) .title,
      :host-context(.preview-theme-shell[data-theme='premium']) .title {
        font-size: 1rem;
      }
      :host-context(.site-theme-shell[data-theme='vibrant']) .card,
      :host-context(.preview-theme-shell[data-theme='vibrant']) .card {
        border-radius: 22px;
        border-color: #93c5fd;
        box-shadow: 0 16px 36px rgba(14, 116, 144, 0.15);
      }
      :host-context(.site-theme-shell[data-theme='vibrant']) .image,
      :host-context(.preview-theme-shell[data-theme='vibrant']) .image {
        background: linear-gradient(160deg, #eff6ff, #dbeafe);
      }
      :host-context(.site-theme-shell[data-theme='vibrant']) .btn-secondary,
      :host-context(.preview-theme-shell[data-theme='vibrant']) .btn-secondary {
        border-color: #93c5fd;
        color: #075985;
      }
      @media (max-width: 430px) {
        .actions {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  @Input() subdomain = '';
  @Input() contactPhone: string | null | undefined = '';

  condLabel = computed(
    () => CONDITION_LABEL[this.product.condition] ?? this.product.condition,
  );

  priceNumber = computed(() => Number(this.product.price ?? 0));

  showSpecs = computed(
    () => !!(this.product.ram || this.product.storage || this.product.color),
  );

  waLink = computed(() =>
    buildWa(this.contactPhone, `Hola, me interesa el ${this.product.name}`),
  );

  quoteQueryParams(): Record<string, string> {
    const query: Record<string, string> = { product: this.product.id };
    if (this.subdomain) query['sub'] = this.subdomain;
    return query;
  }

  detailQueryParams(): Record<string, string> {
    if (!this.subdomain) return {};
    return { sub: this.subdomain };
  }
}
