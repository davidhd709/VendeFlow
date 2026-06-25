import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { ApiError } from '@core/models/api-error.model';
import { Product, PublicOffice } from '@core/models/catalog.model';
import { WebsiteConfig } from '@core/models/website-config.model';
import { PublicService } from '@core/services/public.service';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { resolvePublicSubdomain } from '@core/utils/public-subdomain.util';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { CONDITION_LABEL } from '@shared/public/public-defaults';
import { buildWa } from '@shared/public/wa-link.util';

@Component({
  selector: 'app-public-product-detail',
  standalone: true,
  imports: [
    CurrencyPipe,
    RouterLink,
    MessageModule,
    EmptyStateComponent,
    LoadingComponent,
  ],
  template: `
    <section class="shell" [style.--brand]="brandColor()">
      @if (!subdomain) {
        <app-empty-state
          icon="pi pi-link"
          title="No pudimos cargar la información de la tienda"
          description="Intenta de nuevo o escríbenos por WhatsApp para ayudarte."
        >
          <a [routerLink]="['/catalogo']" class="btn btn-secondary">
            Volver al catálogo
          </a>
        </app-empty-state>
      } @else if (loading()) {
        <app-loading />
      } @else if (error()) {
        <app-empty-state
          icon="pi pi-search"
          title="Este producto ya no está disponible o fue actualizado"
          [description]="error()!"
        >
          <a
            [routerLink]="['/catalogo']"
            [queryParams]="{ sub: subdomain }"
            class="btn btn-primary"
          >
            Ver catálogo
          </a>
          <a
            [routerLink]="['/cotizar']"
            [queryParams]="{ sub: subdomain }"
            class="btn btn-secondary"
          >
            Solicitar asesoría
          </a>
        </app-empty-state>
      } @else {
        @if (product(); as p) {
          <div class="topbar">
            <a
              [routerLink]="['/catalogo']"
              [queryParams]="{ sub: subdomain }"
              class="link-back"
            >
              <i class="pi pi-arrow-left"></i> Volver al catálogo
            </a>
          </div>

          <article class="detail-card">
            <div class="media">
              @if (activeImage()) {
                <img [src]="activeImage()!" [alt]="p.name" class="main-img" />
              } @else {
                <div class="placeholder" aria-hidden="true">
                  <div class="ph-phone">
                    <div class="ph-notch"></div>
                    <div class="ph-screen"></div>
                  </div>
                </div>
              }
              <span class="condition">{{ conditionLabel(p.condition) }}</span>
              @if (allImages().length > 1) {
                <div class="thumb-strip">
                  @for (img of allImages(); track img) {
                    <button
                      class="thumb-btn"
                      [class.active]="activeImage() === img"
                      (click)="activeImage.set(img)"
                    >
                      <img [src]="img" [alt]="p.name" />
                    </button>
                  }
                </div>
              }
            </div>

            <div class="content">
              <div class="meta">
                <span>{{ p.brand || 'Marca disponible' }}</span>
                @if (p.model) {
                  <span>· {{ p.model }}</span>
                }
              </div>
              <h1>{{ p.name }}</h1>
              <p class="price">
                {{ numberPrice(p.price) | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
              </p>

              <div class="specs">
                <div><strong>Condición:</strong> {{ conditionLabel(p.condition) }}</div>
                <div><strong>RAM:</strong> {{ p.ram || 'A confirmar' }}</div>
                <div><strong>Almacenamiento:</strong> {{ p.storage || 'A confirmar' }}</div>
                <div><strong>Color:</strong> {{ p.color || 'A confirmar' }}</div>
                <div><strong>Garantía:</strong> {{ p.warranty || 'Según evaluación del equipo' }}</div>
              </div>

              <div class="description">
                <h2>Descripción</h2>
                <p>{{ p.description || 'Equipo en excelente estado y listo para entrega. Escríbenos para confirmar disponibilidad y medios de pago.' }}</p>
              </div>

              @if (offices().length > 0) {
                <div class="availability">
                  <h2>Consulta disponibilidad en tu oficina más cercana</h2>
                  <p class="availability-copy">
                    Un asesor confirmará disponibilidad y tiempos de entrega.
                  </p>
                  <ul>
                    @for (office of offices().slice(0, 3); track office.id) {
                      <li>
                        {{ office.name }}{{ office.city ? ' · ' + office.city : '' }}
                      </li>
                    }
                  </ul>
                </div>
              } @else {
                <div class="availability">
                  <h2>Consulta disponibilidad</h2>
                  <p class="availability-copy">
                    Contáctanos por WhatsApp y te indicaremos el punto de atención más cercano.
                  </p>
                </div>
              }

              <div class="actions">
                <a
                  [routerLink]="['/cotizar']"
                  [queryParams]="{ sub: subdomain, product: p.id }"
                  class="btn btn-primary"
                >
                  <i class="pi pi-bolt"></i> Cotizar este equipo
                </a>
                <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn-wa">
                  <i class="pi pi-whatsapp"></i> Escribir por WhatsApp
                </a>
              </div>
            </div>
          </article>
        }
      }
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .shell {
        max-width: 1120px;
        margin: 1.5rem auto 3rem;
        padding: 0 1rem;
      }
      .topbar { margin-bottom: 1rem; }
      .link-back {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--brand, var(--sf-primary));
        text-decoration: none;
        font-weight: 600;
      }
      .detail-card {
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 16px;
        overflow: hidden;
        display: grid;
        grid-template-columns: minmax(280px, 440px) 1fr;
      }
      .media {
        position: relative;
        background: linear-gradient(180deg, #f8fafc, #e2e8f0);
        min-height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .media img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 18px;
      }
      .placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .ph-phone {
        width: 110px;
        height: 190px;
        background: linear-gradient(160deg, #475569, #1e293b);
        border-radius: 18px;
        position: relative;
        box-shadow: 0 10px 24px -8px rgba(15, 23, 42, 0.45);
      }
      .ph-notch {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 44px;
        height: 10px;
        background: #0f172a;
        border-radius: 0 0 8px 8px;
      }
      .ph-screen {
        position: absolute;
        inset: 8px 6px;
        background: linear-gradient(180deg, #334155, #0f172a);
        border-radius: 12px;
      }
      .main-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 18px;
      }
      .thumb-strip {
        position: absolute;
        bottom: 10px;
        left: 0;
        right: 0;
        display: flex;
        justify-content: center;
        gap: 6px;
        padding: 0 10px;
      }
      .thumb-btn {
        width: 52px;
        height: 52px;
        border: 2px solid #e2e8f0;
        border-radius: 8px;
        overflow: hidden;
        background: #fff;
        cursor: pointer;
        padding: 0;
        flex-shrink: 0;
        transition: border-color 0.15s;
      }
      .thumb-btn.active { border-color: var(--brand, var(--sf-primary)); }
      .thumb-btn img { width: 100%; height: 100%; object-fit: cover; }
      .condition {
        position: absolute;
        top: 12px;
        left: 12px;
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 999px;
        padding: 0.24rem 0.6rem;
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--sf-text-muted);
      }
      .content {
        padding: 1.2rem 1.25rem 1.4rem;
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
      }
      .meta {
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--sf-text-muted);
        font-weight: 700;
      }
      h1 {
        margin: 0;
        font-size: clamp(1.45rem, 2.8vw, 2rem);
      }
      .price {
        margin: 0;
        font-size: clamp(1.5rem, 3.8vw, 2rem);
        font-weight: 800;
        color: #0f172a;
      }
      .specs {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.55rem;
        font-size: 0.9rem;
        color: #334155;
      }
      .description h2,
      .availability h2 {
        margin: 0 0 0.4rem;
        font-size: 0.95rem;
      }
      .description p {
        margin: 0;
        color: #334155;
        line-height: 1.5;
      }
      .availability ul {
        margin: 0;
        padding-left: 1.1rem;
        color: #334155;
      }
      .availability-copy {
        margin: 0 0 0.4rem;
        color: #475569;
        font-size: 0.9rem;
      }
      .actions {
        display: flex;
        gap: 0.65rem;
        flex-wrap: wrap;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        padding: 0.62rem 0.95rem;
        border-radius: 12px;
        text-decoration: none;
        font-weight: 700;
        border: 1px solid transparent;
      }
      .btn-primary {
        background: var(--brand, var(--sf-primary));
        color: #fff;
      }
      .btn-secondary {
        background: #fff;
        color: #0f172a;
        border-color: var(--sf-border);
      }
      .btn-wa {
        background: #10b981;
        color: #fff;
      }
      @media (max-width: 900px) {
        .detail-card {
          grid-template-columns: 1fr;
        }
      }
      @media (max-width: 520px) {
        .specs {
          grid-template-columns: 1fr;
        }
        .actions .btn {
          width: 100%;
        }
      }
    `,
  ],
})
export class PublicProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicService = inject(PublicService);
  private readonly configService = inject(WebsiteConfigService);
  private readonly hostname = globalThis.location?.hostname ?? '';

  subdomain = '';
  slug = '';
  loading    = signal(false);
  error      = signal<string | null>(null);
  product    = signal<Product | null>(null);
  config     = signal<WebsiteConfig | null>(null);
  offices    = signal<PublicOffice[]>([]);
  activeImage = signal<string | null>(null);

  allImages = computed<string[]>(() => {
    const p = this.product();
    if (!p) return [];
    const extra = (p.images ?? []).filter((u) => u !== p.imageUrl);
    return p.imageUrl ? [p.imageUrl, ...extra] : extra;
  });

  brandColor = computed(() => this.config()?.primaryColor || '#2563eb');
  waLink = computed(() => {
    const name = this.product()?.name ?? 'equipo';
    return buildWa(
      this.config()?.contactPhone,
      `Hola, me interesa el ${name}.`,
    );
  });

  ngOnInit(): void {
    this.subdomain = resolvePublicSubdomain(
      this.route.snapshot.queryParamMap.get('sub'),
      this.hostname,
    );
    this.slug = this.route.snapshot.paramMap.get('slug') ?? '';

    if (!this.subdomain) return;
    if (!this.slug) {
      this.error.set('No encontramos el producto solicitado.');
      return;
    }

    this.loading.set(true);

    this.configService.getPublic(this.subdomain).subscribe({
      next: (cfg) => this.config.set(cfg),
      error: () => this.config.set(null),
    });

    this.publicService.getOffices(this.subdomain).subscribe({
      next: (offices) => this.offices.set(offices),
      error: () => this.offices.set([]),
    });

    this.publicService.getProductBySlug(this.subdomain, this.slug).subscribe({
      next: (product) => {
        this.product.set(product);
        this.activeImage.set(product.imageUrl ?? null);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        if (e.statusCode === 404) {
          this.error.set(
            'Revisa el catálogo para ver opciones similares.',
          );
        } else {
          this.error.set(
            'No pudimos cargar la información en este momento. Intenta de nuevo o escríbenos por WhatsApp.',
          );
        }
        this.loading.set(false);
      },
    });
  }

  numberPrice(value: string): number {
    return Number(value);
  }

  conditionLabel(condition: string): string {
    return CONDITION_LABEL[condition] ?? condition;
  }
}
