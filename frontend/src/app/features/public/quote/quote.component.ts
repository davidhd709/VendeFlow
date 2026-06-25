import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { ApiError } from '@core/models/api-error.model';
import { Product, PublicOffice } from '@core/models/catalog.model';
import { WebsiteConfig } from '@core/models/website-config.model';
import { PublicService } from '@core/services/public.service';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { resolvePublicSubdomain } from '@core/utils/public-subdomain.util';
import { buildWa } from '@shared/public/wa-link.util';

@Component({
  selector: 'app-public-quote',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
  ],
  template: `
    <div class="quote-shell" [style.--brand]="brandColor()">
      <div class="bg-orb orb-a"></div>
      <div class="bg-orb orb-b"></div>
    </div>
    <div class="wrap" [style.--brand]="brandColor()">
      <div class="quote-grid">
        <!-- Columna izquierda: bloque comercial -->
        <section class="pitch">
          <span class="eyebrow">Cotización rápida</span>
          <h1>Solicita tu cotización</h1>
          <p class="lead">
            Déjanos tus datos y un asesor de la oficina más cercana te
            contactará por WhatsApp.
          </p>

          <ul class="bullets">
            <li>
              <i class="pi pi-bolt"></i>
              <div>
                <strong>Respuesta rápida</strong>
                <span class="text-muted text-sm"
                  >Te contactamos en menos de una hora hábil.</span
                >
              </div>
            </li>
            <li>
              <i class="pi pi-user"></i>
              <div>
                <strong>Asesoría según presupuesto</strong>
                <span class="text-muted text-sm"
                  >Te ayudamos a elegir el equipo correcto.</span
                >
              </div>
            </li>
            <li>
              <i class="pi pi-shopping-bag"></i>
              <div>
                <strong>Disponibilidad confirmada</strong>
                <span class="text-muted text-sm"
                  >Te confirmamos disponibilidad al momento de asesorarte.</span
                >
              </div>
            </li>
            <li>
              <i class="pi pi-map-marker"></i>
              <div>
                <strong>Atención en oficina</strong>
                <span class="text-muted text-sm"
                  >Visítanos o entrega a domicilio.</span
                >
              </div>
            </li>
          </ul>

          <div class="trust-tags">
            <span><i class="pi pi-shield"></i> Compra con respaldo</span>
            <span><i class="pi pi-clock"></i> Respuesta rápida</span>
            <span><i class="pi pi-headphones"></i> Soporte postventa</span>
          </div>

          @if (config()?.contactPhone || config()?.contactEmail || config()?.address) {
            <div class="contact-card">
              <h3>Contacto directo</h3>
              @if (config()?.contactPhone) {
                <a [href]="waLink()" target="_blank" rel="noopener" class="contact-row wa">
                  <i class="pi pi-whatsapp"></i>
                  <span>{{ config()!.contactPhone }}</span>
                  <span class="text-xs text-muted">WhatsApp</span>
                </a>
              }
              @if (config()?.contactEmail) {
                <div class="contact-row">
                  <i class="pi pi-envelope"></i>
                  <span>{{ config()!.contactEmail }}</span>
                </div>
              }
              @if (config()?.address) {
                <div class="contact-row">
                  <i class="pi pi-map-marker"></i>
                  <span>{{ config()!.address }}</span>
                </div>
              }
            </div>
          }
        </section>

        <!-- Columna derecha: formulario -->
        <section class="form-card">
          @if (!subdomain) {
            <p-message
              severity="error"
              text="No pudimos cargar la información en este momento. Intenta de nuevo o escríbenos por WhatsApp."
            />
          } @else if (offices().length === 0 && !loading()) {
            <div class="empty-offices">
              <div class="empty-icon"><i class="pi pi-store"></i></div>
              <h2>Próximamente disponible</h2>
              <p class="text-muted">
                Esta tienda aún no tiene sedes configuradas para recibir cotizaciones.
                @if (config()?.contactPhone) {
                  Por ahora puedes escribirnos directamente por WhatsApp.
                }
              </p>
              @if (config()?.contactPhone) {
                <a
                  [href]="waLink()"
                  target="_blank"
                  rel="noopener"
                  class="btn btn-wa"
                >
                  <i class="pi pi-whatsapp"></i> Escribir por WhatsApp
                </a>
              }
            </div>
          } @else if (sent()) {
            <div class="success">
              <div class="success-icon"><i class="pi pi-check"></i></div>
              <h2>Solicitud enviada</h2>
              <p class="text-muted">
                Un asesor te contactará pronto por WhatsApp.
              </p>
              @if (config()?.contactPhone) {
                <a
                  [href]="waLink()"
                  target="_blank"
                  rel="noopener"
                  class="btn btn-wa"
                >
                  <i class="pi pi-whatsapp"></i> Escribir por WhatsApp
                </a>
              }
            </div>
          } @else {
            <h2>Cuéntanos qué necesitas</h2>
            <p class="text-muted text-sm">
              Te respondemos por WhatsApp con opciones según tu presupuesto.
            </p>

            <form (ngSubmit)="submit()" novalidate>
              <div class="sf-field">
                <label>Nombre completo</label>
                <input
                  pInputText
                  [(ngModel)]="name"
                  name="name"
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div class="sf-field">
                <label>Teléfono (WhatsApp)</label>
                <input
                  pInputText
                  [(ngModel)]="phone"
                  name="phone"
                  placeholder="+57 300 123 4567"
                  required
                />
              </div>

              <div class="sf-field">
                <label>Email <span class="text-muted">(opcional)</span></label>
                <input
                  pInputText
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>

              <div class="sf-field">
                <label>Oficina más cercana</label>
                <select
                  class="sf-select"
                  [(ngModel)]="officeId"
                  name="officeId"
                  required
                >
                  <option value="">— Selecciona —</option>
                  @for (o of offices(); track o.id) {
                    <option [value]="o.id">
                      {{ o.name }}{{ o.city ? ' · ' + o.city : '' }}
                    </option>
                  }
                </select>
                @if (selectedOffice(); as office) {
                  <div class="office-contact text-xs">
                    @if (office.address) {
                      <span><i class="pi pi-map-marker"></i> {{ office.address }}</span>
                    }
                    @if (office.phone) {
                      <span><i class="pi pi-phone"></i> {{ office.phone }}</span>
                    }
                  </div>
                }
                @if (offices().length === 0) {
                  <small class="text-muted">
                    Contáctanos por WhatsApp y te indicaremos el punto de atención más cercano.
                  </small>
                }
              </div>

              @if (preselectedProduct(); as p) {
                <div class="sf-field">
                  <label>Producto de interés</label>
                  <div class="product-chip">
                    <span class="product-info">
                      <strong>{{ p.name }}</strong>
                      <span class="text-muted text-xs">
                        {{ +p.price | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
                      </span>
                    </span>
                    <button
                      type="button"
                      class="chip-clear"
                      (click)="clearPreselected()"
                      aria-label="Quitar"
                    >
                      <i class="pi pi-times"></i>
                    </button>
                  </div>
                </div>
              }

              <div class="sf-field">
                <label>
                  Presupuesto aproximado
                  <span class="text-muted">(opcional)</span>
                </label>
                <input
                  pInputText
                  [(ngModel)]="budget"
                  name="budget"
                  placeholder="$1.500.000"
                />
              </div>

              <div class="sf-field">
                <label>
                  ¿Algo más que debamos saber?
                  <span class="text-muted">(opcional)</span>
                </label>
                <textarea
                  pTextarea
                  rows="3"
                  [(ngModel)]="notes"
                  name="notes"
                  placeholder="Modelo, marca preferida, condición..."
                ></textarea>
              </div>

              @if (error()) {
                <p-message
                  severity="error"
                  [text]="error()!"
                  styleClass="w-full"
                />
              }

              <p-button
                type="submit"
                label="Enviar solicitud"
                icon="pi pi-send"
                [loading]="loading()"
                styleClass="w-full mt-2"
              />

              <p class="form-foot text-muted text-xs">
                Al enviar aceptas que te contactemos por WhatsApp con tu
                cotización.
              </p>
            </form>
          }
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .quote-shell {
        position: relative;
        height: 0;
      }
      .bg-orb {
        position: absolute;
        border-radius: 999px;
        pointer-events: none;
        z-index: 0;
      }
      .orb-a {
        width: 340px;
        height: 340px;
        right: 2%;
        top: -80px;
        background: radial-gradient(circle, color-mix(in srgb, var(--brand, #2563eb) 18%, transparent), transparent 65%);
      }
      .orb-b {
        width: 300px;
        height: 300px;
        left: -80px;
        top: 220px;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.15), transparent 65%);
      }
      .wrap {
        max-width: 1180px;
        margin: 0 auto;
        padding: 3rem 1.25rem 4rem;
        position: relative;
        z-index: 1;
      }
      .quote-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2.5rem;
        align-items: start;
      }
      @media (max-width: 880px) {
        .quote-grid { grid-template-columns: 1fr; gap: 2rem; }
      }
      .pitch { display: flex; flex-direction: column; gap: 1rem; }
      .eyebrow {
        display: inline-block;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.12em;
        color: var(--brand, var(--sf-primary));
      }
      .pitch h1 {
        font-size: clamp(1.75rem, 3vw, 2.5rem);
        letter-spacing: -0.02em;
        margin: 0;
      }
      .lead {
        font-size: 1.05rem;
        color: var(--sf-text-muted);
        max-width: 50ch;
        line-height: 1.55;
      }
      .bullets {
        list-style: none;
        padding: 0;
        margin: 0.5rem 0 0;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .bullets li {
        display: grid;
        grid-template-columns: 28px 1fr;
        gap: 0.6rem;
        align-items: flex-start;
      }
      .bullets i {
        width: 28px;
        height: 28px;
        border-radius: 9px;
        background: var(--sf-primary-soft);
        color: var(--sf-primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
      }
      .bullets div { display: flex; flex-direction: column; line-height: 1.4; }
      .bullets strong { font-weight: 600; }
      .trust-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.45rem;
      }
      .trust-tags span {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 999px;
        padding: 0.34rem 0.62rem;
        font-size: 0.78rem;
        color: #334155;
        font-weight: 600;
      }
      .trust-tags i { color: var(--brand, var(--sf-primary)); }

      .contact-card {
        margin-top: 0.5rem;
        background: var(--sf-surface);
        border: 1px solid var(--sf-border);
        border-radius: 14px;
        padding: 1.1rem;
      }
      .contact-card h3 { margin: 0 0 0.6rem; font-size: 0.85rem; }
      .contact-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.4rem 0;
        color: var(--sf-text);
        font-size: 0.92rem;
      }
      .contact-row + .contact-row { border-top: 1px solid var(--sf-border); }
      .contact-row i { width: 18px; color: var(--sf-text-muted); }
      .contact-row.wa i { color: #25d366; }
      .contact-row a, a.contact-row { text-decoration: none; color: var(--sf-text); }
      .contact-row .text-xs { margin-left: auto; }

      .form-card {
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 18px;
        box-shadow: var(--sf-shadow-lg);
        padding: 1.75rem;
        position: sticky;
        top: 90px;
      }
      .form-card h2 { margin: 0; font-size: 1.35rem; }
      form { display: flex; flex-direction: column; gap: 0.85rem; margin-top: 0.85rem; }
      .form-foot { text-align: center; margin-top: 0.25rem; }

      .product-chip {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        background: var(--sf-primary-soft);
        border: 1px solid rgba(37, 99, 235, 0.25);
        color: var(--sf-text);
        padding: 0.45rem 0.7rem;
        border-radius: 10px;
      }
      .product-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
      .chip-clear {
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--sf-text-muted);
        width: 22px;
        height: 22px;
        border-radius: 6px;
      }
      .chip-clear:hover { background: rgba(0, 0, 0, 0.06); color: var(--sf-text); }
      .office-contact {
        margin-top: 0.4rem;
        display: grid;
        gap: 0.25rem;
        color: var(--sf-text-muted);
      }
      .office-contact span {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
      }

      .empty-offices { text-align: center; padding: 1rem 0 0.5rem; }
      .empty-icon {
        width: 56px; height: 56px;
        border-radius: 50%;
        background: var(--sf-surface-2, #f1f5f9);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 1rem;
      }
      .empty-icon i { font-size: 1.5rem; color: var(--sf-text-muted, #64748b); }
      .empty-offices h2 { margin: 0 0 0.5rem; font-size: 1.1rem; }
      .empty-offices p { font-size: 0.88rem; max-width: 280px; margin: 0 auto 1.25rem; }

      .success { text-align: center; padding: 1rem 0 0.5rem; }
      .success-icon {
        width: 64px;
        height: 64px;
        border-radius: 18px;
        background: var(--sf-success-soft);
        color: var(--sf-success);
        font-size: 1.8rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0.75rem;
      }
      .success h2 { margin: 0; }
      .success .btn { margin-top: 1.25rem; }
      .btn-wa {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.65rem 1rem;
        border-radius: 12px;
        background: #25d366;
        color: #fff;
        font-weight: 700;
        text-decoration: none;
      }
      .btn-wa:hover { text-decoration: none; filter: brightness(0.97); }

      .w-full { width: 100%; }
      .mt-2 { margin-top: 0.5rem; }
      @media (max-width: 880px) {
        .wrap {
          padding: 2.2rem 1rem 3rem;
        }
        .form-card {
          position: static;
          top: auto;
        }
      }
      @media (max-width: 430px) {
        .form-card {
          padding: 1.15rem;
          border-radius: 14px;
        }
        .pitch h1 {
          font-size: clamp(1.55rem, 8vw, 1.95rem);
        }
        .lead {
          font-size: 0.98rem;
        }
        .trust-tags span {
          font-size: 0.74rem;
        }
      }
    `,
  ],
})
export class PublicQuoteComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly publicService = inject(PublicService);
  private readonly configService = inject(WebsiteConfigService);
  private readonly hostname = globalThis.location?.hostname ?? '';

  offices = signal<PublicOffice[]>([]);
  config = signal<WebsiteConfig | null>(null);
  preselectedProduct = signal<Product | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);
  sent = signal(false);
  subdomain = '';

  name = '';
  phone = '';
  email = '';
  officeId = '';
  notes = '';
  budget = '';
  productIdQuery = '';

  brandColor = computed(() => this.config()?.primaryColor || '#2563eb');
  selectedOffice = computed(() =>
    this.offices().find((office) => office.id === this.officeId) ?? null,
  );

  waLink = computed(() =>
    buildWa(this.config()?.contactPhone, 'Hola, quisiera una cotización.'),
  );

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap;
    this.subdomain = resolvePublicSubdomain(q.get('sub'), this.hostname);
    this.officeId = q.get('office') ?? '';
    this.productIdQuery = q.get('product') ?? '';
    if (!this.subdomain) return;

    this.configService.getPublic(this.subdomain).subscribe({
      next: (c) => this.config.set(c),
      error: () => this.config.set(null),
    });

    this.loading.set(true);
    this.publicService.getOffices(this.subdomain).subscribe({
      next: (offices) => { this.offices.set(offices); this.loading.set(false); },
      error: () => { this.offices.set([]); this.loading.set(false); },
    });

    if (this.productIdQuery) {
      // Buscamos el producto en el catálogo paginado (suficiente para MVP).
      this.publicService.getProducts(this.subdomain).subscribe({
        next: (res) => {
          const p = res.items.find((x) => x.id === this.productIdQuery);
          if (p) this.preselectedProduct.set(p);
        },
        error: () => undefined,
      });
    }
  }

  clearPreselected(): void {
    this.preselectedProduct.set(null);
    this.productIdQuery = '';
  }

  submit(): void {
    if (!this.name || !this.phone || !this.officeId) {
      this.error.set('Completa nombre, teléfono y oficina.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    const combinedNotes = [
      this.notes,
      this.budget ? `Presupuesto: ${this.budget}` : '',
      this.preselectedProduct()
        ? `Producto: ${this.preselectedProduct()!.name}`
        : '',
    ]
      .filter(Boolean)
      .join(' | ');

    this.publicService
      .createLead({
        subdomain: this.subdomain,
        officeId: this.officeId,
        name: this.name,
        phone: this.phone,
        email: this.email || undefined,
        notes: combinedNotes || undefined,
        productIds: this.preselectedProduct()
          ? [this.preselectedProduct()!.id]
          : undefined,
      })
      .subscribe({
        next: () => {
          this.sent.set(true);
          this.loading.set(false);
        },
        error: (e: ApiError) => {
          this.error.set(e.userMessage ?? 'No se pudo enviar la solicitud');
          this.loading.set(false);
        },
      });
  }
}
