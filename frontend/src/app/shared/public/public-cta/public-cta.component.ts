import { Component, computed, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WebsitePageTheme } from '@core/models/website-builder.model';
import { buildWa } from '../wa-link.util';

@Component({
  selector: 'app-public-cta',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section
      class="cta"
      [attr.data-theme]="resolvedTheme()"
      [style.--brand]="brandColor || '#2563eb'"
    >
      @if (resolvedTheme() === 'premium') {
        <div class="cta-premium">
          <div class="cta-text">
            <span class="kicker">Asesoría premium</span>
            <h2>Encuentra el equipo ideal para tu estilo</h2>
            <p>
              Te ayudamos a elegir gama alta con atención personalizada y opciones
              de pago.
            </p>
          </div>
          <div class="cta-actions">
            <a [routerLink]="['/cotizar']" [queryParams]="{ sub: subdomain }" class="btn btn-primary">
              Solicitar asesoría
            </a>
            <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn-secondary">
              WhatsApp directo
            </a>
          </div>
        </div>
      } @else if (resolvedTheme() === 'vibrant') {
        <div class="cta-vibrant">
          <div class="cta-text">
            <h2>Promociones activas para renovar tu celular</h2>
            <p>
              Cotiza hoy y recibe respuesta rápida con opciones por presupuesto.
            </p>
          </div>
          <div class="cta-actions">
            <a [routerLink]="['/cotizar']" [queryParams]="{ sub: subdomain }" class="btn btn-primary">
              Cotizar ahora
            </a>
            <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn-wa">
              Escribir por WhatsApp
            </a>
            <a [routerLink]="['/catalogo']" [queryParams]="{ sub: subdomain }" class="btn btn-secondary">
              Ver catálogo
            </a>
          </div>
        </div>
      } @else {
        <div class="cta-commercial">
          <div class="cta-text">
            <h2>¿No sabes qué celular elegir?</h2>
            <p>
              Dinos tu presupuesto y te ayudamos a encontrar la mejor opción
              disponible.
            </p>
          </div>
          <div class="cta-actions">
            <a [routerLink]="['/cotizar']" [queryParams]="{ sub: subdomain }" class="btn btn-primary">
              <i class="pi pi-bolt"></i> Solicitar cotización
            </a>
            <a [href]="waLink()" target="_blank" rel="noopener" class="btn btn-wa">
              <i class="pi pi-whatsapp"></i> Escribir por WhatsApp
            </a>
          </div>
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host { display: block; }
      .cta {
        position: relative;
        overflow: hidden;
        border-radius: 22px;
        padding: 3rem 2rem;
        margin: 0 1.25rem;
      }

      .cta[data-theme='commercial'] {
        background:
          radial-gradient(700px 400px at 80% 0%, color-mix(in srgb, var(--brand) 28%, transparent), transparent 60%),
          linear-gradient(140deg, #0f172a, #1e293b);
      }

      .cta[data-theme='premium'] {
        background:
          radial-gradient(700px 300px at 88% 5%, rgba(209, 180, 121, 0.24), transparent 55%),
          linear-gradient(165deg, #020617, #111827);
        border: 1px solid rgba(209, 180, 121, 0.38);
      }

      .cta[data-theme='vibrant'] {
        background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 65%, #1d4ed8 100%);
      }

      .cta-commercial,
      .cta-premium,
      .cta-vibrant {
        position: relative;
        max-width: 1100px;
        margin: 0 auto;
        display: flex;
        gap: 2rem;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
      }

      .cta-vibrant {
        align-items: flex-end;
      }

      .cta-text { flex: 1; min-width: 260px; }

      .kicker {
        display: inline-flex;
        border: 1px solid rgba(209, 180, 121, 0.52);
        color: #d1b479;
        border-radius: 999px;
        padding: 0.2rem 0.5rem;
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      h2 {
        margin: 0;
        font-size: clamp(1.5rem, 3vw, 2rem);
        letter-spacing: -0.02em;
      }

      .cta[data-theme='commercial'] h2,
      .cta[data-theme='premium'] h2,
      .cta[data-theme='vibrant'] h2 {
        color: #fff;
      }

      p {
        margin: 0.5rem 0 0;
        max-width: 50ch;
        line-height: 1.55;
      }

      .cta[data-theme='commercial'] p,
      .cta[data-theme='premium'] p { color: #cbd5e1; }
      .cta[data-theme='vibrant'] p { color: #e0f2fe; }

      .cta-actions {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.75rem 1.1rem;
        border-radius: 12px;
        font-weight: 700;
        text-decoration: none;
        font-size: 0.95rem;
      }

      .btn-primary {
        background: var(--sf-success);
        color: #fff;
      }

      .cta[data-theme='premium'] .btn-primary {
        background: #d1b479;
        color: #111827;
      }

      .cta[data-theme='premium'] .btn-secondary {
        background: transparent;
        border: 1px solid #64748b;
        color: #f8fafc;
      }

      .cta[data-theme='vibrant'] .btn-primary {
        background: #fef08a;
        color: #0c4a6e;
      }

      .cta[data-theme='vibrant'] .btn-secondary {
        background: rgba(255, 255, 255, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.45);
        color: #fff;
      }

      .btn-wa { background: #25d366; color: #fff; }
      .btn:hover { text-decoration: none; filter: brightness(0.97); }
    `,
  ],
})
export class PublicCtaComponent {
  @Input() subdomain = '';
  @Input() contactPhone: string | null | undefined = '';
  @Input() brandColor: string | null | undefined = '#2563eb';
  @Input() theme: WebsitePageTheme | string | null = null;

  resolvedTheme(): WebsitePageTheme {
    if (this.theme === 'commercial' || this.theme === 'premium' || this.theme === 'vibrant') {
      return this.theme;
    }
    if (this.theme === 'comercial') return 'commercial';
    if (this.theme === 'minimal') return 'premium';
    if (this.theme === 'vibrante') return 'vibrant';
    return 'commercial';
  }

  waLink = computed(() => buildWa(this.contactPhone));
}
