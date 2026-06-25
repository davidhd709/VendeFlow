import { Component, computed, Input, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { WebsiteConfig } from '@core/models/website-config.model';
import { buildWa } from '../wa-link.util';

interface PublicCompany {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
}

@Component({
  selector: 'app-public-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="nav" [style.--brand]="brandColor()">
      @if (config?.contactPhone) {
        <div class="topline">
          <div class="topline-inner">
            <span>
              <i class="pi pi-whatsapp"></i>
              Atención comercial:
              <strong>{{ config!.contactPhone }}</strong>
            </span>
            <a [href]="waLink()" target="_blank" rel="noopener">
              Escribir ahora
            </a>
          </div>
        </div>
      }
      <div class="nav-inner">
        <a
          class="brand"
          [routerLink]="['/sitio']"
          [queryParams]="{ sub: subdomain }"
        >
          @if (config?.logoUrl) {
            <img class="brand-logo" [src]="config!.logoUrl!" alt="logo" />
          } @else {
            <span class="brand-mark">{{ initial() }}</span>
          }
          <span class="brand-name">{{ company?.name || 'SalesFlow' }}</span>
        </a>

        <button
          class="hamb"
          type="button"
          (click)="toggle()"
          aria-label="Mostrar menú"
        >
          <i class="pi" [class.pi-bars]="!open()" [class.pi-times]="open()"></i>
        </button>

        <nav class="nav-links" [class.open]="open()">
          <a
            [routerLink]="['/sitio']"
            [queryParams]="{ sub: subdomain }"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{ exact: true }"
            (click)="close()"
            >Inicio</a
          >
          <a
            [routerLink]="['/catalogo']"
            [queryParams]="{ sub: subdomain }"
            routerLinkActive="active"
            (click)="close()"
            >Catálogo</a
          >
          <a href="#servicios" (click)="close()">Servicios</a>
          <a href="#oficinas" (click)="close()">Oficinas</a>
          <a href="#contacto" (click)="close()">Contacto</a>

          <div class="nav-cta">
            <a
              [routerLink]="['/cotizar']"
              [queryParams]="{ sub: subdomain }"
              class="btn-primary"
              (click)="close()"
            >
              <i class="pi pi-bolt"></i> Cotizar ahora
            </a>
            <a
              [href]="waLink()"
              target="_blank"
              rel="noopener"
              class="btn-wa"
              (click)="close()"
            >
              <i class="pi pi-whatsapp"></i> Escribir por WhatsApp
            </a>
          </div>
        </nav>
      </div>
    </header>
  `,
  styles: [
    `
      :host { display: block; }
      .nav {
        position: sticky;
        top: 0;
        z-index: 50;
        background: rgba(248, 250, 252, 0.93);
        border-bottom: 1px solid var(--sf-border);
        backdrop-filter: saturate(160%) blur(10px);
      }
      .topline {
        background: #0f172a;
        color: #cbd5e1;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .topline-inner {
        max-width: 1180px;
        margin: 0 auto;
        padding: 0.35rem 1.25rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        flex-wrap: wrap;
        font-size: 0.76rem;
      }
      .topline i { color: #10b981; }
      .topline a {
        color: #fff;
        font-weight: 700;
        text-decoration: none;
      }
      .topline a:hover { text-decoration: underline; }
      .nav-inner {
        max-width: 1180px;
        margin: 0 auto;
        padding: 0.75rem 1.25rem;
        display: flex;
        align-items: center;
        gap: 1.5rem;
        position: relative;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        color: var(--sf-text);
        text-decoration: none;
        flex-shrink: 0;
      }
      .brand-logo {
        height: 32px;
        width: auto;
        object-fit: contain;
      }
      .brand-mark {
        width: 32px;
        height: 32px;
        border-radius: 9px;
        background: linear-gradient(135deg, var(--brand, #2563eb), #4f46e5);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.95rem;
      }
      .brand-name {
        font-weight: 700;
        letter-spacing: -0.01em;
        font-size: 0.97rem;
        max-width: min(40vw, 320px);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .hamb {
        margin-left: auto;
        display: none;
        background: transparent;
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        width: 38px;
        height: 38px;
        cursor: pointer;
        color: var(--sf-text);
      }
      .nav-links {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .nav-links a {
        color: var(--sf-text-muted);
        text-decoration: none;
        font-weight: 600;
        font-size: 0.92rem;
        padding: 0.4rem 0.1rem;
        border-bottom: 2px solid transparent;
        transition: color 0.15s var(--sf-ease), border-color 0.15s var(--sf-ease);
      }
      .nav-links a:hover { color: var(--sf-text); }
      .nav-links a.active {
        color: var(--brand, var(--sf-primary));
        border-bottom-color: var(--brand, var(--sf-primary));
      }
      .nav-cta {
        display: flex;
        gap: 0.5rem;
        margin-left: 0.5rem;
      }
      .btn-primary, .btn-wa {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.52rem 0.9rem;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 700;
        text-decoration: none;
      }
      .btn-primary {
        background: var(--brand, var(--sf-primary));
        color: #fff;
      }
      .btn-primary:hover { filter: brightness(0.95); text-decoration: none; }
      .btn-wa {
        background: #25d366;
        color: #fff;
      }
      .btn-wa:hover { filter: brightness(0.95); text-decoration: none; }

      @media (max-width: 880px) {
        .topline-inner {
          padding: 0.3rem 0.9rem;
        }
        .hamb { display: inline-flex; }
        .nav-inner {
          padding: 0.65rem 0.9rem;
        }
        .brand-name { max-width: min(56vw, 230px); }
        .nav-links {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #fff;
          border-bottom: 1px solid var(--sf-border);
          flex-direction: column;
          align-items: stretch;
          padding: 0.5rem 1rem 1rem;
          gap: 0.25rem;
          transform: translateY(-110%);
          transition: transform 0.2s var(--sf-ease);
          pointer-events: none;
          box-shadow: var(--sf-shadow);
        }
        .nav-links.open {
          transform: translateY(0);
          pointer-events: auto;
        }
        .nav-links a {
          padding: 0.65rem 0.25rem;
          border-bottom: 1px solid var(--sf-border);
        }
        .nav-links a:last-of-type { border-bottom: none; }
        .nav-cta {
          margin-left: 0;
          margin-top: 0.5rem;
          flex-direction: column;
        }
        .btn-primary, .btn-wa {
          justify-content: center;
          padding: 0.7rem;
        }
      }
      @media (max-width: 430px) {
        .topline-inner span {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .topline-inner {
          justify-content: flex-start;
          gap: 0.45rem;
        }
        .topline-inner a {
          margin-left: auto;
          font-size: 0.72rem;
        }
        .brand-logo,
        .brand-mark {
          width: 28px;
          height: 28px;
        }
        .brand-name {
          font-size: 0.9rem;
          max-width: min(50vw, 170px);
        }
      }
    `,
  ],
})
export class PublicNavbarComponent {
  @Input() company: PublicCompany | null = null;
  @Input() config: WebsiteConfig | null = null;
  @Input() subdomain = '';

  open = signal(false);

  brandColor = computed(() => this.config?.primaryColor || '#2563eb');

  initial = computed(() => {
    const name = this.company?.name || 'SF';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 1)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  });

  waLink = computed(() =>
    buildWa(this.config?.contactPhone, `Hola ${this.company?.name ?? ''}!`),
  );

  toggle(): void { this.open.update((v) => !v); }
  close(): void { this.open.set(false); }
}
