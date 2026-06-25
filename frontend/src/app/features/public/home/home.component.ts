import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

function tenantSubdomain(): string {
  const host = window.location.hostname;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return '';
  const parts = host.split('.');
  if (parts.length === 1) return '';
  if (parts.length === 2 && parts[1] === 'localhost') return parts[0];
  return parts.length >= 3 ? parts[0] : '';
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule],
  template: `
    <div class="home-shell">
      <section class="hero">
        <div class="brand-tag">
          <span class="brand-mark">SF</span>
          <span class="brand-name">SalesFlow</span>
        </div>
        <h1>Encuentra tu próximo celular y cotiza en segundos.</h1>
        <p class="sub">
          Catálogo, garantía y atención por WhatsApp con las mejores tiendas de tu ciudad.
        </p>
        <div class="finder">
          <input
            pInputText
            [(ngModel)]="subdomain"
            placeholder="Nombre de tu tienda (ej. motocel)"
          />
          <p-button label="Ver sitio" icon="pi pi-globe" (onClick)="go('sitio')" />
          <p-button
            label="Catálogo"
            icon="pi pi-mobile"
            severity="secondary"
            (onClick)="go('catalogo')"
          />
          <p-button
            label="Cotizar"
            icon="pi pi-comment"
            severity="secondary"
            [text]="true"
            (onClick)="go('cotizar')"
          />
        </div>
        <small class="text-muted">
          Ingresa el nombre de la tienda para ver su sitio, catálogo y cotizaciones.
        </small>
      </section>
    </div>
  `,
  styles: [
    `
      .home-shell {
        min-height: 100vh;
        background:
          radial-gradient(900px 500px at 80% -10%, rgba(37, 99, 235, 0.12), transparent 60%),
          radial-gradient(700px 400px at -10% 100%, rgba(16, 185, 129, 0.1), transparent 60%),
          var(--sf-bg);
      }
      .hero {
        max-width: 760px;
        margin: 0 auto;
        padding: 6rem 1.25rem 4rem;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
      .brand-tag {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.35rem 0.65rem 0.35rem 0.5rem;
        background: var(--sf-surface);
        border: 1px solid var(--sf-border);
        border-radius: 999px;
        font-weight: 600;
        font-size: 0.85rem;
      }
      .brand-mark {
        width: 22px;
        height: 22px;
        border-radius: 7px;
        background: linear-gradient(135deg, var(--sf-primary), #4f46e5);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: 800;
      }
      .hero h1 {
        font-size: 2.5rem;
        letter-spacing: -0.025em;
        line-height: 1.1;
        max-width: 22ch;
      }
      .sub {
        color: var(--sf-text-muted);
        font-size: 1.05rem;
        max-width: 50ch;
      }
      .finder {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        justify-content: center;
        margin: 0.5rem 0;
      }
      .finder input {
        min-width: 280px;
      }
    `,
  ],
})
export class HomeComponent {
  private readonly router = inject(Router);
  subdomain = '';

  constructor() {
    // Si hay subdominio de tenant en la URL, redirigir al login del panel
    if (tenantSubdomain()) {
      this.router.navigate(['/auth/login']);
    }
  }

  go(path: string): void {
    if (!this.subdomain) return;
    this.router.navigate([path], { queryParams: { sub: this.subdomain } });
  }
}
