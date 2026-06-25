import { Component, EventEmitter, HostBinding, HostListener, Input, Output } from '@angular/core';
import { FaqAccordionComponent } from '@shared/public/faq-accordion/faq-accordion.component';
import {
  ContactData,
  CtaData,
  FaqData,
  FeaturedProductsData,
  FooterData,
  HeroData,
  NavbarData,
  NavLink,
  OfficesData,
  SECTION_TYPE_LABELS,
  SectionStyle,
  ServicesData,
  TextStyle,
  WebsitePageTheme,
  WebsiteSection,
  WebsiteSectionType,
} from '@core/models/website-builder.model';
import {
  FaqItem,
  ServiceItem,
} from '@core/models/website-config.model';

const RADIUS_MAP: Record<string, string> = {
  none: '0px', sm: '6px', md: '12px', lg: '18px', xl: '24px', full: '999px',
};
const SHADOW_MAP: Record<string, string> = {
  none: 'none',
  sm: '0 2px 8px rgba(15,23,42,0.08)',
  md: '0 8px 24px rgba(15,23,42,0.12)',
  lg: '0 16px 40px rgba(15,23,42,0.16)',
};
const PADDING_MAP: Record<string, string> = {
  none: '0rem', xs: '1.5rem', sm: '2.5rem', md: '4rem', lg: '6rem', xl: '8rem',
};

/**
 * Renderiza UNA sección del editor en el panel central.
 * Soporta click en cualquier elemento con [data-sf-key] para abrir el editor
 * de texto (title/subtitle/eyebrow/body) o de elemento (primary-btn/secondary-btn/card/image).
 */
