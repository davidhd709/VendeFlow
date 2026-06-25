import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { ApiError } from '@core/models/api-error.model';
import { UpdateWebsiteConfig, WebsiteConfig } from '@core/models/website-config.model';
import { FilesService } from '@core/services/files.service';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { ToastService } from '@core/services/toast.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

@Component({
  selector: 'app-admin-website-config',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    LoadingComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  template: `
    <div class="sf-page">
      <app-page-header
        title="Configuración del sitio"
        subtitle="Identidad de marca y datos de contacto globales del sitio web."
      >
        <p-button
          label="Guardar"
          icon="pi pi-save"
          [loading]="saving()"
          (onClick)="save()"
        />
      </app-page-header>

      @if (saveError()) {
        <p-message severity="error" [text]="saveError()!" styleClass="mb-3 w-full" />
      }
      @if (saveOk()) {
        <p-message severity="success" text="Configuración guardada correctamente." styleClass="mb-3 w-full" />
      }

      @if (loading()) {
        <app-loading />
      } @else {
        <div class="sf-stack-lg">

          <app-section-card
            title="Identidad de marca"
            description="Logo y color principal que aparecen en el sitio web."
          >
            <div class="grid-2">

              <div class="sf-field">
                <label>Color principal</label>
                <div class="color-row">
                  <input type="color" [(ngModel)]="cfg.primaryColor" (ngModelChange)="onColorChange()" />
                  <input pInputText [(ngModel)]="cfg.primaryColor" placeholder="#2563eb" maxlength="9" />
                </div>
                <small class="sf-field-help">
                  Se usa en botones, enlaces y elementos de acento del sitio.
                </small>
              </div>

              <div class="sf-field">
                <label>Logo</label>
                <div class="upload-area">
                  @if (cfg.logoUrl) {
                    <div class="logo-preview">
                      <img [src]="cfg.logoUrl" alt="Logo actual" />
                      <button type="button" class="remove-logo" (click)="cfg.logoUrl = ''">
                        <i class="pi pi-times"></i>
                      </button>
                    </div>
                  } @else {
                    <label class="upload-placeholder">
                      <i class="pi pi-image"></i>
                      <span>Subir logo</span>
                      <input type="file" accept="image/*" class="hidden-file" (change)="uploadLogo($event)" />
                    </label>
                  }
                </div>
                <small class="sf-field-help">PNG o SVG con fondo transparente. Aparece en el footer.</small>
              </div>

            </div>
          </app-section-card>

          <app-section-card
            title="Datos de contacto"
            description="Información de contacto visible en el footer y secciones de contacto."
          >
            <div class="grid-3">
              <div class="sf-field">
                <label>Teléfono / WhatsApp</label>
                <input pInputText [(ngModel)]="cfg.contactPhone" placeholder="+57 300 123 4567" />
              </div>
              <div class="sf-field">
                <label>Email</label>
                <input pInputText [(ngModel)]="cfg.contactEmail" placeholder="hola@tu-empresa.com" />
              </div>
              <div class="sf-field">
                <label>Dirección</label>
                <input pInputText [(ngModel)]="cfg.address" placeholder="Calle 123, Ciudad" />
              </div>
            </div>
          </app-section-card>

          <div class="builder-cta">
            <i class="pi pi-pencil-ruler"></i>
            <div>
              <strong>¿Quieres editar el contenido y diseño del sitio?</strong>
              <p>Usa el <a routerLink="/admin/editor-web">Editor web</a> para personalizar las secciones, textos, botones y colores de cada bloque.</p>
            </div>
          </div>

        </div>
      }
    </div>
  `,
  styles: [
    `
      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem 1.5rem;
      }
      .grid-3 {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem 1.25rem;
      }
      @media (max-width: 720px) {
        .grid-2, .grid-3 { grid-template-columns: 1fr; }
      }

      .color-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
      }
      .color-row input[type='color'] {
        flex: 0 0 44px;
        height: 36px;
        border: 1px solid var(--sf-border);
        border-radius: 8px;
        cursor: pointer;
        padding: 2px;
        background: #fff;
      }

      .upload-area { display: flex; flex-direction: column; gap: 0.5rem; }
      .logo-preview {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      .logo-preview img {
        max-height: 64px;
        max-width: 180px;
        border: 1px solid var(--sf-border);
        border-radius: 8px;
        padding: 0.4rem;
        background: var(--sf-surface-2);
        object-fit: contain;
      }
      .remove-logo {
        width: 22px; height: 22px;
        border-radius: 50%;
        border: 1px solid var(--sf-border);
        background: #fff;
        cursor: pointer;
        display: inline-flex; align-items: center; justify-content: center;
        font-size: 0.6rem;
        color: var(--sf-text-muted);
        flex-shrink: 0;
      }
      .remove-logo:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }
      .upload-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        height: 80px;
        width: 180px;
        border: 2px dashed var(--sf-border);
        border-radius: 10px;
        cursor: pointer;
        color: var(--sf-text-muted);
        font-size: 0.82rem;
        transition: border-color 0.15s, background 0.15s;
      }
      .upload-placeholder:hover { border-color: var(--sf-primary); background: var(--sf-primary-soft); }
      .upload-placeholder i { font-size: 1.4rem; }
      .hidden-file { display: none; }

      .builder-cta {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem 1.25rem;
        border: 1px solid var(--sf-border);
        border-radius: 12px;
        background: linear-gradient(145deg, #f8fafc, #eff6ff);
      }
      .builder-cta i {
        font-size: 1.5rem;
        color: var(--sf-primary);
        flex-shrink: 0;
        margin-top: 0.1rem;
      }
      .builder-cta strong { font-size: 0.92rem; }
      .builder-cta p {
        margin: 0.25rem 0 0;
        font-size: 0.84rem;
        color: var(--sf-text-muted);
      }
      .builder-cta a { color: var(--sf-primary); font-weight: 600; }
      .mb-3 { margin-bottom: 1rem; }
      .w-full { width: 100%; }
    `,
  ],
})
export class AdminWebsiteConfigComponent implements OnInit {
  private readonly service = inject(WebsiteConfigService);
  private readonly files = inject(FilesService);
  private readonly toast = inject(ToastService);

