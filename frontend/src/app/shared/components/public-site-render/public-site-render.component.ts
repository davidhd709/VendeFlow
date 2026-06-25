import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product, PublicOffice } from '@core/models/catalog.model';
import {
  PublishedSection,
  WebsitePageTheme,
} from '@core/models/website-builder.model';
import { ServiceItem, WebsiteConfig } from '@core/models/website-config.model';
import { DEFAULT_FAQ, DEFAULT_SERVICES } from '@shared/public/public-defaults';
import { FaqAccordionComponent } from '@shared/public/faq-accordion/faq-accordion.component';
import { OfficeCardComponent } from '@shared/public/office-card/office-card.component';
import { ProductCardComponent } from '@shared/public/product-card/product-card.component';
import { PublicCtaComponent } from '@shared/public/public-cta/public-cta.component';
import { PublicHeroComponent } from '@shared/public/public-hero/public-hero.component';
import { ServiceCardComponent } from '@shared/public/service-card/service-card.component';
import { buildWa } from '@shared/public/wa-link.util';

/**
 * Render solo de contenido (sin navbar/footer) para la vista previa del ADMIN
 * y la web publica con snapshot publicado.
 */
@Component({
  selector: 'app-public-site-render',
  standalone: true,
  imports: [
    RouterLink,
    PublicHeroComponent,
    ServiceCardComponent,
    FaqAccordionComponent,
    PublicCtaComponent,
    ProductCardComponent,
    OfficeCardComponent,
  ],
  template: `
    <div
      class="site-theme-shell"
      [attr.data-theme]="pageTheme()"
      [class.theme-commercial-shell]="pageTheme() === 'commercial'"
      [class.theme-premium-shell]="pageTheme() === 'premium'"
      [class.theme-vibrant-shell]="pageTheme() === 'vibrant'"
    >
      @if (hasPublishedSections()) {
        @for (section of visibleSections(); track $index) {
          @switch (section.type) {
            @case ('HERO') {
              <app-public-hero
                [config]="heroConfig(section)"
                [company]="companyShim()"
                [subdomain]="subdomain()"
                [theme]="pageTheme()"
              />
            }

            @case ('FEATURED_PRODUCTS') {
              <section
                class="section section-products"
                [class.variant-featured-carousel]="sectionVariant(section, 'grid') === 'compact'"
                [class.variant-featured-highlight]="sectionVariant(section, 'grid') === 'highlight'"
                [class.theme-products-premium]="pageTheme() === 'premium'"
                [class.theme-products-vibrant]="pageTheme() === 'vibrant'"
              >
                <header>
                  <span class="eyebrow">
                    {{ sectionEyebrow(section) || 'Productos destacados' }}
                  </span>
                  <h2>{{ sectionTitle(section, 'Celulares recomendados para ti') }}</h2>
                </header>

                @if (featuredProductsFromSection(section).length > 0) {
                  @if (pageTheme() === 'premium') {
                    <div class="premium-product-stage">
                      @if (featuredProductsFromSection(section)[0]; as mainProduct) {
                        <article class="premium-main-product">
                          <span class="chip">Selección premium</span>
                          <h3>{{ mainProduct.name }}</h3>
                          <p>
                            Producto destacado para clientes que buscan rendimiento,
                            diseño y respaldo premium.
                          </p>
                          <div class="premium-actions">
                            <a
                              [routerLink]="['/catalogo', mainProduct.slug]"
                              [queryParams]="{ sub: subdomain() }"
                            >
                              Ver detalle
                            </a>
                            <a
                              [routerLink]="['/cotizar']"
                              [queryParams]="{ sub: subdomain() }"
                            >
                              Cotizar ahora
                            </a>
                          </div>
                        </article>
                      }
                      <div class="grid products">
                        @for (p of featuredProductsFromSection(section).slice(1); track p.id) {
                          <app-product-card
                            [product]="p"
                            [subdomain]="subdomain()"
                            [contactPhone]="config()?.contactPhone"
                          />
                        }
                      </div>
                    </div>
                  } @else if (pageTheme() === 'vibrant') {
                    <div class="vibrant-product-stage">
                      @if (featuredProductsFromSection(section)[0]; as promoProduct) {
                        <article class="vibrant-main-product">
                          <span class="ribbon">Oferta destacada</span>
                          <h3>{{ promoProduct.name }}</h3>
                          <p>Ideal para clientes que quieren cerrar compra rápida hoy.</p>
                          <div class="vibrant-main-actions">
                            <a
                              [routerLink]="['/cotizar']"
                              [queryParams]="{ sub: subdomain() }"
                            >
                              Cotizar ahora
                            </a>
                            <a
                              [href]="buildProductWaMessage(promoProduct.name)"
                              target="_blank"
                              rel="noopener"
                            >
                              WhatsApp directo
                            </a>
                          </div>
                        </article>
                      }
                      <aside class="promo-board" aria-hidden="true">
                        <h3>Campaña activa</h3>
                        <ul>
                          <li>Respuesta rápida por WhatsApp</li>
                          <li>Opciones por presupuesto</li>
                          <li>Entrega en oficina o domicilio</li>
                        </ul>
                      </aside>
                      <div class="vibrant-secondary-products">
                        @for (p of featuredProductsFromSection(section).slice(1, 4); track p.id) {
                          <app-product-card
                            [product]="p"
                            [subdomain]="subdomain()"
                            [contactPhone]="config()?.contactPhone"
                          />
                        }
                      </div>
                    </div>
                  } @else {
                    <div class="grid products">
                      @for (p of featuredProductsFromSection(section); track p.id) {
                        <app-product-card
                          [product]="p"
                          [subdomain]="subdomain()"
                          [contactPhone]="config()?.contactPhone"
                        />
                      }
                    </div>
                  }
                } @else {
                  <div class="empty-section">
                    Estamos actualizando nuestro catálogo. Escríbenos y te ayudamos a
                    encontrar el celular ideal.
                  </div>
                }
              </section>
            }

            @case ('SERVICES') {
              <section
                class="section"
                [class.variant-services-list]="sectionVariant(section, 'grid') === 'list'"
                [class.variant-services-highlight]="sectionVariant(section, 'grid') === 'featured'"
                [class.premium-services-layout]="pageTheme() === 'premium'"
              >
                <header>
                  <span class="eyebrow">{{ sectionEyebrow(section) || 'Servicios' }}</span>
                  <h2>{{ sectionTitle(section, 'Servicios para tu compra y postventa') }}</h2>
                </header>
                @if (pageTheme() === 'premium') {
                  <div class="premium-service-list">
                    @for (s of servicesFromSection(section); track s.title; let idx = $index) {
                      <article>
                        <span class="idx">0{{ idx + 1 }}</span>
                        <div>
                          <h3>{{ s.title }}</h3>
                          @if (s.description) {
                            <p>{{ s.description }}</p>
                          }
                        </div>
                      </article>
                    }
                  </div>
                } @else if (pageTheme() === 'vibrant') {
                  <div class="vibrant-service-tiles">
                    @for (s of servicesFromSection(section); track s.title) {
                      <article>
                        <h3>{{ s.title }}</h3>
                        @if (s.description) {
                          <p>{{ s.description }}</p>
                        }
                      </article>
                    }
                  </div>
                } @else {
                  <div class="grid services">
                    @for (s of servicesFromSection(section); track s.title) {
                      <app-service-card [service]="s" [brandColor]="brandColor()" />
                    }
                  </div>
                }
              </section>
            }

            @case ('BENEFITS') {
              <section
                class="section"
                [class.variant-services-list]="sectionVariant(section, 'grid') === 'list'"
                [class.variant-services-highlight]="sectionVariant(section, 'grid') === 'featured'"
                [class.premium-services-layout]="pageTheme() === 'premium'"
              >
                <header>
                  <span class="eyebrow">{{ sectionEyebrow(section) || 'Beneficios' }}</span>
                  <h2>{{ sectionTitle(section, 'Por que elegirnos') }}</h2>
                </header>
                @if (pageTheme() === 'premium') {
                  <div class="premium-service-list">
                    @for (s of servicesFromSection(section); track s.title; let idx = $index) {
                      <article>
                        <span class="idx">0{{ idx + 1 }}</span>
                        <div>
                          <h3>{{ s.title }}</h3>
                          @if (s.description) {
                            <p>{{ s.description }}</p>
                          }
                        </div>
                      </article>
                    }
                  </div>
                } @else if (pageTheme() === 'vibrant') {
                  <div class="vibrant-service-tiles">
                    @for (s of servicesFromSection(section); track s.title) {
                      <article>
                        <h3>{{ s.title }}</h3>
                        @if (s.description) {
                          <p>{{ s.description }}</p>
                        }
                      </article>
                    }
                  </div>
                } @else {
                  <div class="grid services">
                    @for (s of servicesFromSection(section); track s.title) {
                      <app-service-card [service]="s" [brandColor]="brandColor()" />
                    }
                  </div>
                }
              </section>
            }

            @case ('OFFICES') {
              <section
                class="section"
                [class.variant-offices-compact]="sectionVariant(section, 'cards') === 'compact'"
                [class.variant-offices-main]="sectionVariant(section, 'cards') === 'contact'"
                [class.premium-offices-layout]="pageTheme() === 'premium'"
              >
                <header>
                  <span class="eyebrow">{{ sectionEyebrow(section) || 'Oficinas' }}</span>
                  <h2>{{ sectionTitle(section, 'Consulta el punto de atención más cercano') }}</h2>
                </header>
                @if (offices().length > 0) {
                  @if (pageTheme() === 'premium') {
                    <div class="premium-office-list">
                      @for (office of offices(); track office.id) {
                        <article>
                          <h3>{{ office.name }}</h3>
                          <p>{{ office.city || 'Ciudad principal' }}</p>
                          @if (office.address) {
                            <small>{{ office.address }}</small>
                          }
                        </article>
                      }
                    </div>
                  } @else if (pageTheme() === 'vibrant') {
                    <div class="vibrant-office-layout">
                      <article class="vibrant-office-callout">
                        <h3>¿Quieres atención inmediata?</h3>
                        <p>Elige tu sede y te ayudamos por WhatsApp en minutos.</p>
                      </article>
                      <div class="grid offices">
                        @for (office of offices(); track office.id) {
                          <app-office-card [office]="office" [subdomain]="subdomain()" />
                        }
                      </div>
                    </div>
                  } @else {
                    <div class="grid offices">
                      @for (office of offices(); track office.id) {
                        <app-office-card [office]="office" [subdomain]="subdomain()" />
                      }
                    </div>
                  }
                } @else {
                  <div class="empty-section">
                    Contáctanos por WhatsApp y te indicaremos el punto de atención más cercano.
                  </div>
                }
              </section>
            }

            @case ('FAQ') {
              <section class="section">
                <header>
                  <span class="eyebrow">
                    {{ sectionEyebrow(section) || 'Preguntas frecuentes' }}
                  </span>
                  <h2>{{ sectionTitle(section, 'FAQ') }}</h2>
                </header>
                @if (sectionVariant(section, 'accordion') === 'accordion') {
                  <div class="faq">
                    <app-faq-accordion [items]="faqFromSection(section)" />
                  </div>
                } @else if (sectionVariant(section, 'accordion') === 'list') {
                  <div class="faq-simple">
                    @for (item of faqFromSection(section); track item.question) {
                      <article>
                        <h3>{{ item.question }}</h3>
                        <p>{{ item.answer }}</p>
                      </article>
                    }
                  </div>
                } @else {
                  <div class="faq-columns">
                    @for (item of faqFromSection(section); track item.question) {
                      <article>
                        <h3>{{ item.question }}</h3>
                        <p>{{ item.answer }}</p>
                      </article>
                    }
                  </div>
                }
              </section>
            }

            @case ('CTA') {
              <section
                class="section cta-wrap"
                [class.variant-cta-split]="sectionVariant(section, 'centered') === 'split'"
                [class.variant-cta-image]="sectionVariant(section, 'centered') === 'banner'"
              >
                <app-public-cta
                  [subdomain]="subdomain()"
                  [contactPhone]="config()?.contactPhone"
                  [brandColor]="brandColor()"
                  [theme]="pageTheme()"
                />
              </section>
            }

            @case ('CONTACT') {
              @if (hasContact()) {
                <section
                  class="section contact"
                  [class.variant-contact-list]="sectionVariant(section, 'card') === 'channels'"
                  [class.premium-contact-layout]="pageTheme() === 'premium'"
                >
                  <header>
                    <span class="eyebrow">Contacto</span>
                    <h2>Como te contactan</h2>
                  </header>
                  <div class="contact-row">
                    @if (config()?.contactPhone) {
                      <span><i class="pi pi-phone"></i> {{ config()!.contactPhone }}</span>
                    }
                    @if (config()?.contactEmail) {
                      <span><i class="pi pi-envelope"></i> {{ config()!.contactEmail }}</span>
                    }
                    @if (config()?.address) {
                      <span><i class="pi pi-map-marker"></i> {{ config()!.address }}</span>
                    }
                  </div>
                </section>
              }
            }
          }
        }
      } @else {
        <app-public-hero
          [config]="config()"
          [company]="companyShim()"
          [subdomain]="subdomain()"
          [theme]="pageTheme()"
        />

        <section class="section">
          <header>
            <span class="eyebrow">Servicios</span>
            <h2>Servicios para tu compra y postventa</h2>
          </header>
          <div class="grid services">
            @for (s of services(); track s.title) {
              <app-service-card [service]="s" [brandColor]="brandColor()" />
            }
          </div>
        </section>

        <section class="section">
          <header>
            <span class="eyebrow">Preguntas frecuentes</span>
            <h2>Resolvemos tus dudas antes de comprar</h2>
          </header>
          <div class="faq">
            <app-faq-accordion [items]="faqItems()" />
          </div>
        </section>

        @if (hasContact()) {
          <section class="section contact">
            <header>
              <span class="eyebrow">Contacto</span>
              <h2>Como te contactan</h2>
            </header>
            <div class="contact-row">
              @if (config()?.contactPhone) {
                <span><i class="pi pi-phone"></i> {{ config()!.contactPhone }}</span>
              }
              @if (config()?.contactEmail) {
                <span><i class="pi pi-envelope"></i> {{ config()!.contactEmail }}</span>
              }
              @if (config()?.address) {
                <span><i class="pi pi-map-marker"></i> {{ config()!.address }}</span>
              }
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .site-theme-shell {
        --sf-theme-soft-bg: #ffffff;
        --sf-theme-section-bg: transparent;
        --sf-theme-border: var(--sf-border);
        --sf-theme-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      }

      .site-theme-shell[data-theme='commercial'] {
        --sf-theme-soft-bg: #ffffff;
        --sf-theme-section-bg: transparent;
        --sf-theme-border: #dbe3ef;
        --sf-theme-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
        --sf-primary: #1d4ed8;
        --sf-text: #0f172a;
        --sf-text-muted: #475569;
        background: linear-gradient(180deg, #f8fbff 0%, #ffffff 55%);
      }

      .site-theme-shell[data-theme='premium'] {
        --sf-theme-soft-bg: #0f172a;
        --sf-theme-section-bg: rgba(15, 23, 42, 0.65);
        --sf-theme-border: #334155;
        --sf-theme-shadow: 0 16px 42px rgba(2, 6, 23, 0.5);
        --sf-primary: #d1b479;
        --sf-text: #f8fafc;
        --sf-text-muted: #cbd5e1;
        background:
          radial-gradient(circle at 90% 2%, rgba(209, 180, 121, 0.18), transparent 35%),
          linear-gradient(165deg, #020617 0%, #0f172a 60%, #111827 100%);
        font-family: 'Georgia', 'Times New Roman', serif;
      }

      .site-theme-shell[data-theme='vibrant'] {
        --sf-theme-soft-bg: #ecfeff;
        --sf-theme-section-bg: #f8fdff;
        --sf-theme-border: #93c5fd;
        --sf-theme-shadow: 0 18px 44px rgba(14, 116, 144, 0.16);
        --sf-primary: #0284c7;
        --sf-text: #0c4a6e;
        --sf-text-muted: #0369a1;
        background:
          radial-gradient(circle at 85% 6%, rgba(14, 165, 233, 0.2), transparent 42%),
          radial-gradient(circle at 12% 28%, rgba(59, 130, 246, 0.16), transparent 38%),
          linear-gradient(180deg, #eef9ff 0%, #ffffff 60%);
        font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
      }

      .section {
        max-width: 1120px;
        margin: 2.8rem auto 0;
        padding: 0 1.25rem;
        background: var(--sf-theme-section-bg);
        border-radius: 18px;
      }

      .site-theme-shell[data-theme='premium'] .section {
        max-width: 1020px;
        padding: 1.1rem 1.3rem 1.4rem;
        border: 1px solid rgba(148, 163, 184, 0.22);
      }

      .site-theme-shell[data-theme='vibrant'] .section {
        padding: 1rem 1.25rem 1.2rem;
        border: 1px solid #93c5fd;
        box-shadow: var(--sf-theme-shadow);
      }

      .eyebrow {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--sf-primary);
        margin-bottom: 0.25rem;
      }

      h2 {
        font-size: 1.56rem;
        letter-spacing: -0.02em;
        margin: 0 0 1rem;
        color: var(--sf-text);
      }

      .site-theme-shell[data-theme='premium'] h2 {
        font-size: 1.9rem;
        letter-spacing: -0.03em;
      }

      .site-theme-shell[data-theme='vibrant'] .eyebrow {
        color: #0369a1;
        background: #e0f2fe;
        border: 1px solid #bae6fd;
        padding: 0.18rem 0.45rem;
        border-radius: 999px;
      }

      .site-theme-shell[data-theme='vibrant'] h2 {
        font-size: 1.7rem;
      }

      .grid.services,
      .grid.products,
      .grid.offices {
        display: grid;
        gap: 1rem;
      }
      .grid.products,
      .grid.services {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      }
      .grid.offices {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }

      .site-theme-shell[data-theme='premium'] .grid.products {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .site-theme-shell[data-theme='premium'] .grid.services,
      .site-theme-shell[data-theme='premium'] .grid.offices {
        grid-template-columns: 1fr;
      }

      .site-theme-shell[data-theme='vibrant'] .grid.products,
      .site-theme-shell[data-theme='vibrant'] .grid.services {
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 1.2rem;
      }

      .site-theme-shell[data-theme='vibrant'] .grid.offices {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.2rem;
      }

      .premium-product-stage,
      .vibrant-product-stage {
        display: grid;
        gap: 1rem;
      }

      .premium-product-stage {
        grid-template-columns: minmax(260px, 0.9fr) minmax(0, 1.1fr);
        align-items: start;
      }

      .premium-main-product {
        border: 1px solid rgba(209, 180, 121, 0.45);
        border-radius: 18px;
        padding: 1.2rem;
        background: linear-gradient(160deg, rgba(15, 23, 42, 0.9), rgba(2, 6, 23, 0.94));
        color: #f8fafc;
        min-height: 100%;
      }

      .premium-main-product .chip {
        display: inline-flex;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: #111827;
        background: #d1b479;
        border-radius: 999px;
        padding: 0.2rem 0.55rem;
      }

      .premium-main-product h3 {
        margin: 0.8rem 0 0.55rem;
        font-size: 1.3rem;
      }

      .premium-main-product p {
        margin: 0;
        color: #cbd5e1;
        line-height: 1.5;
      }

      .premium-actions {
        display: grid;
        gap: 0.55rem;
        margin-top: 1rem;
      }

      .premium-actions a {
        display: inline-flex;
        justify-content: center;
        text-decoration: none;
        border-radius: 999px;
        font-weight: 700;
        padding: 0.5rem 0.8rem;
      }

      .premium-actions a:first-child {
        background: transparent;
        color: #f8fafc;
        border: 1px solid #475569;
      }

      .premium-actions a:last-child {
        background: #d1b479;
        color: #111827;
      }

      .vibrant-product-stage {
        grid-template-columns: minmax(260px, 1fr) minmax(220px, 0.75fr) minmax(0, 1.25fr);
        align-items: start;
      }

      .vibrant-main-product {
        border-radius: 20px;
        border: 1px solid #60a5fa;
        background: linear-gradient(160deg, #0ea5e9, #2563eb);
        color: #fff;
        padding: 1rem;
      }

      .vibrant-main-product .ribbon {
        display: inline-flex;
        border-radius: 999px;
        background: #fef08a;
        color: #92400e;
        padding: 0.18rem 0.55rem;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .vibrant-main-product h3 {
        margin: 0.7rem 0 0.45rem;
        font-size: 1.25rem;
      }

      .vibrant-main-product p {
        margin: 0;
        color: #e0f2fe;
        font-size: 0.9rem;
        line-height: 1.45;
      }

      .vibrant-main-actions {
        display: grid;
        gap: 0.45rem;
        margin-top: 0.95rem;
      }

      .vibrant-main-actions a {
        display: inline-flex;
        justify-content: center;
        border-radius: 999px;
        text-decoration: none;
        font-weight: 700;
        padding: 0.45rem 0.75rem;
      }

      .vibrant-main-actions a:first-child {
        background: #fef08a;
        color: #0c4a6e;
      }

      .vibrant-main-actions a:last-child {
        background: rgba(255, 255, 255, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.5);
        color: #fff;
      }

      .vibrant-secondary-products {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.75rem;
      }

      .promo-board {
        border-radius: 18px;
        background: linear-gradient(165deg, #0ea5e9, #2563eb);
        color: #fff;
        padding: 1.1rem 1rem;
      }

      .promo-board h3 {
        margin: 0 0 0.6rem;
        font-size: 1.05rem;
      }

      .promo-board ul {
        list-style: none;
        margin: 0;
        padding: 0;
        display: grid;
        gap: 0.45rem;
        font-size: 0.86rem;
      }

      .promo-board li::before {
        content: '●';
        margin-right: 0.35rem;
      }

      .premium-service-list {
        display: grid;
        gap: 0.65rem;
      }

      .premium-service-list article {
        display: grid;
        grid-template-columns: 56px 1fr;
        gap: 0.8rem;
        align-items: start;
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 14px;
        background: rgba(15, 23, 42, 0.72);
        padding: 0.85rem;
      }

      .premium-service-list .idx {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 1px solid rgba(209, 180, 121, 0.45);
        color: #d1b479;
        font-weight: 700;
      }

      .premium-service-list h3 {
        margin: 0;
        font-size: 1rem;
        color: #f8fafc;
      }

      .premium-service-list p {
        margin: 0.32rem 0 0;
        color: #cbd5e1;
        font-size: 0.87rem;
      }

      .vibrant-service-tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 0.75rem;
      }

      .vibrant-service-tiles article {
        border-radius: 16px;
        border: 1px solid #7dd3fc;
        background: linear-gradient(155deg, #e0f2fe, #dbeafe);
        padding: 0.85rem;
      }

      .vibrant-service-tiles h3 {
        margin: 0;
        font-size: 0.95rem;
        color: #0c4a6e;
      }

      .vibrant-service-tiles p {
        margin: 0.32rem 0 0;
        color: #0369a1;
        font-size: 0.84rem;
      }

      .variant-featured-carousel .grid.products {
        display: flex;
        overflow-x: auto;
        padding-bottom: 0.35rem;
      }

      .variant-featured-carousel .grid.products app-product-card {
        min-width: 240px;
      }

      .variant-featured-highlight .grid.products {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }

      .variant-services-list .grid.services,
      .variant-offices-compact .grid.offices {
        grid-template-columns: 1fr;
      }

      .variant-services-highlight .grid.services,
      .variant-offices-main .grid.offices {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      }

      .premium-services-layout .grid.services,
      .premium-offices-layout .grid.offices {
        gap: 0.75rem;
      }

      .premium-office-list {
        display: grid;
        gap: 0.65rem;
      }

      .premium-office-list article {
        border: 1px solid rgba(148, 163, 184, 0.28);
        border-radius: 12px;
        background: rgba(15, 23, 42, 0.72);
        padding: 0.8rem 0.9rem;
      }

      .premium-office-list h3 {
        margin: 0;
        color: #f8fafc;
        font-size: 0.95rem;
      }

      .premium-office-list p {
        margin: 0.3rem 0 0;
        color: #cbd5e1;
        font-size: 0.82rem;
      }

      .premium-office-list small {
        display: inline-block;
        margin-top: 0.22rem;
        color: #94a3b8;
      }

      .vibrant-office-layout {
        display: grid;
        grid-template-columns: minmax(230px, 0.85fr) minmax(0, 1.15fr);
        gap: 0.9rem;
      }

      .vibrant-office-callout {
        border-radius: 18px;
        border: 1px solid #7dd3fc;
        background: linear-gradient(165deg, #0ea5e9, #2563eb);
        color: #fff;
        padding: 0.95rem;
      }

      .vibrant-office-callout h3 {
        margin: 0;
        font-size: 1rem;
      }

      .vibrant-office-callout p {
        margin: 0.45rem 0 0;
        color: #dbeafe;
        font-size: 0.86rem;
      }

      .faq { max-width: 760px; }

      .faq-simple {
        display: grid;
        gap: 0.65rem;
        max-width: 820px;
      }

      .faq-simple article,
      .faq-columns article {
        border: 1px solid var(--sf-theme-border);
        border-radius: 12px;
        background: var(--sf-theme-soft-bg);
        padding: 0.8rem 0.9rem;
        box-shadow: var(--sf-theme-shadow);
      }

      .faq-simple h3,
      .faq-columns h3 {
        margin: 0;
        font-size: 0.95rem;
      }

      .faq-simple p,
      .faq-columns p {
        margin: 0.4rem 0 0;
        color: var(--sf-text-muted);
        font-size: 0.86rem;
      }

      .faq-columns {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.65rem;
      }

      .contact-row {
        display: flex;
        flex-wrap: wrap;
        gap: 1.25rem;
        background: var(--sf-theme-soft-bg);
        border: 1px solid var(--sf-theme-border);
        border-radius: 14px;
        padding: 1rem 1.25rem;
        box-shadow: var(--sf-theme-shadow);
      }

      .site-theme-shell[data-theme='premium'] .contact-row {
        background: rgba(15, 23, 42, 0.82);
      }

      .contact-row span {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--sf-text);
        font-size: 0.92rem;
      }

      .contact-row i { color: var(--sf-text-muted); }

      .cta-wrap { max-width: 1180px; padding: 0; }

      .variant-contact-list .contact-row {
        display: grid;
        grid-template-columns: 1fr;
        gap: 0.6rem;
      }

      .variant-cta-split .cta-wrap,
      .variant-cta-image .cta-wrap {
        max-width: 1220px;
      }

      .empty-section {
        border: 1px dashed var(--sf-border-strong);
        background: #fff;
        border-radius: 12px;
        padding: 0.9rem 1rem;
        color: var(--sf-text-muted);
        font-size: 0.88rem;
      }

      .site-theme-shell[data-theme='premium'] .empty-section {
        background: #111827;
        border-color: #475569;
        color: #cbd5e1;
      }

      .site-theme-shell[data-theme='vibrant'] .empty-section {
        border-color: #60a5fa;
        background: #ecfeff;
        color: #075985;
      }

      @media (max-width: 980px) {
        .premium-product-stage,
        .vibrant-product-stage {
          grid-template-columns: 1fr;
        }
        .vibrant-office-layout {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 900px) {
        .site-theme-shell[data-theme='premium'] .grid.products,
        .site-theme-shell[data-theme='premium'] .grid.services,
        .site-theme-shell[data-theme='premium'] .grid.offices,
        .site-theme-shell[data-theme='vibrant'] .grid.products,
        .site-theme-shell[data-theme='vibrant'] .grid.services,
        .site-theme-shell[data-theme='vibrant'] .grid.offices {
          grid-template-columns: 1fr;
        }
        .faq-columns {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class PublicSiteRenderComponent {
  config = input<WebsiteConfig | null>(null);
  companyName = input<string>('');
  subdomain = input<string>('');
  sections = input<PublishedSection[] | null>(null);
  products = input<Product[]>([]);
  offices = input<PublicOffice[]>([]);

  brandColor = computed(() => this.config()?.primaryColor || '#2563eb');

  services = computed<ServiceItem[]>(() => {
    const own = this.config()?.services ?? [];
    return own.length > 0 ? own : DEFAULT_SERVICES;
  });

  faqItems = computed(() => {
    const own = this.config()?.faq ?? [];
    return own.length > 0 ? own : DEFAULT_FAQ;
  });

  visibleSections = computed(() => (this.sections() ?? []).filter((s) => s.visible));

  hasPublishedSections = computed(() => this.visibleSections().length > 0);

  hasContact = computed(() => {
    const c = this.config();
    return !!(c?.contactPhone || c?.contactEmail || c?.address);
  });

  pageTheme = computed<WebsitePageTheme>(() => {
    const hero = (this.sections() ?? []).find((section) => section.type === 'HERO');
    const rawTheme = hero?.data?.['theme'];
    if (rawTheme === 'commercial' || rawTheme === 'premium' || rawTheme === 'vibrant') {
      return rawTheme;
    }
    if (rawTheme === 'comercial') return 'commercial';
    if (rawTheme === 'minimal') return 'premium';
    if (rawTheme === 'vibrante') return 'vibrant';
    return 'commercial';
  });

  /** Shim para que PublicHeroComponent reciba el nombre como company. */
  companyShim = computed(() => ({
    name: this.companyName(),
    subdomain: '',
  }));

  heroConfig(section: PublishedSection): WebsiteConfig {
    const data = (section.data ?? {}) as Record<string, unknown>;
    const current = this.config();
    return {
      id: current?.id ?? 'public',
      companyId: current?.companyId ?? '',
      heroTitle:
        typeof data['title'] === 'string'
          ? data['title']
          : (current?.heroTitle ?? null),
      heroSubtitle:
        typeof data['subtitle'] === 'string'
          ? data['subtitle']
          : (current?.heroSubtitle ?? null),
      primaryColor: current?.primaryColor ?? null,
      logoUrl: current?.logoUrl ?? null,
      banners:
        typeof data['imageUrl'] === 'string'
          ? [{ imageUrl: data['imageUrl'] }]
          : (current?.banners ?? null),
      services: current?.services ?? null,
      faq: current?.faq ?? null,
      contactPhone: current?.contactPhone ?? null,
      contactEmail: current?.contactEmail ?? null,
      address: current?.address ?? null,
      updatedAt: current?.updatedAt ?? new Date().toISOString(),
    };
  }

  servicesFromSection(section: PublishedSection): ServiceItem[] {
    const raw = section.data?.['items'];
    if (!Array.isArray(raw)) return DEFAULT_SERVICES;
    const mapped: ServiceItem[] = [];
    for (const it of raw) {
      if (!it || typeof it !== 'object') continue;
      const row = it as Record<string, unknown>;
      const title = typeof row['title'] === 'string' ? row['title'] : '';
      if (!title.trim()) continue;
      mapped.push({
        title,
        description:
          typeof row['description'] === 'string'
            ? row['description']
            : undefined,
        icon: typeof row['icon'] === 'string' ? row['icon'] : undefined,
      });
    }
    return mapped.length > 0 ? mapped : DEFAULT_SERVICES;
  }

  faqFromSection(section: PublishedSection) {
    const raw = section.data?.['items'];
    if (!Array.isArray(raw)) return DEFAULT_FAQ;
    const mapped = raw
      .map((it) => {
        if (!it || typeof it !== 'object') return null;
        const row = it as Record<string, unknown>;
        const question = typeof row['question'] === 'string' ? row['question'] : '';
        const answer = typeof row['answer'] === 'string' ? row['answer'] : '';
        if (!question.trim() || !answer.trim()) return null;
        return { question, answer };
      })
      .filter((it): it is { question: string; answer: string } => !!it);
    return mapped.length > 0 ? mapped : DEFAULT_FAQ;
  }

  sectionEyebrow(section: PublishedSection): string | null {
    const value = section.data?.['eyebrow'];
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }

  sectionTitle(section: PublishedSection, fallback: string): string {
    const value = section.data?.['title'];
    return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
  }

  sectionVariant(section: PublishedSection, fallback: string): string {
    const value = section.data?.['variant'];
    if (typeof value !== 'string' || value.trim().length === 0) return fallback;
    const legacyMap: Record<string, string> = {
      CLASSIC: 'classic',
      CENTERED: 'centered',
      PROMO: 'promo',
      GRID: 'grid',
      ICON_LIST: 'list',
      HIGHLIGHT_BLOCKS: 'featured',
      SIMPLE_CAROUSEL: 'compact',
      HIGHLIGHT: 'highlight',
      CARDS: 'cards',
      COMPACT_LIST: 'compact',
      MAIN_OFFICE: 'contact',
      ACCORDION: 'accordion',
      SIMPLE_LIST: 'list',
      TWO_COLUMNS: 'twoColumns',
      WITH_IMAGE: 'banner',
      SPLIT: 'split',
      CARD: 'card',
      CHANNEL_LIST: 'channels',
      SIMPLE: 'simple',
      COLUMNS: 'columns',
      COMPACT: 'compact',
    };
    return legacyMap[value] ?? value;
  }

  featuredProductsFromSection(section: PublishedSection): Product[] {
    const limitRaw = section.data?.['limit'];
    const limit =
      typeof limitRaw === 'number' && Number.isFinite(limitRaw)
        ? Math.max(1, Math.min(12, Math.floor(limitRaw)))
        : 6;
    return this.products().slice(0, limit);
  }

  buildProductWaMessage(productName: string): string {
    const message = `Hola, quiero una oferta de ${productName}.`;
    return buildWa(this.config()?.contactPhone, message);
  }
}
