import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PublicOffice } from '@core/models/catalog.model';
import { FooterData, WebsitePageTheme } from '@core/models/website-builder.model';
import { WebsiteConfig } from '@core/models/website-config.model';
import { buildWa } from '../wa-link.util';

interface PublicCompany {
  name: string;
  subdomain: string;
}

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="ft" [attr.data-theme]="resolvedTheme()" [style.--brand]="brandColor()">
      <div class="ft-inner">
        <div class="ft-col brand">
          <div class="brand-tag">
            @if (config?.logoUrl) {
              <img class="brand-logo" [src]="config!.logoUrl!" alt="logo" />
            } @else {
              <span class="brand-mark">{{ initial() }}</span>
            }
            <span class="brand-name">{{ company?.name || 'SalesFlow' }}</span>
          </div>
          <p class="text-muted text-sm">
            {{ description() }}
          </p>
        </div>

        <div class="ft-col">
          <div class="ft-title">Explorar</div>
          <ul>
            <li>
              <a [routerLink]="['/sitio']" [queryParams]="{ sub: subdomain }">
                Inicio
              </a>
            </li>
            <li>
              <a [routerLink]="['/catalogo']" [queryParams]="{ sub: subdomain }">
                Catálogo
              </a>
            </li>
            <li>
              <a [routerLink]="['/cotizar']" [queryParams]="{ sub: subdomain }">
                Cotizar
              </a>
            </li>
            <li><a href="#servicios">Servicios</a></li>
            <li><a href="#contacto">Contacto</a></li>
          </ul>
        </div>

        <div class="ft-col">
          <div class="ft-title">Contacto</div>
          <ul>
            @if (config?.contactPhone) {
              <li>
                <i class="pi pi-phone"></i> {{ config!.contactPhone }}
              </li>
            }
            @if (footerEmail()) {
              <li>
                <i class="pi pi-envelope"></i> {{ footerEmail() }}
              </li>
            }
            @if (config?.address) {
              <li>
                <i class="pi pi-map-marker"></i> {{ config!.address }}
              </li>
            }
            <li>
              <a [href]="waLink()" target="_blank" rel="noopener" class="wa">
                <i class="pi pi-whatsapp"></i> Escribir por WhatsApp
              </a>
            </li>
          </ul>
        </div>

        @if (offices.length > 0) {
          <div class="ft-col">
            <div class="ft-title">Oficinas</div>
            <ul>
              @for (o of offices; track o.id) {
                <li>
                  <strong>{{ o.name }}</strong>
                  @if (o.city) { · {{ o.city }} }
                  @if (o.phone) { <br /><span class="text-xs">{{ o.phone }}</span> }
                </li>
              }
            </ul>
          </div>
        }
      </div>

      <div class="ft-bottom">
        <span class="text-sm text-muted">
          {{ copyrightText() }}
        </span>
        @if (showPoweredBy()) {
          <span class="text-xs text-muted powered">
            Powered by <strong>SalesFlow</strong>
          </span>
        }
      </div>
    </footer>
  `,
  styles: [
    `
      :host { display: block; margin-top: 4rem; }
      .ft {
        background:
          radial-gradient(900px 360px at 90% -30%, color-mix(in srgb, var(--brand, #2563eb) 20%, transparent), transparent 60%),
          linear-gradient(165deg, #0f172a, #111c30);
        color: #cbd5e1;
        padding: 3rem 1.25rem 1.5rem;
      }
      .ft[data-theme='premium'] {
        background:
          radial-gradient(760px 300px at 90% -20%, rgba(209, 180, 121, 0.28), transparent 60%),
          linear-gradient(165deg, #020617, #111827);
      }
      .ft[data-theme='vibrant'] {
        background:
          radial-gradient(500px 220px at 0% 0%, rgba(186, 230, 253, 0.4), transparent 65%),
          linear-gradient(135deg, #075985, #1d4ed8 65%, #1e3a8a 100%);
      }
      .ft-inner {
        max-width: 1180px;
        margin: 0 auto;
        display: grid;
        grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
        gap: 2rem;
      }
      .ft[data-theme='premium'] .ft-inner {
        max-width: 1060px;
        grid-template-columns: 1.6fr 1fr 1fr;
      }
      .ft[data-theme='vibrant'] .ft-inner {
        grid-template-columns: 1.2fr 1fr 1fr 1fr;
        gap: 1.4rem;
      }
      @media (max-width: 880px) {
        .ft-inner { grid-template-columns: 1fr 1fr; gap: 1.5rem; }
      }
      @media (max-width: 540px) {
        :host { margin-top: 2.8rem; }
        .ft {
          padding: 2rem 1rem 1.1rem;
        }
        .ft-inner { grid-template-columns: 1fr; }
        .ft-col ul {
          gap: 0.42rem;
        }
        .ft-col li,
        .ft-col li i {
          font-size: 0.83rem;
        }
        .ft-col a {
          min-height: 34px;
        }
        .wa {
          font-size: 0.76rem;
        }
        .ft-bottom {
          margin-top: 1.35rem;
          padding-top: 0.95rem;
        }
      }
      .ft-col .ft-title {
        font-size: 0.72rem;
        font-weight: 700;
        color: #94a3b8;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 0.85rem;
      }
      .ft[data-theme='premium'] .ft-col .ft-title {
        color: #d1b479;
        letter-spacing: 0.14em;
      }
      .ft[data-theme='vibrant'] .ft-col .ft-title {
        color: #bfdbfe;
      }
      .ft-col ul {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
      }
      .ft-col li,
      .ft-col li i {
        color: #cbd5e1;
        font-size: 0.88rem;
      }
      .ft-col a {
        color: #cbd5e1;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        min-height: 30px;
      }
      .ft-col a:hover { color: #fff; text-decoration: underline; }
      .ft-col p.text-muted { color: #94a3b8; }
      .ft[data-theme='premium'] .ft-col a:hover {
        color: #d1b479;
      }

      .brand-tag {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
      }
      .brand-logo {
        height: 36px;
        background: #fff;
        border-radius: 8px;
        padding: 0.25rem;
        object-fit: contain;
      }
      .brand-mark {
        width: 36px;
        height: 36px;
        border-radius: 9px;
        background: linear-gradient(135deg, var(--brand, #2563eb), #4f46e5);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
      }
      .brand-name {
        color: #fff;
        font-weight: 700;
        font-size: 1.05rem;
      }

      .wa {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: #10b981;
        color: #fff !important;
        padding: 0.35rem 0.7rem;
        border-radius: 999px;
        font-weight: 700;
        font-size: 0.8rem;
      }
      .ft[data-theme='premium'] .wa {
        background: #d1b479;
        color: #111827 !important;
      }
      .ft[data-theme='vibrant'] .wa {
        background: #fef08a;
        color: #0c4a6e !important;
      }

      .ft-bottom {
        max-width: 1180px;
        margin: 2rem auto 0;
        padding-top: 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }
      .ft-bottom .text-muted { color: #94a3b8 !important; }
      .ft-bottom .powered strong { color: #fff; }
      .powered {
        opacity: 0.9;
      }
    `,
  ],
})
export class PublicFooterComponent {
  @Input() company: PublicCompany | null = null;
  @Input() config: WebsiteConfig | null = null;
  @Input() footerData: FooterData | null = null;
  @Input() offices: PublicOffice[] = [];
  @Input() subdomain = '';
  @Input() theme: WebsitePageTheme | string | null = null;

  readonly year = new Date().getFullYear();

  resolvedTheme(): WebsitePageTheme {
    if (this.theme === 'commercial' || this.theme === 'premium' || this.theme === 'vibrant') {
      return this.theme;
    }
    if (this.theme === 'comercial') return 'commercial';
    if (this.theme === 'minimal') return 'premium';
    if (this.theme === 'vibrante') return 'vibrant';
    return 'commercial';
  }

  brandColor(): string {
    return this.config?.primaryColor || '#2563eb';
  }

  initial(): string {
    const name = this.company?.name || 'SF';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 1)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  description(): string {
    return this.footerData?.description?.trim()
      || this.config?.heroSubtitle
      || 'Venta de celulares, accesorios y servicio técnico con asesoría rápida por WhatsApp.';
  }

  footerEmail(): string {
    return this.footerData?.email?.trim() || this.config?.contactEmail || '';
  }

  footerWhatsapp(): string {
    return this.footerData?.whatsapp?.trim() || this.config?.contactPhone || '';
  }

  copyrightText(): string {
    return this.footerData?.copyrightText?.trim()
      || `© ${this.year} ${this.company?.name || 'SalesFlow'} · Todos los derechos reservados`;
  }

  showPoweredBy(): boolean {
    return this.footerData?.showPoweredBySalesflow !== false;
  }

  waLink(): string {
    return buildWa(this.footerWhatsapp());
  }
}