@Component({
  selector: 'app-section-preview-item',
  standalone: true,
  imports: [
    FaqAccordionComponent,
  ],
  template: `
    @if (section.type === 'NAVBAR') {
      <nav class="block navbar-block" [class]="'navbar-' + navbarVariant()"
           [style.background]="navbarData.navBgColor || null"
           [style.border-color]="navbarData.navBgColor ? 'transparent' : null">
        <div class="navbar-inner">
          <div class="navbar-brand">
            @if (navbarData.showLogo !== false && logoUrl) {
              <img [src]="logoUrl" alt="Logo" class="navbar-logo" />
            } @else {
              <span class="navbar-brand-name" data-sf-key="title"
                    [style.color]="navbarData.navTextColor || null">{{ companyName || 'Tu tienda' }}</span>
            }
          </div>
          @if (navbarVariant() !== 'split') {
            <div class="navbar-links">
              @for (lnk of navbarLinks(); track $index) {
                <a class="navbar-link" [style.color]="navbarData.navTextColor || null">{{ lnk.label }}</a>
              }
            </div>
          }
          <div class="navbar-actions">
            @if (navbarVariant() === 'split') {
              <div class="navbar-links-inline">
                @for (lnk of navbarLinks(); track $index) {
                  <a class="navbar-link" [style.color]="navbarData.navTextColor || null">{{ lnk.label }}</a>
                }
              </div>
            }
            @if (navbarData.ctaLabel) {
              <button type="button" class="btn-primary navbar-cta" data-sf-key="primary-btn" [style]="navbarCtaBtnStyle()">
                {{ navbarData.ctaLabel }}
              </button>
            }
          </div>
        </div>
      </nav>
    } @else if (section.type === 'HERO') {
      @if (heroVariant() === 'classic') {
        <section class="block hero-variant classic"
          [class.img-left]="heroData.imagePosition === 'left'"
          [style.min-height]="heroMinHeight()"
          [style.text-align]="heroData.textAlign || null">
          <div class="hero-classic-text">
            @if (heroData.eyebrow) {
              <span class="eyebrow" data-sf-key="eyebrow">{{ heroData.eyebrow }}</span>
            }
            <h2 data-sf-key="title">{{ heroData.title || 'Celulares con garantía y asesoría real' }}</h2>
            <p class="sub" data-sf-key="subtitle">
              {{ heroData.subtitle || 'Agrega contenido para ver la vista previa.' }}
            </p>
            <div class="cta-actions" [style.justify-content]="heroData.textAlign === 'center' ? 'center' : heroData.textAlign === 'right' ? 'flex-end' : null">
              <button type="button" class="btn-primary" data-sf-key="primary-btn" [style]="pBtnStyle">{{ heroPrimaryLabel() }}</button>
              @if (heroSecondaryLabel()) {
                <button type="button" class="btn-secondary" data-sf-key="secondary-btn" [style]="sBtnStyle">{{ heroSecondaryLabel() }}</button>
              }
            </div>
          </div>
          <div class="hero-classic-img" data-sf-key="image" [style]="iStyle">
            @if (heroData.imageUrl) {
              <img [src]="heroData.imageUrl" alt="Hero" />
            } @else if (logoUrl) {
              <img [src]="logoUrl" alt="Logo" class="hero-logo-fallback" />
            }
          </div>
        </section>
      } @else {
        <section
          class="block hero-variant"
          [class.centered]="heroVariant() === 'centered'"
          [class.promo]="heroVariant() === 'promo'"
          [style.min-height]="heroMinHeight()"
          [style.text-align]="heroData.textAlign || null">
          @if (heroData.eyebrow) {
            <span class="eyebrow" data-sf-key="eyebrow">{{ heroData.eyebrow }}</span>
          }
          <h2 data-sf-key="title">{{ heroData.title || 'Celulares con garantía y asesoría real' }}</h2>
          <p class="sub" data-sf-key="subtitle">
            {{ heroData.subtitle || 'Agrega contenido para ver la vista previa.' }}
          </p>
          <div class="cta-actions" [style.justify-content]="heroData.textAlign === 'center' ? 'center' : heroData.textAlign === 'right' ? 'flex-end' : null">
            <button type="button" class="btn-primary" data-sf-key="primary-btn" [style]="pBtnStyle">{{ heroPrimaryLabel() }}</button>
            @if (heroSecondaryLabel()) {
              <button type="button" class="btn-secondary" data-sf-key="secondary-btn" [style]="sBtnStyle">{{ heroSecondaryLabel() }}</button>
            }
          </div>
        </section>
      }
    } @else if (section.type === 'SERVICES' || section.type === 'BENEFITS') {
      <section
        class="block services-block"
        [class.variant-list]="servicesVariant() === 'list'"
        [class.variant-highlight]="servicesVariant() === 'featured'"
        [class.variant-numbered]="servicesVariant() === 'numbered'"
        [class.variant-horizontal]="servicesVariant() === 'horizontal'"
      >
        @if (servicesData.eyebrow) {
          <span class="eyebrow" data-sf-key="eyebrow">{{ servicesData.eyebrow }}</span>
        }
        @if (servicesData.title) {
          <h2 data-sf-key="title">{{ servicesData.title }}</h2>
        }
        <div class="svc-grid" [style.grid-template-columns]="svcsGridTemplate()">
          @for (s of services(); track $index; let i = $index) {
            <div class="svc-card" [style]="svcCardStyle()" data-sf-key="card"
                 [class.icon-left-layout]="servicesData.cardLayout === 'icon-left'">
              @if (servicesVariant() === 'numbered') {
                <div class="svc-num" [style.color]="servicesData.cardAccentColor || primaryColor">{{ i + 1 }}</div>
              } @else if (s.icon) {
                <div class="svc-icon" [style.color]="servicesData.cardAccentColor || primaryColor"
                     [style.border-top-color]="servicesData.cardAccentColor || primaryColor">
                  <i [class]="'pi ' + s.icon"></i>
                </div>
              }
              <div class="svc-body">
                <div class="svc-title" [style.color]="servicesData.cardTextColor || null">{{ s.title }}</div>
                @if (s.description) {
                  <div class="svc-desc" [style.color]="servicesData.cardTextColor || null">{{ s.description }}</div>
                }
              </div>
            </div>
          }
          @if (services().length === 0) {
            <p class="text-muted" data-sf-key="body">Agrega contenido para mostrar esta sección en tu sitio.</p>
          }
        </div>
      </section>
    } @else if (section.type === 'FAQ') {
      <section
        class="block faq-block"
        [class.variant-simple]="faqVariant() === 'list'"
        [class.variant-columns]="faqVariant() === 'twoColumns'"
      >
        @if (faqData.eyebrow) {
          <span class="eyebrow" data-sf-key="eyebrow">{{ faqData.eyebrow }}</span>
        }
        @if (faqData.title) {
          <h2 data-sf-key="title">{{ faqData.title }}</h2>
        }
        @if (faqVariant() === 'accordion') {
          <div class="faq">
            <app-faq-accordion [items]="faqItems()" />
          </div>
        } @else if (faqVariant() === 'list') {
          <div class="faq-simple">
            @for (item of faqItems(); track $index) {
              <article data-sf-key="card" [style]="cStyle">
                <h3>{{ item.question }}</h3>
                <p>{{ item.answer }}</p>
              </article>
            }
          </div>
        } @else {
          <div class="faq-columns">
            @for (item of faqItems(); track $index) {
              <article data-sf-key="card" [style]="cStyle">
                <h3>{{ item.question }}</h3>
                <p>{{ item.answer }}</p>
              </article>
            }
          </div>
        }
      </section>
    } @else if (section.type === 'FEATURED_PRODUCTS') {
      <section
        class="block featured-block"
        [class.variant-carousel]="featuredVariant() === 'compact'"
        [class.variant-highlight]="featuredVariant() === 'highlight'"
      >
        <span class="eyebrow" data-sf-key="eyebrow">Productos destacados</span>
        <h2 data-sf-key="title">{{ featuredTitle() }}</h2>
        @if (featuredSubtitle()) {
          <p class="sub" data-sf-key="subtitle">{{ featuredSubtitle() }}</p>
        }
        <div class="grid products-grid">
          @for (_ of featuredSkeleton(); track $index) {
            <article class="product-shell" data-sf-key="card" [class.main]="featuredVariant() === 'highlight' && $index === 0" [style]="cStyle">
              <div class="thumb" data-sf-key="image" [style]="iStyle"></div>
              <div class="line strong"></div>
              <div class="line"></div>
            </article>
          }
        </div>
        @if (featuredShowCta()) {
          <div class="cta-row">
            <button type="button" class="ghost-btn" data-sf-key="secondary-btn" [style]="sBtnStyle">{{ featuredCtaLabel() }}</button>
          </div>
        }
        <p class="note" data-sf-key="body">Mensaje si no hay productos: {{ featuredEmptyMessage() }}</p>
      </section>
    } @else if (section.type === 'OFFICES') {
      <section
        class="block offices-block"
        [class.variant-compact]="officesVariant() === 'compact'"
        [class.variant-main]="officesVariant() === 'contact'"
      >
        <span class="eyebrow" data-sf-key="eyebrow">Oficinas</span>
        <h2 data-sf-key="title">{{ officesTitle() }}</h2>
        @if (officesSubtitle()) {
          <p class="sub" data-sf-key="subtitle">{{ officesSubtitle() }}</p>
        }
        <div class="grid offices-grid">
          @for (o of officePreviewCards(); track $index) {
            <article class="office-shell" data-sf-key="card" [class.main]="officesVariant() === 'contact' && $index === 0" [style]="cStyle">
              <h3>{{ o.name }}</h3>
              <p>{{ o.city }}</p>
              @if (officesShowContactData()) {
                <small>{{ o.phone }}</small>
              }
            </article>
          }
        </div>
        <div class="cta-row">
          <button type="button" class="ghost-btn" data-sf-key="secondary-btn" [style]="sBtnStyle">{{ officesCtaLabel() }}</button>
        </div>
        <p class="note" data-sf-key="body">Mensaje si no hay oficinas: {{ officesEmptyMessage() }}</p>
      </section>
    } @else if (section.type === 'CTA') {
      <section
        class="block cta-block"
        [class.light]="ctaStyleVariant() === 'LIGHT'"
        [class.variant-with-image]="ctaVariant() === 'banner'"
        [class.variant-split]="ctaVariant() === 'split'"
      >
        <div class="cta-content">
          <h2 data-sf-key="title">{{ ctaTitle() }}</h2>
          <p data-sf-key="subtitle">{{ ctaDescription() }}</p>
          <div class="cta-actions">
            <button type="button" class="btn-primary" data-sf-key="primary-btn" [style]="pBtnStyle">{{ ctaPrimaryLabel() }}</button>
            @if (ctaSecondaryLabel()) {
              <button type="button" class="btn-secondary" data-sf-key="secondary-btn" [style]="sBtnStyle">{{ ctaSecondaryLabel() }}</button>
            }
          </div>
          <span class="action-chip">Acción principal: {{ ctaPrimaryActionLabel() }}</span>
        </div>
        @if (ctaVariant() === 'banner') {
          <div class="cta-image-shell" data-sf-key="image" [style]="iStyle" aria-hidden="true"></div>
        }
      </section>
    } @else if (section.type === 'CONTACT') {
      <section
        class="block contact-block"
        [class.variant-split]="contactVariant() === 'split'"
        [class.variant-list]="contactVariant() === 'channels'"
      >
        <span class="eyebrow" data-sf-key="eyebrow">Contacto</span>
        <h2 data-sf-key="title">{{ contactTitle() }}</h2>
        @if (contactDescription()) {
          <p class="sub" data-sf-key="subtitle">{{ contactDescription() }}</p>
        }
        <div class="contact-grid">
          <article data-sf-key="card" [style]="cStyle"><strong>WhatsApp</strong><span>{{ contactWhatsapp() }}</span></article>
          <article data-sf-key="card" [style]="cStyle"><strong>Teléfono</strong><span>{{ contactPhone() }}</span></article>
          <article data-sf-key="card" [style]="cStyle"><strong>Email</strong><span>{{ contactEmail() }}</span></article>
          <article data-sf-key="card" [style]="cStyle"><strong>Dirección</strong><span>{{ contactAddress() }}</span></article>
          @if (contactHours()) {
            <article data-sf-key="card" [style]="cStyle"><strong>Horario</strong><span>{{ contactHours() }}</span></article>
          }
        </div>
        <div class="cta-row">
          <button type="button" class="ghost-btn wa" data-sf-key="primary-btn" [style]="pBtnStyle">{{ contactWhatsappButtonLabel() }}</button>
        </div>
      </section>
    } @else if (section.type === 'FOOTER') {
      <section
        class="block footer-shell"
        [class.variant-columns]="footerVariant() === 'columns'"
        [class.variant-compact]="footerVariant() === 'compact'"
      >
        <div class="footer-brand">
          @if (logoUrl) {
            <img [src]="logoUrl" alt="Logo" class="footer-logo" />
          }
          <h3 data-sf-key="title">{{ companyName || 'Tu tienda' }}</h3>
          <p data-sf-key="body">{{ footerDescription() }}</p>
        </div>
        <div class="footer-links">
          <span>Inicio</span>
          <span>Catálogo</span>
          <span>Cotizar</span>
        </div>
        <div class="footer-contact">
          @if (footerWhatsapp()) {
            <span><i class="pi pi-whatsapp"></i> {{ footerWhatsapp() }}</span>
          }
          @if (footerEmail()) {
            <span><i class="pi pi-envelope"></i> {{ footerEmail() }}</span>
          }
        </div>
        <div class="footer-bottom">
          <small>{{ footerCopyright() }}</small>
          @if (footerShowPowered()) {
            <small>Powered by SalesFlow</small>
          }
        </div>
      </section>
    } @else {
      <section class="block placeholder">
        <span class="eyebrow" data-sf-key="eyebrow">{{ typeLabel() }}</span>
        <h2 data-sf-key="title">{{ placeholderTitle() }}</h2>
        <p class="text-muted" data-sf-key="body">
          Esta sección se mostrará al publicar. Puedes dejarla lista desde el panel de propiedades.
        </p>
      </section>
    }
  `,
  styles: [
    `
      :host { display: block; }
      .block {
        max-width: 1100px;
        margin: 0 auto;
        padding: var(--py, 2rem) 1.25rem;
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
        font-size: 1.5rem;
        letter-spacing: -0.02em;
        margin: 0 0 1rem;
      }
      .sub {
        margin: -0.45rem 0 1rem;
        color: var(--sf-text-muted);
        max-width: 62ch;
      }

      /* ── Navbar ───────────────────────────────────────── */
      .navbar-block {
        padding: 0;
        border-bottom: 1px solid var(--sf-border);
        background: #fff;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .navbar-inner {
        max-width: 1100px;
        margin: 0 auto;
        padding: 0.6rem 1.25rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }
      .navbar-brand { flex-shrink: 0; }
      .navbar-logo { height: 32px; max-width: 120px; object-fit: contain; display: block; }
      .navbar-brand-name { font-weight: 700; font-size: 1rem; color: var(--sf-text); }
      .navbar-links { display: flex; align-items: center; gap: 0.1rem; flex: 1; }
      .navbar-links-inline { display: flex; align-items: center; gap: 0.1rem; }
      .navbar-link {
        padding: 0.4rem 0.65rem;
        border-radius: 8px;
        font-size: 0.85rem;
        font-weight: 500;
        color: var(--sf-text);
        cursor: default;
        white-space: nowrap;
        transition: background 0.12s;
      }
      .navbar-link:hover { background: var(--sf-surface-2); }
      .navbar-actions { display: flex; align-items: center; gap: 0.75rem; margin-left: auto; }
      .navbar-cta { font-size: 0.82rem; padding: 0.4rem 1rem; }

      /* Variante centrada: links en el centro */
      .navbar-centered .navbar-inner { justify-content: space-between; }
      .navbar-centered .navbar-links { justify-content: center; }

      /* Variante split: logo | links | CTA separados */
      .navbar-split .navbar-inner { justify-content: space-between; }
      .navbar-split .navbar-actions { gap: 0.4rem; }

      /* ── Hero ─────────────────────────────────────────── */
      .hero-variant {
        border: 1px solid var(--sf-border);
        border-radius: 16px;
        background: linear-gradient(145deg, #f8fafc, #eef2ff);
        padding: 1.4rem;
      }
      .hero-variant.centered { text-align: center; }
      .hero-variant.promo {
        background: linear-gradient(135deg, #0f172a, #1e3a8a);
        color: #fff;
      }
      .hero-variant.promo .sub { color: rgba(255, 255, 255, 0.86); }
      .hero-variant.classic {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        align-items: center;
      }
      /* Imagen a la izquierda: invierte el orden */
      .hero-variant.classic.img-left { direction: rtl; }
      .hero-variant.classic.img-left > * { direction: ltr; }
      .hero-classic-text {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      .hero-classic-img {
        border-radius: 14px;
        aspect-ratio: 4/3;
        background: linear-gradient(145deg, #eef2ff, #dbeafe);
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .hero-classic-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      /* ── Botones ──────────────────────────────────────── */
      .cta-actions {
        margin-top: 1rem;
        display: flex;
        gap: 0.55rem;
        flex-wrap: wrap;
      }
      .btn-primary,
      .btn-secondary,
      .ghost-btn {
        border: 1px solid transparent;
        padding: 0.5rem 0.95rem;
        font-weight: 700;
        cursor: pointer;
        border-radius: 10px;
        transition: filter 0.12s;
      }
      .btn-primary {
        background: #16a34a;
        color: #fff;
      }
      .btn-secondary {
        background: transparent;
        color: currentColor;
        border-color: currentColor;
        border-style: solid;
        border-width: 1px;
      }
      .ghost-btn {
        background: transparent;
        color: var(--sf-primary);
        border: 1px solid var(--sf-primary);
        padding: 0.5rem 0.9rem;
      }

      /* ── Grid general ─────────────────────────────────── */
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 1rem;
      }

      /* ── Service cards ────────────────────────────────── */
      .svc-grid {
        display: grid;
        gap: 1rem;
        margin-top: 0.5rem;
      }
      .svc-card {
        border: 1px solid var(--sf-border);
        border-radius: 12px;
        padding: 1rem;
        background: #fff;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        transition: box-shadow 0.15s;
      }
      .svc-card.icon-left-layout {
        flex-direction: row;
        align-items: flex-start;
        gap: 0.75rem;
      }
      .svc-icon {
        font-size: 1.4rem;
        color: var(--sf-primary);
        flex-shrink: 0;
        line-height: 1;
        padding-bottom: 0.25rem;
        border-top: 3px solid currentColor;
        padding-top: 0.4rem;
      }
      .svc-card.icon-left-layout .svc-icon {
        border-top: none;
        font-size: 1.25rem;
        margin-top: 0.1rem;
      }
      .svc-num {
        font-size: 1.6rem;
        font-weight: 900;
        line-height: 1;
        color: var(--sf-primary);
        margin-bottom: 0.25rem;
      }
      .svc-body { flex: 1; }
      .svc-title { font-size: 0.92rem; font-weight: 700; color: var(--sf-text); margin-bottom: 0.2rem; }
      .svc-desc  { font-size: 0.82rem; color: var(--sf-text-muted); line-height: 1.5; }

      /* variante list: 1 columna, cards como fila horizontal */
      .services-block.variant-list .svc-grid { gap: 0; }
      .services-block.variant-list .svc-card {
        border-radius: 0;
        border-bottom: 1px solid var(--sf-border);
        border-left: none; border-right: none; border-top: none;
        flex-direction: row; align-items: center; gap: 0.85rem;
        padding: 0.75rem 0;
        background: transparent;
      }
      .services-block.variant-list .svc-grid { margin-top: 0.75rem; }

      /* variante highlight: sombra en las cards */
      .services-block.variant-highlight .svc-card {
        box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
        border-radius: 16px;
      }

      /* variante numbered: número grande a la izquierda */
      .services-block.variant-numbered .svc-card {
        flex-direction: row; align-items: flex-start; gap: 0.85rem;
      }
      .services-block.variant-numbered .svc-num { font-size: 2rem; min-width: 2.2rem; }

      /* variante horizontal: filas (1 col, card ancha) */
      .services-block.variant-horizontal .svc-card {
        flex-direction: row; align-items: flex-start; gap: 1rem;
        border-left: 4px solid var(--sf-primary);
        border-radius: 10px;
      }

      /* ── Products ─────────────────────────────────────── */
      .products-grid { margin-top: 0.6rem; }
      .featured-block.variant-carousel .products-grid {
        display: flex;
        overflow-x: auto;
        padding-bottom: 0.4rem;
      }
      .featured-block.variant-carousel .product-shell { min-width: 220px; }
      .featured-block.variant-highlight .products-grid {
        grid-template-columns: 1.35fr 1fr 1fr;
      }
      .featured-block.variant-highlight .product-shell.main .thumb { height: 190px; }
      .product-shell {
        border: 1px solid var(--sf-border);
        border-radius: 12px;
        padding: 0.75rem;
        background: #fff;
      }
      .thumb {
        height: 130px;
        border-radius: 10px;
        background: linear-gradient(145deg, #eef2ff, #dbeafe);
      }
      .line {
        height: 0.55rem;
        border-radius: 999px;
        margin-top: 0.55rem;
        background: #e5e7eb;
      }
      .line.strong { width: 75%; background: #d1d5db; }

      /* ── Offices ──────────────────────────────────────── */
      .offices-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      }
      .offices-block.variant-compact .offices-grid { grid-template-columns: 1fr; }
      .offices-block.variant-main .offices-grid { grid-template-columns: 1.4fr 1fr; }
      .offices-block.variant-main .office-shell.main { min-height: 130px; }
      .office-shell {
        border: 1px solid var(--sf-border);
        border-radius: 12px;
        padding: 0.85rem;
        background: #fff;
      }
      .office-shell h3 { margin: 0; font-size: 0.92rem; }
      .office-shell p { margin: 0.25rem 0; color: var(--sf-text-muted); font-size: 0.82rem; }
      .office-shell small { color: var(--sf-text); font-weight: 600; }
      .cta-row { margin-top: 0.8rem; }
      .note { margin: 0.6rem 0 0; font-size: 0.78rem; color: var(--sf-text-muted); }

      /* ── CTA ──────────────────────────────────────────── */
      .cta-block {
        border-radius: 16px;
        background: linear-gradient(145deg, #0f172a, #1e293b);
        padding: 1.4rem;
        color: #fff;
        display: grid;
        grid-template-columns: 1fr;
        gap: 1rem;
      }
      .cta-block.variant-with-image,
      .cta-block.variant-split { grid-template-columns: 1fr 0.8fr; align-items: center; }
      .cta-block.light {
        background: linear-gradient(145deg, #f8fafc, #e2e8f0);
        color: var(--sf-text);
      }
      .cta-image-shell {
        min-height: 160px;
        border-radius: 12px;
        background: linear-gradient(145deg, #dbeafe, #bfdbfe);
        border: 1px solid rgba(37, 99, 235, 0.2);
      }
      .cta-block h2 { margin-bottom: 0.45rem; }
      .cta-block p { margin: 0; color: inherit; opacity: 0.9; }
      .action-chip {
        margin-top: 0.8rem;
        display: inline-flex;
        padding: 0.22rem 0.5rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.15);
        font-size: 0.73rem;
        font-weight: 700;
      }

      /* ── Contact ──────────────────────────────────────── */
      .contact-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 0.65rem;
      }
      .contact-block.variant-split .contact-grid { grid-template-columns: 1fr 1fr; }
      .contact-block.variant-list .contact-grid { grid-template-columns: 1fr; }
      .contact-grid article {
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        padding: 0.7rem;
        background: #fff;
        display: grid;
        gap: 0.2rem;
      }
      .contact-grid article strong {
        font-size: 0.74rem;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--sf-text-muted);
      }
      .contact-grid article span { font-size: 0.85rem; color: var(--sf-text); }
      .wa { border-color: #22c55e !important; color: #166534 !important; }

      /* ── Logo ────────────────────────────────────────── */
      .hero-logo-fallback {
        max-width: 70%;
        max-height: 80%;
        object-fit: contain;
        padding: 0.75rem;
      }
      .footer-logo {
        display: block;
        height: 36px;
        max-width: 140px;
        object-fit: contain;
        margin-bottom: 0.45rem;
        filter: brightness(0) invert(1);
        opacity: 0.9;
      }

      /* ── Footer ───────────────────────────────────────── */
      .footer-shell {
        border-radius: 14px;
        background: linear-gradient(165deg, #0f172a, #111c30);
        color: #cbd5e1;
        padding: 1.1rem;
      }
      .footer-shell h3 { margin: 0; color: #fff; }
      .footer-shell p { margin: 0.35rem 0 0; font-size: 0.84rem; color: #94a3b8; }
      .footer-links,
      .footer-contact { display: flex; gap: 0.7rem; flex-wrap: wrap; margin-top: 0.85rem; font-size: 0.82rem; }
      .footer-shell.variant-columns {
        display: grid;
        grid-template-columns: 1.4fr 1fr 1fr;
        gap: 0.9rem;
        align-items: start;
      }
      .footer-shell.variant-compact .footer-links,
      .footer-shell.variant-compact .footer-contact { margin-top: 0.5rem; font-size: 0.77rem; }
      .footer-contact span { display: inline-flex; align-items: center; gap: 0.3rem; }
      .footer-bottom {
        margin-top: 0.95rem;
        padding-top: 0.75rem;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: space-between;
        gap: 0.65rem;
        flex-wrap: wrap;
      }

      /* ── FAQ ──────────────────────────────────────────── */
      .faq { max-width: 760px; }
      .faq-simple { display: grid; gap: 0.6rem; }
      .faq-simple article,
      .faq-columns article {
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        padding: 0.8rem;
        background: #fff;
      }
      .faq-simple h3,
      .faq-columns h3 { margin: 0; font-size: 0.9rem; }
      .faq-simple p,
      .faq-columns p { margin: 0.35rem 0 0; color: var(--sf-text-muted); font-size: 0.84rem; }
      .faq-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }

      /* ── Placeholder ──────────────────────────────────── */
      .placeholder {
        background: var(--sf-surface-2);
        border: 1px dashed var(--sf-border-strong);
        border-radius: 14px;
        padding: 1.25rem;
        text-align: center;
        margin-bottom: 1.5rem;
      }

      /* ── Estilos de texto por elemento (via CSS vars) ─── */
      [data-sf-key='title'] {
        color: var(--tl-c, currentColor);
        font-family: var(--tl-ff, inherit);
        font-size: var(--tl-fs, inherit);
        font-weight: var(--tl-fw, inherit);
        font-style: var(--tl-fst, inherit);
        text-align: var(--tl-ta, inherit);
        text-transform: var(--tl-tt, inherit);
        letter-spacing: var(--tl-ls, inherit);
        line-height: var(--tl-lh, inherit);
      }
      [data-sf-key='subtitle'] {
        color: var(--st-c, var(--sf-text-muted));
        font-family: var(--st-ff, inherit);
        font-size: var(--st-fs, inherit);
        font-weight: var(--st-fw, inherit);
        font-style: var(--st-fst, inherit);
        text-align: var(--st-ta, inherit);
        text-transform: var(--st-tt, inherit);
        letter-spacing: var(--st-ls, inherit);
        line-height: var(--st-lh, inherit);
      }
      [data-sf-key='eyebrow'] {
        color: var(--ew-c, var(--sf-primary));
        font-family: var(--ew-ff, inherit);
        font-size: var(--ew-fs, inherit);
        font-weight: var(--ew-fw, inherit);
        font-style: var(--ew-fst, inherit);
        text-align: var(--ew-ta, inherit);
        text-transform: var(--ew-tt, inherit);
        letter-spacing: var(--ew-ls, inherit);
        line-height: var(--ew-lh, inherit);
      }
      [data-sf-key='body'] {
        color: var(--bd-c, currentColor);
        font-family: var(--bd-ff, inherit);
        font-size: var(--bd-fs, inherit);
        font-weight: var(--bd-fw, inherit);
        font-style: var(--bd-fst, inherit);
        text-align: var(--bd-ta, inherit);
        text-transform: var(--bd-tt, inherit);
        letter-spacing: var(--bd-ls, inherit);
        line-height: var(--bd-lh, inherit);
      }

      /* ── Cursor clickable + indicador de selección activa */
      [data-sf-key] {
        cursor: pointer;
        border-radius: 3px;
        transition: outline-color 0.1s;
        outline: 2px solid transparent;
        outline-offset: 2px;
      }
      [data-sf-key]:hover { outline-color: rgba(59, 130, 246, 0.4); }

      :host([data-active-text='title'])         [data-sf-key='title'],
      :host([data-active-text='subtitle'])       [data-sf-key='subtitle'],
      :host([data-active-text='eyebrow'])        [data-sf-key='eyebrow'],
      :host([data-active-text='body'])           [data-sf-key='body'],
      :host([data-active-text='primary-btn'])    [data-sf-key='primary-btn'],
      :host([data-active-text='secondary-btn'])  [data-sf-key='secondary-btn'],
      :host([data-active-text='card'])           [data-sf-key='card'],
      :host([data-active-text='image'])          [data-sf-key='image'] {
        outline-color: #3b82f6;
        background: rgba(59, 130, 246, 0.06);
      }

      /* ══════════════════════════════════════════════════
         TEMA: PREMIUM ELEGANTE
         Estética tipo revista de lujo / Apple.
         ─ Navbar oscuro, alto, dorado
         ─ Hero: centrado, texto grande, imagen full-width abajo
         ─ Productos: 2 columnas, tarjetas altas
         ─ Servicios: lista horizontal con número a la izquierda
         ─ Tipografía: serif, grande, espaciado amplio
         ─ Secciones: más padding, separadas por líneas finas
         ══════════════════════════════════════════════════ */

      /* Navbar */
      :host-context(.preview-theme-shell[data-theme='premium']) .navbar-block {
        background: #0b1120;
        border-bottom: 1px solid #1e293b;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .navbar-inner {
        padding: 1rem 2rem;
        gap: 2rem;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .navbar-brand-name { color: #f8fafc; font-size: 1.1rem; letter-spacing: 0.04em; }
      :host-context(.preview-theme-shell[data-theme='premium']) .navbar-link { color: #94a3b8; font-size: 0.8rem; letter-spacing: 0.06em; text-transform: uppercase; }
      :host-context(.preview-theme-shell[data-theme='premium']) .navbar-link:hover { background: rgba(255,255,255,0.06); color: #f8fafc; }
      :host-context(.preview-theme-shell[data-theme='premium']) .navbar-cta {
        background: #c9a84c; color: #0b1120; border-color: transparent;
        border-radius: 2px; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase;
      }

      /* Tipografía global */
      :host-context(.preview-theme-shell[data-theme='premium']) .block {
        max-width: 860px;
        padding: 3rem 2rem;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) h2 {
        font-size: 2.1rem;
        font-weight: 300;
        letter-spacing: -0.03em;
        line-height: 1.15;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .eyebrow {
        color: #c9a84c;
        letter-spacing: 0.2em;
        font-size: 0.62rem;
        font-weight: 600;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .sub { font-size: 0.95rem; line-height: 1.7; }

      /* Hero: single-column centrado, imagen abajo full-width */
      :host-context(.preview-theme-shell[data-theme='premium']) .hero-variant {
        background: linear-gradient(160deg, #0d1526 0%, #131e35 100%);
        color: #f1f5f9; border: none; border-radius: 0; padding: 3rem 2rem 0;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .hero-variant.classic {
        display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .hero-classic-text { align-items: center; max-width: 640px; }
      :host-context(.preview-theme-shell[data-theme='premium']) .hero-classic-img {
        width: 100%; aspect-ratio: 16/5; max-height: 200px; margin-top: 2rem;
        border-radius: 12px 12px 0 0; border: none;
        background: linear-gradient(90deg, #1e2d4a, #172037);
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .hero-variant .sub { color: #64748b; }
      :host-context(.preview-theme-shell[data-theme='premium']) .cta-actions { justify-content: center; }

      /* Botones */
      :host-context(.preview-theme-shell[data-theme='premium']) .btn-primary {
        background: #c9a84c; color: #0b1120; border-radius: 2px;
        font-size: 0.78rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
        padding: 0.6rem 1.4rem;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .btn-secondary { border-radius: 2px; font-size: 0.78rem; letter-spacing: 0.06em; }
      :host-context(.preview-theme-shell[data-theme='premium']) .ghost-btn { border-color: #c9a84c; color: #c9a84c; border-radius: 2px; }

      /* Productos: 2 columnas, tarjetas altas */
      :host-context(.preview-theme-shell[data-theme='premium']) .products-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 1.25rem;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .product-shell {
        border-radius: 4px; border-color: #1e293b; background: #111827; color: #f1f5f9;
        padding: 1rem;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .thumb {
        height: 180px; border-radius: 2px; background: linear-gradient(145deg, #1a2744, #0f172a);
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .line { background: #1e293b; }
      :host-context(.preview-theme-shell[data-theme='premium']) .line.strong { background: #334155; }

      /* Servicios: lista vertical con línea divisoria */
      :host-context(.preview-theme-shell[data-theme='premium']) .services-block .svc-grid {
        grid-template-columns: 1fr;
        gap: 0;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .services-block .svc-card {
        border: none;
        border-bottom: 1px solid #1e293b;
        border-radius: 0;
        background: transparent;
        color: #f1f5f9;
        padding: 1rem 0;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .services-block .svc-title { color: #f1f5f9; }
      :host-context(.preview-theme-shell[data-theme='premium']) .services-block .svc-desc { color: #64748b; }
      :host-context(.preview-theme-shell[data-theme='premium']) .services-block .svc-icon { color: #c9a84c; border-top-color: #c9a84c; }

      /* Oficinas: tarjeta horizontal */
      :host-context(.preview-theme-shell[data-theme='premium']) .offices-grid {
        grid-template-columns: 1fr;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .office-shell {
        border-radius: 4px; border-color: #1e293b; background: #111827; color: #f1f5f9;
        display: flex; align-items: center; gap: 1.5rem; padding: 1.25rem 1.5rem;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .office-shell h3 { font-size: 1rem; font-weight: 400; letter-spacing: 0.03em; }
      :host-context(.preview-theme-shell[data-theme='premium']) .office-shell p { color: #64748b; margin: 0; }

      /* Contacto: 2 columnas */
      :host-context(.preview-theme-shell[data-theme='premium']) .contact-grid {
        grid-template-columns: 1fr 1fr;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .contact-grid article {
        border-radius: 4px; border-color: #1e293b; background: #111827;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .contact-grid article strong { color: #475569; }
      :host-context(.preview-theme-shell[data-theme='premium']) .contact-grid article span { color: #e2e8f0; }

      /* FAQ */
      :host-context(.preview-theme-shell[data-theme='premium']) .faq-simple article,
      :host-context(.preview-theme-shell[data-theme='premium']) .faq-columns article {
        background: #111827; border-color: #1e293b; border-radius: 4px; padding: 1.1rem 1.25rem;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .faq-simple h3,
      :host-context(.preview-theme-shell[data-theme='premium']) .faq-columns h3 { color: #f1f5f9; font-weight: 400; font-size: 1rem; }
      :host-context(.preview-theme-shell[data-theme='premium']) .faq-simple p,
      :host-context(.preview-theme-shell[data-theme='premium']) .faq-columns p { color: #64748b; }

      /* Footer columnas */
      :host-context(.preview-theme-shell[data-theme='premium']) .footer-shell {
        background: linear-gradient(165deg, #020617, #0b1120);
        border-radius: 0;
      }
      :host-context(.preview-theme-shell[data-theme='premium']) .footer-shell h3 { font-weight: 300; letter-spacing: 0.05em; }


      /* ══════════════════════════════════════════════════
         TEMA: PROMOCIONAL VIBRANTE
         Alta energía tipo e-commerce.
         ─ Navbar degradado morado, pill CTA
         ─ Hero: texto enorme, imagen inclinada con sombra
         ─ Productos: 4 columnas, compactas
         ─ Servicios: 2 columnas con top-border de acento
         ─ Eyebrow: badge/pill con fondo amarillo
         ─ Botones: gradiente pill con sombra
         ─ Secciones: tarjetas flotantes con sombra grande
         ══════════════════════════════════════════════════ */

      /* Navbar */
      :host-context(.preview-theme-shell[data-theme='vibrant']) .navbar-block {
        background: linear-gradient(90deg, #1d4ed8 0%, #6d28d9 100%);
        border-bottom: none;
        box-shadow: 0 4px 20px rgba(99, 102, 241, 0.35);
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .navbar-inner { padding: 0.5rem 1rem; gap: 1rem; }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .navbar-brand-name {
        color: #fff; font-weight: 900; font-size: 1.05rem; letter-spacing: -0.01em;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .navbar-link { color: rgba(255,255,255,0.85); font-size: 0.82rem; font-weight: 600; }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .navbar-link:hover { background: rgba(255,255,255,0.15); color: #fff; }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .navbar-cta {
        background: #fff; color: #4f46e5; border-color: transparent;
        border-radius: 999px; font-weight: 800; font-size: 0.8rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      }

      /* Tipografía */
      :host-context(.preview-theme-shell[data-theme='vibrant']) .block { padding: 1.5rem 1rem; }
      :host-context(.preview-theme-shell[data-theme='vibrant']) h2 {
        font-size: 1.75rem; font-weight: 900; line-height: 1.1; letter-spacing: -0.02em;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .eyebrow {
        color: #92400e;
        background: #fef3c7;
        border: 1px solid #fcd34d;
        border-radius: 999px;
        padding: 0.1rem 0.65rem;
        font-size: 0.66rem;
        font-weight: 800;
        letter-spacing: 0.08em;
      }

      /* Hero: texto gigante, imagen con sombra e inclinación */
      :host-context(.preview-theme-shell[data-theme='vibrant']) .hero-variant {
        background: linear-gradient(135deg, #eef2ff 0%, #ede9fe 50%, #fae8ff 100%);
        border: none;
        border-radius: 20px;
        padding: 2rem 1.5rem;
        overflow: hidden;
        position: relative;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .hero-variant.classic {
        gap: 1rem; align-items: center;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .hero-classic-img {
        background: linear-gradient(135deg, #c7d2fe, #ddd6fe, #f5d0fe);
        border-radius: 16px;
        box-shadow: 0 24px 50px rgba(99, 102, 241, 0.35);
        transform: rotate(2deg);
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .hero-variant.promo {
        background: linear-gradient(135deg, #2563eb 0%, #7c3aed 55%, #be185d 100%);
        color: #fff;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .hero-variant.promo .sub { color: rgba(255,255,255,0.8); }

      /* Botones */
      :host-context(.preview-theme-shell[data-theme='vibrant']) .btn-primary {
        background: linear-gradient(135deg, #4f46e5, #7c3aed);
        border-color: transparent; border-radius: 999px;
        font-weight: 900; font-size: 0.85rem;
        box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        padding: 0.55rem 1.25rem;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .btn-secondary { border-radius: 999px; font-weight: 700; }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .ghost-btn {
        background: transparent; border-color: #818cf8; color: #4338ca;
        border-radius: 999px; font-weight: 700;
      }

      /* Productos: 4 columnas compactas */
      :host-context(.preview-theme-shell[data-theme='vibrant']) .products-grid {
        grid-template-columns: repeat(4, 1fr);
        gap: 0.65rem;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .product-shell {
        border-color: #c4b5fd; border-radius: 16px;
        box-shadow: 0 4px 16px rgba(99, 102, 241, 0.14);
        padding: 0.6rem;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .thumb {
        height: 90px; border-radius: 10px;
        background: linear-gradient(135deg, #e0e7ff, #ede9fe);
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .line { height: 0.45rem; }

      /* Servicios: 2 columnas con acento superior */
      :host-context(.preview-theme-shell[data-theme='vibrant']) .services-block .svc-grid {
        grid-template-columns: 1fr 1fr;
        gap: 0.8rem;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .services-block .svc-card {
        border-top: 3px solid #818cf8 !important;
        border-radius: 14px;
        background: rgba(255,255,255,0.8);
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .services-block .svc-icon { color: #4f46e5; border-top-color: #4f46e5; }

      /* Oficinas: 3 columnas compactas */
      :host-context(.preview-theme-shell[data-theme='vibrant']) .offices-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .office-shell {
        border-radius: 16px; border-color: #c4b5fd;
        background: linear-gradient(145deg, #f5f3ff, #ede9fe);
        text-align: center; padding: 1rem 0.75rem;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .office-shell h3 { font-size: 0.85rem; font-weight: 700; color: #3730a3; }

      /* Contacto: lista con borde izquierdo */
      :host-context(.preview-theme-shell[data-theme='vibrant']) .contact-grid {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .contact-grid article {
        border-radius: 12px; border-color: #c4b5fd;
        border-left: 4px solid #818cf8;
        background: linear-gradient(135deg, #fafaff, #f5f3ff);
        display: flex; align-items: center; gap: 1rem;
        padding: 0.6rem 0.85rem;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .contact-grid article strong {
        color: #4f46e5; font-size: 0.72rem;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .contact-grid article span { color: #1e1b4b; }

      /* FAQ */
      :host-context(.preview-theme-shell[data-theme='vibrant']) .faq-simple article,
      :host-context(.preview-theme-shell[data-theme='vibrant']) .faq-columns article {
        border-radius: 14px; border-color: #c4b5fd;
        background: linear-gradient(145deg, #fafaff, #f5f3ff);
        border-left: 4px solid #818cf8;
      }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .faq-simple h3,
      :host-context(.preview-theme-shell[data-theme='vibrant']) .faq-columns h3 { color: #3730a3; font-weight: 700; }
      :host-context(.preview-theme-shell[data-theme='vibrant']) .faq-simple p,
      :host-context(.preview-theme-shell[data-theme='vibrant']) .faq-columns p { color: #4338ca; }

      /* Secciones flotantes */
      :host-context(.preview-theme-shell[data-theme='vibrant']) .featured-block,
      :host-context(.preview-theme-shell[data-theme='vibrant']) .services-block,
      :host-context(.preview-theme-shell[data-theme='vibrant']) .offices-block,
      :host-context(.preview-theme-shell[data-theme='vibrant']) .faq-block {
        background: rgba(255,255,255,0.7);
        border-radius: 20px;
        box-shadow: 0 8px 30px rgba(99,102,241,0.08);
        border: 1px solid #e0e7ff;
      }

      /* Footer índigo */
      :host-context(.preview-theme-shell[data-theme='vibrant']) .footer-shell {
        background: linear-gradient(165deg, #1e1b4b, #312e81);
        border-radius: 0;
      }
    `,
  ],
})
export class SectionPreviewItemComponent {
  @Input({ required: true }) section!: WebsiteSection;
  @Input() theme: WebsitePageTheme | string | null = null;
  @Input() primaryColor = '#2563eb';
  @Input() logoUrl = '';
  @Input() companyName = '';
  @Input() activeTextKey: string | null = null;
  @Output() textSelect = new EventEmitter<string>();

