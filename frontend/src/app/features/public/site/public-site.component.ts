import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageModule } from 'primeng/message';
import { Product, PublicOffice } from '@core/models/catalog.model';
import {
  ServiceItem,
  WebsiteConfig,
} from '@core/models/website-config.model';
import {
  PublicService,
  PublicWebsitePage,
} from '@core/services/public.service';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { resolvePublicSubdomain } from '@core/utils/public-subdomain.util';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PublicSiteRenderComponent } from '@shared/components/public-site-render/public-site-render.component';
import { FaqAccordionComponent } from '@shared/public/faq-accordion/faq-accordion.component';
import { OfficeCardComponent } from '@shared/public/office-card/office-card.component';
import { ProductCardComponent } from '@shared/public/product-card/product-card.component';
import { PublicCtaComponent } from '@shared/public/public-cta/public-cta.component';
import {
  DEFAULT_BENEFITS,
  DEFAULT_FAQ,
  DEFAULT_SERVICES,
} from '@shared/public/public-defaults';
import { PublicHeroComponent } from '@shared/public/public-hero/public-hero.component';
import { ServiceCardComponent } from '@shared/public/service-card/service-card.component';

interface PublicCompany {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
}

@Component({
  selector: 'app-public-site',
  standalone: true,
  imports: [
    RouterLink,
    MessageModule,
    LoadingComponent,
    PublicSiteRenderComponent,
    PublicHeroComponent,
    ProductCardComponent,
    ServiceCardComponent,
    OfficeCardComponent,
    FaqAccordionComponent,
    PublicCtaComponent,
  ],
  template: `
    @if (loading()) {
      <app-loading />
    } @else if (!subdomain) {
      <div class="empty-shell">
        <p-message
          severity="error"
          text="No pudimos cargar la información en este momento. Intenta de nuevo o escríbenos por WhatsApp."
        />
      </div>
    } @else if (publishedPage()) {
      <app-public-site-render
        [config]="config()"
        [companyName]="company()?.name ?? ''"
        [subdomain]="subdomain"
        [sections]="publishedPage()!.sections"
        [products]="products()"
        [offices]="offices()"
      />
    } @else if (isUnconfigured()) {
      <div class="unconfigured-shell">
        <div class="unconfigured-card">
          <div class="unc-icon">
            <i class="pi pi-store"></i>
          </div>
          <h1>{{ company()?.name ?? 'Tienda' }}</h1>
          <p class="unc-sub">Estamos preparando nuestra tienda para atenderte mejor.</p>
          <p class="unc-hint text-muted">Pronto tendremos productos, precios y más información disponible.</p>
          @if (config()?.contactPhone) {
            <a [href]="unconfiguredWaLink()" target="_blank" class="unc-wa-btn">
              <i class="pi pi-whatsapp"></i> Contáctanos por WhatsApp
            </a>
          }
        </div>
      </div>
    } @else {
      <app-public-hero
        [company]="company()"
        [config]="config()"
        [subdomain]="subdomain"
      />

      <section class="trust-strip">
        <div class="trust-inner">
          <article class="trust-item">
            <i class="pi pi-shield"></i>
            <div>
              <h3>Garantía real</h3>
              <p>Equipos nuevos, usados y reacondicionados con respaldo.</p>
            </div>
          </article>
          <article class="trust-item">
            <i class="pi pi-whatsapp"></i>
            <div>
              <h3>Respuesta por WhatsApp</h3>
              <p>Atención comercial rápida para resolver tu compra.</p>
            </div>
          </article>
          <article class="trust-item">
            <i class="pi pi-map-marker"></i>
            <div>
              <h3>Atención en oficina</h3>
              <p>Puedes visitar una sede activa o coordinar entrega.</p>
            </div>
          </article>
          <article class="trust-item">
            <i class="pi pi-user"></i>
            <div>
              <h3>Asesoría honesta</h3>
              <p>Te recomendamos según uso, presupuesto y prioridad.</p>
            </div>
          </article>
        </div>
      </section>

      @if (products().length > 0) {
        <section class="section">
          <header class="section-head">
            <div>
              <span class="eyebrow">Productos destacados</span>
              <h2>Lo que más están preguntando</h2>
            </div>
            <a
              [routerLink]="['/catalogo']"
              [queryParams]="{ sub: subdomain }"
              class="link-arrow"
            >
              Ver catálogo completo <i class="pi pi-arrow-right"></i>
            </a>
          </header>

          <div class="grid products">
            @for (p of products(); track p.id) {
              <app-product-card
                [product]="p"
                [subdomain]="subdomain"
                [contactPhone]="config()?.contactPhone"
              />
            }
          </div>
        </section>
      }

      <section class="section" id="servicios">
        <header class="section-head">
          <div>
            <span class="eyebrow">Servicios</span>
            <h2>Todo lo que necesitas en un solo lugar</h2>
            <p class="sub text-muted">
              Compra, repara, asesórate y recibe soporte cuando lo necesites.
            </p>
          </div>
        </header>
        <div class="grid services">
          @for (s of services(); track s.title) {
            <app-service-card
              [service]="s"
              [brandColor]="brandColor()"
            />
          }
        </div>
      </section>

      <section class="section">
        <header class="section-head">
          <div>
            <span class="eyebrow">Por qué elegirnos</span>
            <h2>Confianza, asesoría y atención cercana</h2>
          </div>
        </header>
        <div class="grid benefits">
          @for (b of benefits; track b.title) {
            <article class="benefit">
              <div class="ben-icon" [style.--brand]="brandColor()">
                <i [class]="'pi ' + b.icon"></i>
              </div>
              <div>
                <h3>{{ b.title }}</h3>
                <p class="text-muted text-sm">{{ b.description }}</p>
              </div>
            </article>
          }
        </div>
      </section>

      @if (offices().length > 0) {
        <section class="section" id="oficinas">
          <header class="section-head">
            <div>
              <span class="eyebrow">Oficinas</span>
              <h2>Visítanos o llámanos</h2>
              <p class="sub text-muted">
                Atención presencial en nuestras sedes activas.
              </p>
            </div>
          </header>
          <div class="grid offices">
            @for (o of offices(); track o.id) {
              <app-office-card [office]="o" [subdomain]="subdomain" />
            }
          </div>
        </section>
      }

      <section class="section" id="contacto">
        <header class="section-head">
          <div>
            <span class="eyebrow">Preguntas frecuentes</span>
            <h2>Lo que más nos preguntan</h2>
          </div>
        </header>
        <div class="faq-wrap">
          <app-faq-accordion [items]="faqItems()" />
        </div>
      </section>

      <section class="section cta-section">
        <app-public-cta
          [subdomain]="subdomain"
          [contactPhone]="config()?.contactPhone"
          [brandColor]="brandColor()"
        />
      </section>
    }
  `,
  styles: [
    `
      :host { display: block; }
      .empty-shell { padding: 4rem 1.5rem; max-width: 720px; margin: 0 auto; }

      .unconfigured-shell {
        min-height: 70vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem 1.5rem;
      }
      .unconfigured-card {
        text-align: center;
        max-width: 420px;
      }
      .unc-icon {
        width: 72px;
        height: 72px;
        border-radius: 20px;
        background: #eff6ff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        color: var(--sf-primary, #2563eb);
        margin-bottom: 1.2rem;
      }
      .unconfigured-card h1 {
        margin: 0 0 0.5rem;
        font-size: clamp(1.4rem, 4vw, 2rem);
      }
      .unc-sub {
        margin: 0 0 0.5rem;
        font-size: 1rem;
        color: #334155;
      }
      .unc-hint {
        font-size: 0.88rem;
        margin: 0 0 1.5rem;
      }
      .unc-wa-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1.2rem;
        background: #10b981;
        color: #fff;
        border-radius: 12px;
        font-weight: 700;
        text-decoration: none;
        font-size: 0.95rem;
      }
      .unc-wa-btn:hover { opacity: 0.9; }

      .section {
        max-width: 1180px;
        margin: 4rem auto 0;
        padding: 0 1.25rem;
      }
      .trust-strip {
        max-width: 1180px;
        margin: 1.2rem auto 0;
        padding: 0 1.25rem;
      }
      .trust-inner {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.85rem;
      }
      .trust-item {
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 14px;
        padding: 0.9rem;
        display: grid;
        grid-template-columns: 38px 1fr;
        gap: 0.7rem;
        align-items: flex-start;
      }
      .trust-item i {
        width: 38px;
        height: 38px;
        border-radius: 10px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: color-mix(in srgb, var(--sf-primary) 12%, transparent);
        color: var(--sf-primary);
      }
      .trust-item h3 {
        margin: 0;
        font-size: 0.92rem;
      }
      .trust-item p {
        margin: 0.2rem 0 0;
        color: var(--sf-text-muted);
        font-size: 0.83rem;
        line-height: 1.45;
      }
      .cta-section { padding: 0; max-width: none; margin: 4rem auto 0; }
      .section-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }
      .eyebrow {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--sf-primary);
        margin-bottom: 0.35rem;
      }
      .section-head h2 {
        font-size: clamp(1.5rem, 3vw, 2rem);
        letter-spacing: -0.02em;
        margin: 0;
      }
      .section-head .sub { margin-top: 0.45rem; max-width: 60ch; }
      .link-arrow {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--sf-primary);
        font-weight: 600;
        font-size: 0.92rem;
      }
      .link-arrow:hover { text-decoration: underline; }

      .grid { display: grid; gap: 1rem; }
      .grid.products { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
      .grid.services { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
      .grid.offices { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
      .grid.benefits { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }

      .benefit {
        display: flex;
        gap: 0.85rem;
        padding: 1.1rem;
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 14px;
      }
      .ben-icon {
        flex: 0 0 40px;
        width: 40px;
        height: 40px;
        border-radius: 11px;
        background: color-mix(in srgb, var(--brand) 12%, transparent);
        color: var(--brand);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
      }
      .benefit h3 { margin: 0; font-size: 0.98rem; font-weight: 700; }

      .faq-wrap { max-width: 820px; margin: 0 auto; }
      @media (max-width: 768px) {
        .section {
          margin-top: 2.6rem;
          padding: 0 1rem;
        }
        .trust-strip {
          margin-top: 0.9rem;
          padding: 0 1rem;
        }
        .cta-section {
          margin-top: 2.8rem;
        }
        .section-head {
          margin-bottom: 1rem;
        }
        .section-head h2 {
          font-size: clamp(1.3rem, 7vw, 1.65rem);
        }
      }
      @media (max-width: 430px) {
        .trust-inner {
          grid-template-columns: 1fr;
        }
        .trust-item {
          grid-template-columns: 34px 1fr;
          padding: 0.8rem;
        }
        .trust-item i {
          width: 34px;
          height: 34px;
          font-size: 0.88rem;
        }
      }
    `,
  ],
})
export class PublicSiteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicService = inject(PublicService);
  private readonly configService = inject(WebsiteConfigService);
  private readonly hostname = globalThis.location?.hostname ?? '';

  company = signal<PublicCompany | null>(null);
  config = signal<WebsiteConfig | null>(null);
  publishedPage = signal<PublicWebsitePage | null>(null);
  products = signal<Product[]>([]);
  offices = signal<PublicOffice[]>([]);
  loading = signal(false);
  subdomain = '';

  readonly benefits = DEFAULT_BENEFITS;

  brandColor = computed(() => this.config()?.primaryColor || '#2563eb');

  isUnconfigured = computed(() =>
    !this.loading() &&
    !this.publishedPage() &&
    this.products().length === 0 &&
    this.offices().length === 0 &&
    !this.config(),
  );

  unconfiguredWaLink = computed(() => {
    const phone = this.config()?.contactPhone;
    if (!phone) return '#';
    const clean = phone.replace(/\D/g, '');
    return `https://wa.me/${clean}?text=${encodeURIComponent('Hola, me interesa conocer más sobre su tienda.')}`;
  });

  services = computed<ServiceItem[]>(() => {
    const fromConfig = this.config()?.services ?? [];
    return fromConfig.length > 0 ? fromConfig : DEFAULT_SERVICES;
  });

  faqItems = computed(() => {
    const fromConfig = this.config()?.faq ?? [];
    return fromConfig.length > 0 ? fromConfig : DEFAULT_FAQ;
  });

  ngOnInit(): void {
    this.subdomain = resolvePublicSubdomain(
      this.route.snapshot.queryParamMap.get('sub'),
      this.hostname,
    );
    if (!this.subdomain) return;
    this.loading.set(true);
    this.publicService.getCompany(this.subdomain).subscribe({
      next: (c) => this.company.set(c),
      error: () => undefined,
    });
    this.publicService.getWebsite(this.subdomain).subscribe({
      next: (res) => {
        this.config.set(res.theme ?? null);
        this.publishedPage.set(res.page ?? null);
        this.loading.set(false);
      },
      error: () => {
        // Fallback heredado: si el endpoint público del builder falla,
        // seguimos operando con WebsiteConfig para no romper la web.
        this.configService.getPublic(this.subdomain).subscribe({
          next: (cfg) => {
            this.config.set(cfg);
            this.publishedPage.set(null);
            this.loading.set(false);
          },
          error: () => {
            this.config.set(null);
            this.publishedPage.set(null);
            this.loading.set(false);
          },
        });
      },
    });
    this.publicService.getProducts(this.subdomain).subscribe({
      next: (res) => this.products.set(res.items.slice(0, 6)),
      error: () => this.products.set([]),
    });
    this.publicService.getOffices(this.subdomain).subscribe({
      next: (o) => this.offices.set(o),
      error: () => this.offices.set([]),
    });
  }
}