  loading   = signal(false);
  saving    = signal(false);
  saveOk    = signal(false);
  saveError = signal<string | null>(null);

  cfg: {
    primaryColor: string;
    logoUrl: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
  } = this.empty();

  ngOnInit(): void {
    this.loading.set(true);
    this.service.getMine().subscribe({
      next: (c) => {
        if (c) this.applyConfig(c);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onColorChange(): void {
    // sincroniza el input hex con el color picker — no hace nada adicional
  }

  private applyConfig(c: WebsiteConfig): void {
    this.cfg = {
      primaryColor: c.primaryColor ?? '#2563eb',
      logoUrl: c.logoUrl ?? '',
      contactPhone: c.contactPhone ?? '',
      contactEmail: c.contactEmail ?? '',
      address: c.address ?? '',
    };
  }

  uploadLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.files.upload(file).subscribe({
      next: (img) => {
        this.cfg.logoUrl = img.url;
        this.toast.success('Logo subido');
      },
      error: (e: ApiError) => this.toast.error(e.userMessage ?? 'No se pudo subir el logo'),
    });
  }

  save(): void {
    this.saving.set(true);
    this.saveOk.set(false);
    this.saveError.set(null);
    const dto: UpdateWebsiteConfig = {
      primaryColor: this.cfg.primaryColor || undefined,
      logoUrl: this.cfg.logoUrl || undefined,
      contactPhone: this.cfg.contactPhone || undefined,
      contactEmail: this.cfg.contactEmail || undefined,
      address: this.cfg.address || undefined,
    };
    this.service.upsert(dto).subscribe({
      next: (c) => {
        this.applyConfig(c);
        this.saving.set(false);
        this.saveOk.set(true);
        this.toast.success('Configuración guardada');
        setTimeout(() => this.saveOk.set(false), 4000);
      },
      error: (e: ApiError) => {
        this.saving.set(false);
        const msg = typeof e.userMessage === 'string'
          ? e.userMessage
          : (e as { message?: string }).message ?? 'No se pudo guardar la configuración';
        this.saveError.set(msg);
        this.toast.error(msg);
      },
    });
  }

  private empty(): typeof this.cfg {
    return { primaryColor: '#2563eb', logoUrl: '', contactPhone: '', contactEmail: '', address: '' };
  }
}