  @HostBinding('attr.data-active-text')
  get hostActiveText(): string | null { return this.activeTextKey; }

  @HostBinding('style')
  get hostStyles(): Record<string, string | null> {
    const s = this.sectionStyleData;
    const tl: TextStyle = s?.title    ?? {};
    const st: TextStyle = s?.subtitle ?? {};
    const ew: TextStyle = s?.eyebrow  ?? {};
    const bd: TextStyle = s?.body     ?? {};
    const n = (v?: string): string | null => v || null;
    return {
      'background-color': n(s?.bgColor),
      'font-family': this.resolvedSectionFont(s?.fontFamily),
      '--py': s?.paddingY ? (PADDING_MAP[s.paddingY] ?? null) : null,
      // Vars de texto (cascade normal a [data-sf-key='title/subtitle/eyebrow/body'])
      '--tl-c': n(tl.color),   '--tl-ff': n(tl.fontFamily), '--tl-fs': n(tl.fontSize),
      '--tl-fw': n(tl.fontWeight), '--tl-fst': n(tl.fontStyle), '--tl-ta': n(tl.textAlign),
      '--tl-tt': n(tl.textTransform), '--tl-ls': n(tl.letterSpacing), '--tl-lh': n(tl.lineHeight),
      '--st-c': n(st.color),   '--st-ff': n(st.fontFamily), '--st-fs': n(st.fontSize),
      '--st-fw': n(st.fontWeight), '--st-fst': n(st.fontStyle), '--st-ta': n(st.textAlign),
      '--st-tt': n(st.textTransform), '--st-ls': n(st.letterSpacing), '--st-lh': n(st.lineHeight),
      '--ew-c': n(ew.color),   '--ew-ff': n(ew.fontFamily), '--ew-fs': n(ew.fontSize),
      '--ew-fw': n(ew.fontWeight), '--ew-fst': n(ew.fontStyle), '--ew-ta': n(ew.textAlign),
      '--ew-tt': n(ew.textTransform), '--ew-ls': n(ew.letterSpacing), '--ew-lh': n(ew.lineHeight),
      '--bd-c': n(bd.color),   '--bd-ff': n(bd.fontFamily), '--bd-fs': n(bd.fontSize),
      '--bd-fw': n(bd.fontWeight), '--bd-fst': n(bd.fontStyle), '--bd-ta': n(bd.textAlign),
      '--bd-tt': n(bd.textTransform), '--bd-ls': n(bd.letterSpacing), '--bd-lh': n(bd.lineHeight),
    };
  }

