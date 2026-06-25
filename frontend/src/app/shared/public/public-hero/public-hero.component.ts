import { Component, computed, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WebsitePageTheme } from '@core/models/website-builder.model';
import { WebsiteConfig } from '@core/models/website-config.model';
import { HERO_TRUST } from '../public-defaults';
import { buildWa } from '../wa-link.util';

interface PublicCompany {
  name: string;
  subdomain: string;
}

@Component({
  selector: 'app-public-hero',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section
      class="hero"
      [attr.data-theme]="resolvedTheme()"
      [style.--brand]="brandColor()"
    >
      @if (resolvedTheme() === 'premium') {
        <div class="hero-premium">
          <div class="premium-text">
            <span class="premium-kicker">Colección premium</span>
            <h1>{{ title() }}</h1>
            <p class="sub">{{ subtitle() }}</p>
            <div class="premium-cta-row">
              <a [routerLink]="['/catalogo']" [queryParams]="{ sub: subdomain }" class="btn btn-primary">
                Explorar vitrina
              </a>
              <a [routerLink]="['/cotizar']" [queryParams]="{ sub: subdomain }" class="btn btn-secondary">
                Solicitar asesoría
              </a>
            </div>
          </div>

          <div class="premium-visual">
            @if (heroImage()) {
              <img [src]="heroImage()!" alt="banner" class="hero-image" />
            } @else {
              <div class="premium-mockup" aria-hidden="true">
                <div class="frame"></div>
                <div class="frame depth"></div>
              </div>
            }
          </div>
        </div>
      } @else if (resolvedTheme() === 'vibrant') {
        <div class="hero-vibrant">
          <div class="vibrant-content">
            <span class="badge promo">Promociones activas</span>
            <h1>{{ title() }}</h1>
            <p class="sub">{{ subtitle() }}</p>

            <div class="vibrant-highlights">
              <span>Respuesta rápida</span>
              <span>Cotiza por WhatsApp</span>
              <span>Equipos por presupuesto</span>
            </div>

            <div class="cta-row">
              <a [routerLink]="['/cotizar']" [queryParams]="{ sub: subdomain }" class="btn btn-primary">
                Cotizar hoy
              </a>
              <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn-wa">
                WhatsApp
              </a>
              <a [routerLink]="['/catalogo']" [queryParams]="{ sub: subdomain }" class="btn btn-secondary">
                Ver catálogo
              </a>
            </div>
          </div>

          <div class="vibrant-side">
            @if (heroImage()) {
              <img [src]="heroImage()!" alt="banner" class="hero-image" />
            } @else {
              <div class="offer-tile" aria-hidden="true">
                <strong>Promo Flash</strong>
                <span>Renueva tu celular esta semana</span>
              </div>
            }
          </div>
        </div>
      } @else {
        <div class="hero-commercial">
          <div class="hero-text">
            <span class="badge">
              <i class="pi pi-shopping-bag"></i>
              {{ tagline() }}
            </span>
            <h1>{{ title() }}</h1>
            <p class="sub">{{ subtitle() }}</p>

            <div class="cta-row">
              <a
                [routerLink]="['/catalogo']"
                [queryParams]="{ sub: subdomain }"
                class="btn btn-primary"
              >
                <i class="pi pi-mobile"></i> Ver catálogo
              </a>
              <a
                [routerLink]="['/cotizar']"
                [queryParams]="{ sub: subdomain }"
                class="btn btn-secondary"
              >
                <i class="pi pi-bolt"></i> Solicitar cotización
              </a>
              <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn-wa">
                <i class="pi pi-whatsapp"></i> Escribir por WhatsApp
              </a>
            </div>

            <ul class="trust">
              @for (t of trust; track t.label) {
                <li>
                  <i [class]="'pi ' + t.icon"></i>
                  <span>{{ t.label }}</span>
                </li>
              }
            </ul>
          </div>

          <div class="hero-visual">
            @if (heroImage()) {
              <img [src]="heroImage()!" alt="banner" class="hero-image" />
            } @else {
              <div class="phone-mockup" aria-hidden="true">
                <div class="phone">
                  <div class="phone-notch"></div>
                  <div class="phone-screen">
                    <div class="screen-bar"></div>
                    <div class="screen-card"></div>
                    <div class="screen-card sm"></div>
                    <div class="screen-card sm wide"></div>
                  </div>
                </div>
                <div class="phone phone-back" aria-hidden="true">
                  <div class="phone-notch"></div>
                </div>
                <div class="halo"></div>
              </div>
            }
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .hero {
        position: relative;
        overflow: hidden;
        padding: 4rem 1.25rem 3.5rem;
      }

      .hero[data-theme='commercial'] {
        background:
          radial-gradient(900px 500px at 90% -10%, color-mix(in srgb, var(--brand) 18%, transparent), transparent 60%),
          radial-gradient(700px 400px at -10% 100%, rgba(16, 185, 129, 0.1), transparent 60%),
          linear-gradient(180deg, #f8fafc, #f1f5f9);
      }

      .hero[data-theme='premium'] {
        background:
          radial-gradient(600px 300px at 85% 5%, rgba(209, 180, 121, 0.28), transparent 50%),
          linear-gradient(165deg, #020617, #0f172a 60%, #111827);
      }

      .hero[data-theme='vibrant'] {
        background:
          radial-gradient(900px 450px at 0% 10%, rgba(14, 165, 233, 0.26), transparent 60%),
          radial-gradient(700px 400px at 100% 20%, rgba(37, 99, 235, 0.2), transparent 65%),
          linear-gradient(125deg, #0ea5e9, #2563eb);
      }

      .hero-commercial {
        position: relative;
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1.15fr 1fr;
        gap: 3rem;
        align-items: center;
      }

      .hero-premium {
        position: relative;
        max-width: 1060px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1.05fr 1fr;
        gap: 3rem;
        align-items: center;
      }

      .hero-vibrant {
        position: relative;
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1.2fr 0.8fr;
        gap: 1.2rem;
        align-items: stretch;
      }

      @media (max-width: 880px) {
        .hero-commercial,
        .hero-premium,
        .hero-vibrant {
          grid-template-columns: 1fr;
          gap: 2rem;
        }
      }

      .hero-text,
      .premium-text,
      .vibrant-content {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .badge {
        align-self: flex-start;
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.35rem 0.7rem;
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 999px;
        color: var(--brand);
        font-weight: 600;
        font-size: 0.78rem;
      }

      .badge.promo {
        background: #fef9c3;
        border-color: #fde047;
        color: #92400e;
      }

      .premium-kicker {
        display: inline-flex;
        align-self: flex-start;
        border: 1px solid rgba(209, 180, 121, 0.5);
        border-radius: 999px;
        padding: 0.24rem 0.58rem;
        color: #d1b479;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        font-size: 0.68rem;
      }

      h1 {
        font-size: clamp(2rem, 4.5vw, 3.25rem);
        font-weight: 800;
        line-height: 1.05;
        letter-spacing: -0.025em;
        margin: 0;
      }

      .hero[data-theme='commercial'] h1 { color: var(--sf-text); }
      .hero[data-theme='premium'] h1 {
        color: #f8fafc;
        font-size: clamp(2.2rem, 4.8vw, 3.7rem);
        font-weight: 650;
      }
      .hero[data-theme='vibrant'] h1 {
        color: #fff;
        font-size: clamp(2.1rem, 4.7vw, 3.5rem);
      }

      .sub {
        font-size: 1.05rem;
        max-width: 52ch;
        line-height: 1.55;
      }

      .hero[data-theme='commercial'] .sub { color: var(--sf-text-muted); }
      .hero[data-theme='premium'] .sub { color: #cbd5e1; max-width: 48ch; }
      .hero[data-theme='vibrant'] .sub { color: #dbeafe; max-width: 48ch; }

      .cta-row,
      .premium-cta-row {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
        margin-top: 0.5rem;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.1rem;
        border-radius: 12px;
        font-weight: 700;
        text-decoration: none;
        transition: filter 0.15s var(--sf-ease), transform 0.05s ease;
        font-size: 0.95rem;
      }

      .btn:hover { text-decoration: none; filter: brightness(0.97); }
      .btn:active { transform: translateY(1px); }

      .hero[data-theme='commercial'] .btn-primary {
        background: var(--sf-success);
        color: #fff;
      }

      .hero[data-theme='commercial'] .btn-secondary {
        background: #fff;
        color: var(--sf-text);
        border: 1px solid var(--sf-border);
      }

      .hero[data-theme='premium'] .btn-primary {
        background: #d1b479;
        color: #111827;
      }

      .hero[data-theme='premium'] .btn-secondary {
        background: transparent;
        color: #f8fafc;
        border: 1px solid #475569;
      }

      .hero[data-theme='vibrant'] .btn-primary {
        background: #fef08a;
        color: #0c4a6e;
      }

      .hero[data-theme='vibrant'] .btn-secondary {
        background: rgba(255, 255, 255, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.45);
        color: #fff;
      }

      .btn-wa {
        background: #25d366;
        color: #fff;
      }

      .trust {
        list-style: none;
        padding: 0;
        margin: 1.25rem 0 0;
        display: grid;
        grid-template-columns: repeat(2, max-content);
        gap: 0.55rem 1.25rem;
      }

      @media (max-width: 480px) { .trust { grid-template-columns: 1fr; } }

      .trust li {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--sf-text-muted);
        font-size: 0.9rem;
      }

      .trust i {
        color: var(--brand);
        background: color-mix(in srgb, var(--brand) 12%, transparent);
        width: 28px;
        height: 28px;
        border-radius: 9px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .vibrant-highlights {
        display: flex;
        gap: 0.45rem;
        flex-wrap: wrap;
      }

      .vibrant-highlights span {
        display: inline-flex;
        padding: 0.26rem 0.62rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.45);
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
      }

      .hero-visual,
      .premium-visual,
      .vibrant-side { display: flex; justify-content: center; align-items: center; }

      .hero-image {
        width: 100%;
        max-width: 480px;
        border-radius: 22px;
        box-shadow: var(--sf-shadow-lg);
      }

      .premium-mockup {
        position: relative;
        width: min(420px, 100%);
        height: 300px;
      }

      .premium-mockup .frame {
        position: absolute;
        inset: 0;
        border-radius: 24px;
        background: linear-gradient(160deg, #1f2937, #0f172a);
        border: 1px solid rgba(209, 180, 121, 0.3);
      }

      .premium-mockup .frame.depth {
        inset: 18px -20px -18px 20px;
        opacity: 0.55;
      }

      .offer-tile {
        width: 100%;
        max-width: 360px;
        border-radius: 22px;
        padding: 1.1rem;
        background: #fef08a;
        color: #0c4a6e;
        display: grid;
        gap: 0.35rem;
      }

      .offer-tile strong {
        font-size: 1.1rem;
      }

      .phone-mockup {
        position: relative;
        width: 320px;
        height: 460px;
      }

      .halo {
        position: absolute;
        inset: -40px;
        background: radial-gradient(
          400px 400px at 50% 50%,
          color-mix(in srgb, var(--brand) 22%, transparent),
          transparent 70%
        );
        z-index: 0;
        filter: blur(8px);
      }

      .phone {
        position: absolute;
        width: 240px;
        height: 480px;
        background: linear-gradient(160deg, #1e293b, #0f172a);
        border-radius: 36px;
        border: 6px solid #0b1220;
        box-shadow: 0 30px 60px -20px rgba(15, 23, 42, 0.45),
          inset 0 1px 2px rgba(255, 255, 255, 0.08);
        z-index: 1;
        right: 20px;
        top: 0;
      }

      .phone-back {
        right: 95px;
        top: 30px;
        z-index: 0;
        opacity: 0.65;
        transform: rotate(-7deg);
        background: linear-gradient(160deg, #334155, #0f172a);
      }

      .phone-notch {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 90px;
        height: 22px;
        background: #0b1220;
        border-radius: 0 0 14px 14px;
      }

      .phone-screen {
        position: absolute;
        inset: 18px 12px;
        background: linear-gradient(180deg, color-mix(in srgb, var(--brand) 35%, #0f172a), #0f172a);
        border-radius: 24px;
        padding: 40px 16px 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .screen-bar {
        height: 18px;
        background: rgba(255, 255, 255, 0.18);
        border-radius: 8px;
      }

      .screen-card {
        height: 80px;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
      }

      .screen-card.sm { height: 32px; }
      .screen-card.wide { background: rgba(16, 185, 129, 0.35); }
    `,
  ],
})
export class PublicHeroComponent {
  @Input() company: PublicCompany | null = null;
  @Input() config: WebsiteConfig | null = null;
  @Input() subdomain = '';
  @Input() theme: WebsitePageTheme | string | null = null;

  readonly trust = HERO_TRUST;

  resolvedTheme(): WebsitePageTheme {
    if (this.theme === 'commercial' || this.theme === 'premium' || this.theme === 'vibrant') {
      return this.theme;
    }
    if (this.theme === 'comercial') return 'commercial';
    if (this.theme === 'minimal') return 'premium';
    if (this.theme === 'vibrante') return 'vibrant';
    return 'commercial';
  }

  brandColor = computed(() => this.config?.primaryColor || '#2563eb');

  title = computed(
    () =>
      this.config?.heroTitle ||
      'Cotiza celulares nuevos y usados con asesoría personalizada',
  );

  subtitle = computed(
    () =>
      this.config?.heroSubtitle ||
      'Encuentra el celular ideal según tu presupuesto y recibe atención comercial rápida por WhatsApp.',
  );

  tagline = computed(() => {
    const city = this.config?.address?.split(',').pop()?.trim();
    return `Celulares${city ? ' en ' + city : ' en tu ciudad'}`;
  });

  heroImage = computed(() => {
    const banners = this.config?.banners ?? [];
    return banners[0]?.imageUrl || null;
  });

  waLink = computed(() =>
    buildWa(this.config?.contactPhone, `Hola ${this.company?.name ?? ''}!`),
  );
}
