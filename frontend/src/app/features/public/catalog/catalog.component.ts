import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { ApiError } from '@core/models/api-error.model';
import { Product } from '@core/models/catalog.model';
import { WebsiteConfig } from '@core/models/website-config.model';
import { PublicService } from '@core/services/public.service';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { resolvePublicSubdomain } from '@core/utils/public-subdomain.util';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ProductCardComponent } from '@shared/public/product-card/product-card.component';
import { buildWa } from '@shared/public/wa-link.util';

@Component({
  selector: 'app-public-catalog',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    RouterLink,
    MessageModule,
    EmptyStateComponent,
    LoadingComponent,
    ProductCardComponent,
  ],
  template: `
    <section class="cat-header" [style.--brand]="brandColor()">
      <div class="cat-inner">
        <div>
          <span class="eyebrow">Catálogo</span>
          <h1>Cotiza celulares nuevos y usados</h1>
          <p class="text-muted">
            Encuentra el celular ideal según tu presupuesto y recibe asesoría
            personalizada por WhatsApp.
          </p>
        </div>
        <div class="header-actions">
          <a
            [routerLink]="['/cotizar']"
            [queryParams]="{ sub: subdomain }"
            class="btn btn-primary"
          >
            <i class="pi pi-bolt"></i> Solicitar asesoría
          </a>
          <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn-wa">
            <i class="pi pi-whatsapp"></i> Escribir por WhatsApp
          </a>
        </div>
      </div>
      <div class="cat-trust">
        <span><i class="pi pi-shield"></i> Garantía según condición</span>
        <span><i class="pi pi-refresh"></i> Nuevos, usados y reacondicionados</span>
        <span><i class="pi pi-bolt"></i> Cotización rápida en minutos</span>
      </div>
    </section>

    <div class="cat-body">
      <aside class="filters">
        <div class="filter-card">
          <h3>Filtros</h3>

          <div class="sf-field">
            <label>Buscar</label>
            <input
              class="sf-input"
              [(ngModel)]="search"
              placeholder="Marca o modelo..."
            />
          </div>

          <div class="sf-field">
            <label>Marca</label>
            <select class="sf-select" [(ngModel)]="brandFilter">
              <option value="">Todas</option>
              @for (b of brands(); track b) {
                <option [value]="b">{{ b }}</option>
              }
            </select>
          </div>

          <div class="sf-field">
            <label>Estado</label>
            <select class="sf-select" [(ngModel)]="conditionFilter">
              <option value="">Todos</option>
              <option value="NUEVO">Nuevo</option>
              <option value="USADO">Usado</option>
              <option value="REACONDICIONADO">Reacondicionado</option>
            </select>
          </div>

          <div class="sf-field">
            <label>
              Precio máximo
              <span class="text-muted text-xs">
                hasta {{ priceMax() | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
              </span>
            </label>
            <input
              type="range"
              [min]="rangeMin()"
              [max]="rangeMax()"
              [step]="rangeStep()"
              [(ngModel)]="priceMax"
            />
            <div class="range-meta text-xs text-muted">
              <span>{{ rangeMin() | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</span>
              <span>{{ rangeMax() | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</span>
            </div>
          </div>

          <button class="clear" type="button" (click)="clearFilters()">
            <i class="pi pi-eraser"></i> Limpiar filtros
          </button>
        </div>
      </aside>

      <main class="results">
        @if (loading()) {
          <div class="state-panel">
            <app-loading />
          </div>
        } @else if (error()) {
          <div class="state-panel">
            <p-message severity="error" [text]="error()!" />
          </div>
        } @else if (products().length === 0) {
          <div class="state-panel">
            <app-empty-state
              icon="pi pi-mobile"
              title="Estamos actualizando nuestro catálogo"
              description="Escríbenos y te ayudamos a encontrar el celular ideal."
            >
              <a
                [routerLink]="['/cotizar']"
                [queryParams]="{ sub: subdomain }"
                class="btn btn-secondary"
              >
                <i class="pi pi-bolt"></i> Solicitar asesoría
              </a>
            </app-empty-state>
          </div>
        } @else if (filtered().length === 0) {
          <div class="state-panel">
            <app-empty-state
              icon="pi pi-search"
              title="Sin coincidencias"
              description="Prueba otros filtros o escríbenos por WhatsApp para ayudarte a encontrar opciones similares."
            >
              <button class="btn btn-secondary" type="button" (click)="clearFilters()">
                Limpiar filtros
              </button>
            </app-empty-state>
          </div>
        } @else {
          <div class="result-bar">
            <span class="text-muted text-sm">
              Mostrando <strong>{{ filtered().length }}</strong> de
              {{ products().length }} productos
            </span>
          </div>
          <div class="grid" [class.tight]="filtered().length < 4">
            @for (p of filtered(); track p.id) {
              <app-product-card
                [product]="p"
                [subdomain]="subdomain"
                [contactPhone]="config()?.contactPhone"
              />
            }
          </div>
        }
      </main>
    </div>
  `,
  styles: [
    `
      :host { display: block; }

      .cat-header {
        background:
          radial-gradient(700px 300px at 90% 0%, color-mix(in srgb, var(--brand) 18%, transparent), transparent 60%),
          linear-gradient(180deg, #f8fafc, #f1f5f9);
        border-bottom: 1px solid var(--sf-border);
        padding: 2.5rem 1.25rem;
      }
      .cat-inner {
        max-width: 1180px;
        margin: 0 auto;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .eyebrow {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--brand, var(--sf-primary));
        margin-bottom: 0.35rem;
      }
      .cat-header h1 {
        font-size: clamp(1.75rem, 3vw, 2.25rem);
        margin: 0;
      }
      .cat-header p { margin-top: 0.45rem; max-width: 55ch; }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        flex-wrap: wrap;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.65rem 1rem;
        border-radius: 12px;
        font-weight: 700;
        text-decoration: none;
        border: none;
        cursor: pointer;
        font-family: inherit;
      }
      .btn-primary {
        background: var(--sf-success);
        color: #fff;
      }
      .btn-wa {
        background: #10b981;
        color: #fff;
      }
      .btn-secondary {
        background: #fff;
        color: var(--sf-text);
        border: 1px solid var(--sf-border);
      }
      .btn:hover { text-decoration: none; filter: brightness(0.97); }
      .cat-trust {
        max-width: 1180px;
        margin: 1rem auto 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        color: #334155;
      }
      .cat-trust span {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.8rem;
        font-weight: 600;
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 999px;
        padding: 0.33rem 0.62rem;
      }
      .cat-trust i { color: var(--brand, var(--sf-primary)); }

      .cat-body {
        max-width: 1180px;
        margin: 2rem auto 4rem;
        padding: 0 1.25rem;
        display: grid;
        grid-template-columns: 260px 1fr;
        gap: 1.5rem;
      }
      @media (max-width: 880px) {
        .cat-body { grid-template-columns: 1fr; }
        .filter-card {
          position: static;
        }
      }

      .filter-card {
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 14px;
        padding: 1.25rem;
        position: sticky;
        top: 90px;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }
      .filter-card h3 { margin: 0 0 0.25rem; font-size: 0.95rem; }

      input[type='range'] {
        width: 100%;
        accent-color: var(--sf-primary);
      }
      .range-meta { display: flex; justify-content: space-between; }
      .clear {
        background: transparent;
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        padding: 0.55rem;
        cursor: pointer;
        color: var(--sf-text-muted);
        font-family: inherit;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .clear:hover { background: var(--sf-surface-2); color: var(--sf-text); }

      .results { min-width: 0; }
      .state-panel {
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 14px;
        padding: 1rem;
      }
      .result-bar { margin-bottom: 1rem; }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1rem;
      }
      .grid.tight {
        grid-template-columns: repeat(auto-fit, minmax(240px, 320px));
      }
      @media (max-width: 540px) {
        .cat-header {
          padding: 2rem 1rem 1.4rem;
        }
        .cat-body {
          margin-top: 1.3rem;
          padding: 0 1rem;
        }
        .header-actions {
          width: 100%;
        }
        .header-actions .btn {
          flex: 1;
          justify-content: center;
          min-width: 0;
          font-size: 0.82rem;
          padding: 0.62rem 0.72rem;
        }
        .cat-trust {
          margin-top: 0.8rem;
          gap: 0.45rem;
        }
        .cat-trust span {
          font-size: 0.74rem;
        }
      }
      @media (max-width: 375px) {
        .grid,
        .grid.tight {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PublicCatalogComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicService = inject(PublicService);
  private readonly configService = inject(WebsiteConfigService);
  private readonly hostname = globalThis.location?.hostname ?? '';

  products = signal<Product[]>([]);
  config = signal<WebsiteConfig | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  subdomain = '';

  // Filtros
  search = '';
  brandFilter = '';
  conditionFilter = '';
  priceMax = signal<number>(0);

  brandColor = computed(() => this.config()?.primaryColor || '#2563eb');
  waLink = computed(() =>
    buildWa(this.config()?.contactPhone, 'Hola, quiero info del catálogo.'),
  );

  brands = computed(() => {
    const set = new Set<string>();
    this.products().forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set).sort();
  });

  rangeMin = computed(() => {
    const prices = this.products().map((p) => Number(p.price));
    return prices.length ? Math.floor(Math.min(...prices)) : 0;
  });

  rangeMax = computed(() => {
    const prices = this.products().map((p) => Number(p.price));
    return prices.length ? Math.ceil(Math.max(...prices)) : 10000000;
  });

  rangeStep = computed(() => {
    const span = this.rangeMax() - this.rangeMin();
    return span > 0 ? Math.max(10000, Math.round(span / 50)) : 10000;
  });

  filtered = computed(() => {
    const term = this.search.trim().toLowerCase();
    return this.products().filter((p) => {
      if (term) {
        const hay =
          `${p.name} ${p.brand ?? ''} ${p.model ?? ''}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (this.brandFilter && p.brand !== this.brandFilter) return false;
      if (this.conditionFilter && p.condition !== this.conditionFilter) return false;
      if (this.priceMax() > 0 && Number(p.price) > this.priceMax()) return false;
      return true;
    });
  });

  ngOnInit(): void {
    this.subdomain = resolvePublicSubdomain(
      this.route.snapshot.queryParamMap.get('sub'),
      this.hostname,
    );
    if (!this.subdomain) {
      this.error.set(
        'No pudimos cargar la información en este momento. Intenta de nuevo o escríbenos por WhatsApp.',
      );
      return;
    }
    this.loading.set(true);
    this.configService.getPublic(this.subdomain).subscribe({
      next: (c) => this.config.set(c),
      error: () => this.config.set(null),
    });
    this.publicService.getProducts(this.subdomain).subscribe({
      next: (res) => {
        this.products.set(res.items);
        this.priceMax.set(this.rangeMax());
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(
          e.userMessage ??
            'No pudimos cargar la información en este momento. Intenta de nuevo o escríbenos por WhatsApp.',
        );
        this.loading.set(false);
      },
    });
  }

  clearFilters(): void {
    this.search = '';
    this.brandFilter = '';
    this.conditionFilter = '';
    this.priceMax.set(this.rangeMax());
  }
}