  // Estilos directos para botones, cards e imágenes (más fiable que CSS vars en elementos anidados)
  get pBtnStyle(): Record<string, string | null> { return this.buildBtnStyle(this.sectionStyleData?.primaryBtn); }
  get sBtnStyle(): Record<string, string | null> { return this.buildBtnStyle(this.sectionStyleData?.secondaryBtn); }
  get cStyle():    Record<string, string | null> {
    const c = this.sectionStyleData?.card;
    if (!c) return {};
    return {
      background:    c.bgColor     || null,
      color:         c.textColor   || null,
      'border-color':   c.borderColor || null,
      'border-radius':  c.borderRadius ? (RADIUS_MAP[c.borderRadius] ?? null) : null,
      'box-shadow':     c.shadow ? (SHADOW_MAP[c.shadow] ?? null) : null,
    };
  }
  get iStyle(): Record<string, string | null> {
    const i = this.sectionStyleData?.image;
    if (!i) return {};
    return {
      'border-radius': i.borderRadius ? (RADIUS_MAP[i.borderRadius] ?? null) : null,
      'aspect-ratio':  i.aspectRatio  || null,
    };
  }

  private buildBtnStyle(b?: { bgColor?: string; textColor?: string; borderColor?: string; borderRadius?: string }): Record<string, string | null> {
    if (!b) return {};
    return {
      background:      b.bgColor      || null,
      color:           b.textColor    || null,
      'border-color':  b.borderColor  || null,
      'border-radius': b.borderRadius ? (RADIUS_MAP[b.borderRadius] ?? null) : null,
    };
  }

  @HostListener('click', ['$event'])
  onPreviewClick(event: MouseEvent): void {
    const target = event.target as Element | null;
    if (!target) return;
    const el = target.closest('[data-sf-key]');
    if (!el) return;
    const key = el.getAttribute('data-sf-key');
    if (key) {
      event.stopPropagation();
      this.textSelect.emit(key);
    }
  }

  private get sectionStyleData(): SectionStyle | null {
    const raw = this.section?.data as { style?: SectionStyle } | null;
    return raw?.style ?? null;
  }

  private resolvedSectionFont(ff: SectionStyle['fontFamily'] | undefined): string | null {
    if (ff === 'sans')    return "'Helvetica Neue', Arial, sans-serif";
    if (ff === 'serif')   return "Georgia, 'Times New Roman', serif";
    if (ff === 'display') return "Palatino, 'Book Antiqua', serif";
    return null;
  }

  // ── Navbar color helpers ──────────────────────────────────────────────────
  navbarCtaBtnStyle(): Record<string, string | null> {
    const d = this.navbarData;
    const radius = d.ctaBorderRadius ? (RADIUS_MAP[d.ctaBorderRadius] ?? null) : null;
    if (d.ctaStyle === 'outline') {
      return {
        background: 'transparent',
        color: d.ctaBgColor || d.ctaTextColor || null,
        'border-color': d.ctaBgColor || null,
        'border-style': d.ctaBgColor ? 'solid' : null,
        'border-width': d.ctaBgColor ? '2px' : null,
        'border-radius': radius,
      };
    }
    if (d.ctaStyle === 'ghost') {
      return {
        background: 'transparent',
        color: d.ctaBgColor || d.ctaTextColor || null,
        'border-color': 'transparent',
        'border-radius': radius,
      };
    }
    return {
      background: d.ctaBgColor || null,
      color: d.ctaTextColor || null,
      'border-radius': radius,
    };
  }

  // ── Services helpers ───────────────────────────────────────────────────────
  svcsGridTemplate(): string | null {
    const v = this.servicesVariant();
    if (v === 'list') return '1fr';
    if (v === 'horizontal') return '1fr';
    const cols = this.servicesData.columns ?? 3;
    return `repeat(${cols}, 1fr)`;
  }

  svcCardStyle(): Record<string, string | null> {
    const d = this.servicesData;
    const RADIUS_MAP_LOCAL: Record<string, string> = {
      none: '0px', sm: '6px', md: '12px', lg: '18px', xl: '24px', full: '999px',
    };
    const SHADOW_MAP_LOCAL: Record<string, string> = {
      none: 'none',
      sm: '0 2px 8px rgba(15,23,42,0.08)',
      md: '0 8px 24px rgba(15,23,42,0.12)',
      lg: '0 16px 40px rgba(15,23,42,0.16)',
    };
    return {
      background:      d.cardBgColor      || null,
      color:           d.cardTextColor    || null,
      'border-color':  d.cardBorderColor  || null,
      'border-radius': d.cardBorderRadius ? (RADIUS_MAP_LOCAL[d.cardBorderRadius] ?? null) : null,
      'box-shadow':    d.cardShadow       ? (SHADOW_MAP_LOCAL[d.cardShadow] ?? null) : null,
    };
  }

  get navbarData(): NavbarData { return (this.section?.data ?? {}) as NavbarData; }
  navbarVariant(): NonNullable<NavbarData['variant']> {
    const v = this.navbarData.variant;
    if (v === 'centered' || v === 'split') return v;
    return 'simple';
  }
  navbarLinks(): NavLink[] {
    return this.navbarData.links ?? [];
  }

  heroMinHeight(): string | null {
    switch (this.heroData.heroHeight) {
      case 'medium': return '320px';
      case 'large':  return '480px';
      case 'screen': return '100vh';
      default: return null;
    }
  }

  get heroData(): HeroData { return (this.section?.data ?? {}) as HeroData; }
  get servicesData(): ServicesData { return (this.section?.data ?? {}) as ServicesData; }
  get faqData(): FaqData { return (this.section?.data ?? {}) as FaqData; }
  get featuredData(): FeaturedProductsData { return (this.section?.data ?? {}) as FeaturedProductsData; }
  get officesData(): OfficesData { return (this.section?.data ?? {}) as OfficesData; }
  get ctaData(): CtaData { return (this.section?.data ?? {}) as CtaData; }
  get contactData(): ContactData { return (this.section?.data ?? {}) as ContactData; }
  get footerData(): FooterData { return (this.section?.data ?? {}) as FooterData; }
  get sectionType(): WebsiteSectionType { return this.section?.type; }

  heroVariant(): NonNullable<HeroData['variant']> {
    const mapped = this.mapVariant(
      this.heroData.variant,
      { CLASSIC: 'classic', CENTERED: 'centered', PROMO: 'promo' },
    );
    if (mapped === 'classic' || mapped === 'centered' || mapped === 'promo') return mapped;
    return 'classic';
  }

  heroPrimaryLabel(): string {
    return this.heroData.ctaPrimary?.label?.trim() || 'Solicitar cotización';
  }

  heroSecondaryLabel(): string {
    return this.heroData.ctaSecondary?.label?.trim() || '';
  }

  resolvedTheme(): WebsitePageTheme {
    if (this.theme === 'commercial' || this.theme === 'premium' || this.theme === 'vibrant') return this.theme;
    if (this.theme === 'comercial') return 'commercial';
    if (this.theme === 'minimal') return 'premium';
    if (this.theme === 'vibrante') return 'vibrant';
    return 'commercial';
  }

  services(): ServiceItem[] {
    return (this.servicesData.items ?? []) as ServiceItem[];
  }

  servicesVariant(): NonNullable<ServicesData['variant']> {
    const mapped = this.mapVariant(
      this.servicesData.variant,
      { GRID: 'grid', ICON_LIST: 'list', HIGHLIGHT_BLOCKS: 'featured' },
    );
    if (mapped === 'grid' || mapped === 'list' || mapped === 'featured' || mapped === 'numbered' || mapped === 'horizontal') return mapped as NonNullable<ServicesData['variant']>;
    return 'grid';
  }

  faqItems(): FaqItem[] { return (this.faqData.items ?? []) as FaqItem[]; }

  faqVariant(): NonNullable<FaqData['variant']> {
    const mapped = this.mapVariant(
      this.faqData.variant,
      { ACCORDION: 'accordion', SIMPLE_LIST: 'list', TWO_COLUMNS: 'twoColumns' },
    );
    if (mapped === 'accordion' || mapped === 'list' || mapped === 'twoColumns') return mapped;
    return 'accordion';
  }

  featuredTitle(): string { return this.featuredData.title?.trim() || 'Productos destacados'; }

  featuredVariant(): NonNullable<FeaturedProductsData['variant']> {
    const mapped = this.mapVariant(
      this.featuredData.variant,
      { GRID: 'grid', SIMPLE_CAROUSEL: 'compact', HIGHLIGHT: 'highlight' },
    );
    if (mapped === 'grid' || mapped === 'highlight' || mapped === 'compact') return mapped;
    return 'grid';
  }

  featuredSubtitle(): string { return this.featuredData.subtitle?.trim() || ''; }
  featuredCtaLabel(): string { return this.featuredData.ctaLabel?.trim() || 'Ver catálogo'; }
  featuredShowCta(): boolean { return this.featuredData.showCta !== false; }
  featuredEmptyMessage(): string {
    return this.featuredData.emptyMessage?.trim()
      || 'Estamos actualizando nuestro catálogo. Escríbenos para asesorarte.';
  }
  featuredSkeleton(): number[] {
    const limit = Number.isFinite(this.featuredData.limit)
      ? Math.max(1, Math.min(12, Math.round(this.featuredData.limit!)))
      : 6;
    return Array.from({ length: Math.min(limit, 8) }, (_, idx) => idx);
  }

  officesTitle(): string { return this.officesData.title?.trim() || 'Oficinas y puntos de atención'; }

  officesVariant(): NonNullable<OfficesData['variant']> {
    const mapped = this.mapVariant(
      this.officesData.variant,
      { CARDS: 'cards', COMPACT_LIST: 'compact', MAIN_OFFICE: 'contact' },
    );
    if (mapped === 'cards' || mapped === 'compact' || mapped === 'contact') return mapped;
    return 'cards';
  }

  officesSubtitle(): string { return this.officesData.subtitle?.trim() || ''; }
  officesCtaLabel(): string { return this.officesData.ctaLabel?.trim() || 'Ver oficinas'; }
  officesEmptyMessage(): string {
    return this.officesData.emptyMessage?.trim()
      || 'No tenemos oficinas visibles por ahora. Contáctanos por WhatsApp.';
  }
  officesShowContactData(): boolean { return this.officesData.showContactData !== false; }
  officePreviewCards(): Array<{ name: string; city: string; phone: string }> {
    return [
      { name: 'Punto Centro', city: 'Centro', phone: '+57 300 000 0001' },
      { name: 'Punto Norte', city: 'Zona Norte', phone: '+57 300 000 0002' },
    ];
  }

  ctaTitle(): string { return this.ctaData.title?.trim() || '¿No sabes qué celular elegir?'; }

  ctaVariant(): NonNullable<CtaData['variant']> {
    const mapped = this.mapVariant(
      this.ctaData.variant,
      { CENTERED: 'centered', WITH_IMAGE: 'banner', SPLIT: 'split' },
    );
    if (mapped === 'centered' || mapped === 'split' || mapped === 'banner') return mapped;
    return 'centered';
  }

  ctaDescription(): string {
    return this.ctaData.description?.trim()
      || this.ctaData.subtitle?.trim()
      || 'Cuéntanos tu presupuesto y te ayudamos a encontrar la mejor opción.';
  }

  ctaPrimaryLabel(): string { return this.ctaData.ctaPrimary?.label?.trim() || 'Solicitar cotización'; }
  ctaSecondaryLabel(): string { return this.ctaData.ctaSecondary?.label?.trim() || ''; }
  ctaPrimaryActionLabel(): string {
    switch (this.ctaData.primaryAction) {
      case 'WHATSAPP': return 'WhatsApp';
      case 'CATALOG': return 'Catálogo';
      case 'QUOTE':
      default: return 'Cotizar';
    }
  }
  ctaStyleVariant(): 'DARK' | 'LIGHT' {
    return this.ctaData.styleVariant === 'LIGHT' ? 'LIGHT' : 'DARK';
  }

  contactTitle(): string { return this.contactData.title?.trim() || 'Contáctanos'; }
  contactVariant(): NonNullable<ContactData['variant']> {
    const mapped = this.mapVariant(
      this.contactData.variant,
      { CARD: 'card', SPLIT: 'split', CHANNEL_LIST: 'channels' },
    );
    if (mapped === 'card' || mapped === 'split' || mapped === 'channels') return mapped;
    return 'card';
  }
  contactDescription(): string { return this.contactData.description?.trim() || 'Estamos listos para asesorarte.'; }
  contactWhatsapp(): string { return this.contactData.whatsapp?.trim() || 'No configurado'; }
  contactPhone(): string { return this.contactData.phone?.trim() || 'No configurado'; }
  contactEmail(): string { return this.contactData.email?.trim() || 'No configurado'; }
  contactAddress(): string { return this.contactData.address?.trim() || 'No configurado'; }
  contactHours(): string { return this.contactData.hours?.trim() || ''; }
  contactWhatsappButtonLabel(): string {
    return this.contactData.whatsappButtonLabel?.trim() || 'Escribir por WhatsApp';
  }

  footerDescription(): string {
    return this.footerData.description?.trim()
      || 'Venta de celulares y accesorios con asesoría rápida y atención cercana.';
  }
  footerVariant(): NonNullable<FooterData['variant']> {
    const mapped = this.mapVariant(
      this.footerData.variant,
      { SIMPLE: 'simple', COLUMNS: 'columns', COMPACT: 'compact' },
    );
    if (mapped === 'simple' || mapped === 'columns' || mapped === 'compact') return mapped;
    return 'simple';
  }
  footerWhatsapp(): string { return this.footerData.whatsapp?.trim() || ''; }
  footerEmail(): string { return this.footerData.email?.trim() || ''; }
  footerShowPowered(): boolean { return this.footerData.showPoweredBySalesflow !== false; }
  footerCopyright(): string {
    return this.footerData.copyrightText?.trim()
      || `© ${new Date().getFullYear()} ${this.companyName || 'Tu tienda'} · Todos los derechos reservados`;
  }

  typeLabel(): string { return this.section?.type ? SECTION_TYPE_LABELS[this.section.type] : ''; }
  placeholderTitle(): string {
    const anyData = this.section?.data as { title?: string } | undefined;
    return anyData?.title ?? this.typeLabel();
  }

  private mapVariant(raw: unknown, legacyMap: Record<string, string>): string | null {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    return legacyMap[raw] ?? raw;
  }
}
