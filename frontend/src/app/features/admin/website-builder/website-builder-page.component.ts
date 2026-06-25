import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, groupBy, mergeMap, switchMap } from 'rxjs/operators';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmationService } from 'primeng/api';
import { ApiError } from '@core/models/api-error.model';
import {
  ButtonStyle,
  CardStyle,
  HeroData,
  ImageStyle,
  SectionStyle,
  SECTION_TYPE_LABELS,
  TextStyle,
  WebsitePage,
  WebsiteSection,
  WebsiteSectionType,
} from '@core/models/website-builder.model';
import { WebsiteBuilderService } from '@core/services/website-builder.service';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { ToastService } from '@core/services/toast.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { SectionEditorComponent } from './section-editor.component';
import { SectionListComponent } from './section-list.component';
import { SectionPreviewItemComponent } from './section-preview-item.component';
import { TextElementEditorComponent } from './editors/text-element-editor.component';
import { ElementStyleEditorComponent } from './editors/element-style-editor.component';

interface SaveEvent {
  id: string;
  type: WebsiteSectionType;
  data: Record<string, unknown>;
}

type PageTheme = NonNullable<HeroData['theme']>;

const PAGE_THEME_OPTIONS: Array<{ value: PageTheme; label: string; hint: string }> = [
  {
    value: 'commercial',
    label: 'Moderno comercial',
    hint: 'Diseño limpio y directo para vender celulares con confianza.',
  },
  {
    value: 'premium',
    label: 'Premium elegante',
    hint: 'Diseño sobrio para tiendas con productos de gama alta.',
  },
  {
    value: 'vibrant',
    label: 'Promocional vibrante',
    hint: 'Diseño llamativo para ofertas, campañas y ventas rápidas.',
  },
];

/**
 * Orquestador del Website Builder admin (F2).
 *
 * Layout de 3 columnas:
 *   [ secciones ] [ preview central ] [ editor seleccionado ]
 *
 * - Carga la página `home` (creada lazy por el backend si no existe).
 * - Auto-save debounced (600ms por sección) en `data`.
 * - Visibilidad / orden / agregar / eliminar van inmediatos.
 * - Botón "Publicar" toma snapshot del estado actual visible.
 */
@Component({
  selector: 'app-admin-website-builder',
  standalone: true,
  imports: [
    ButtonModule,
    TagModule,
    LoadingComponent,
    SectionListComponent,
    SectionEditorComponent,
    SectionPreviewItemComponent,
    TextElementEditorComponent,
    ElementStyleEditorComponent,
  ],
  template: `
    <div class="sf-page builder">
      @if (page(); as p) {
        <header class="builder-topbar" [attr.data-page-id]="p.id">
          <div class="topbar-main">
            <span class="eyebrow">Editor del sitio</span>
            <h1>{{ pageTitle() }}</h1>
            <p class="meta-line">
              Estado: <strong>{{ statusLabel() }}</strong>
              <span class="dot">•</span>
              Última actualización: {{ lastUpdatedLabel() }}
            </p>
          </div>

          <div class="topbar-side">
            <div class="theme-picker">
              <label>Tema de la página</label>
              <div class="theme-chips" [class.disabled]="!hasHeroSection()">
                @for (opt of pageThemeOptions; track opt.value) {
                  <button
                    type="button"
                    class="theme-chip"
                    [class.active]="selectedPageTheme() === opt.value"
                    [disabled]="!hasHeroSection()"
                    (click)="onThemeChip(opt.value)"
                    [title]="opt.hint"
                  >{{ opt.label }}</button>
                }
              </div>
              <small>
                @if (hasHeroSection()) {
                  {{ currentThemeHint() }}
                } @else {
                  Agrega un bloque Hero para seleccionar el diseño general del sitio.
                }
              </small>
            </div>

            <div class="status">
              @if (p.status === 'PUBLISHED') {
                <p-tag severity="success" value="Publicado" icon="pi pi-check-circle" />
              } @else {
                <p-tag severity="warn" value="Borrador" icon="pi pi-pencil" />
              }
              <span class="saving-chip" [class.show]="isSaving()">
                <i class="pi pi-spin pi-spinner"></i> Guardando borrador
              </span>
              <span class="saving-chip ok" [class.show]="justSaved()">
                <i class="pi pi-check"></i> Borrador guardado
              </span>
            </div>

            <div class="topbar-actions">
              <p-button
                label="Guardar borrador"
                icon="pi pi-save"
                severity="secondary"
                [outlined]="true"
                [disabled]="!selectedSection()"
                [loading]="isSaving()"
                (onClick)="saveDraft()"
              />
              <p-button
                label="Vista previa"
                icon="pi pi-external-link"
                severity="secondary"
                [outlined]="true"
                (onClick)="openPreview()"
              />
              <p-button
                label="Publicar cambios"
                icon="pi pi-cloud-upload"
                [loading]="publishing()"
                (onClick)="publish()"
              />
            </div>
          </div>
        </header>
      }

      @if (previewOpen()) {
        <div class="draft-preview-overlay" role="dialog" aria-modal="true" aria-label="Vista previa del borrador">
          <div class="draft-preview-bar">
            <div class="draft-preview-bar-left">
              <span class="draft-badge"><i class="pi pi-eye"></i> Vista previa — Borrador</span>
              <span class="text-muted text-xs">Los visitantes ven la versión publicada, no esta.</span>
            </div>
            <button type="button" class="close-preview-btn" (click)="closePreview()">
              <i class="pi pi-times"></i> Cerrar vista previa
            </button>
          </div>
          <div class="draft-preview-canvas preview-theme-shell" [attr.data-theme]="selectedPageTheme()"
               [style.--sf-primary]="primaryColor()">
            @for (s of visibleSections(); track s.id) {
              <app-section-preview-item
                [section]="s"
                [theme]="selectedPageTheme()"
                [primaryColor]="primaryColor()"
                [logoUrl]="logoUrl()"
                [companyName]="companyName()"
              />
            }
            @if (visibleSections().length === 0) {
              <div class="empty-canvas">
                <i class="pi pi-eye-slash"></i>
                <h3>No hay secciones visibles en el borrador.</h3>
                <p>Activa al menos una sección para verla aquí.</p>
              </div>
            }
          </div>
        </div>
      }

      @if (loading()) {
        <app-loading />
      } @else {
        @if (page(); as p) {
          <div class="layout" [attr.data-page-id]="p.id">
            <aside class="col left">
              <app-section-list
                [sections]="sections()"
                [selectedId]="selectedId()"
                (select)="selectedId.set($event); selectedTextKey.set(null)"
                (move)="onMove($event)"
                (reorder)="onReorder($event)"
                (toggle)="onToggleVisible($event)"
                (remove)="onRemove($event)"
                (add)="onAdd($event)"
              />
            </aside>

            <section class="col center" aria-label="Vista previa">
              <div class="panel-head">
                <h2>Vista previa del sitio</h2>
                <p>Así verán tu página los visitantes.</p>
              </div>
              <div class="preview-frame">
                <div class="preview-bar">
                  <span class="dot red"></span>
                  <span class="dot yellow"></span>
                  <span class="dot green"></span>
                  <span class="url text-muted text-xs">
                    {{ p.slug }}.tu-sitio.com
                  </span>
                  <span class="theme-pill" [attr.data-theme]="selectedPageTheme()">
                    {{ currentThemeLabel() }}
                  </span>
                </div>
                <div class="preview-canvas">
                  <div class="preview-theme-shell" [attr.data-theme]="selectedPageTheme()"
                       [style.--sf-primary]="primaryColor()">
                  @for (s of visibleSections(); track s.id) {
                    <div
                      class="preview-section"
                      [class.active]="s.id === selectedId()"
                      (click)="onSectionClick($event, s.id)"
                    >
                      <app-section-preview-item
                        [section]="s"
                        [theme]="selectedPageTheme()"
                        [primaryColor]="primaryColor()"
                        [logoUrl]="logoUrl()"
                        [companyName]="companyName()"
                        [activeTextKey]="s.id === selectedId() ? selectedTextKey() : null"
                        (textSelect)="onTextSelect($event, s.id)"
                      />
                    </div>
                  }
                  @if (visibleSections().length === 0) {
                    <div class="empty-canvas">
                      <i class="pi pi-plus-circle"></i>
                      <h3>Agrega una sección para comenzar a construir tu página.</h3>
                      <p>Puedes activarla, editarla y publicarla cuando esté lista.</p>
                    </div>
                  }
                  </div>
                </div>
              </div>
            </section>

            <aside class="col right">
              @if (selectedTextKey(); as key) {
                @if (isTextKey(key)) {
                  <app-text-element-editor
                    [textKey]="key"
                    [textStyle]="selectedTextStyle()"
                    (textStyleChange)="onTextStyleChange($event)"
                    (close)="selectedTextKey.set(null)"
                  />
                } @else {
                  <app-element-style-editor
                    [elementKey]="key"
                    [buttonStyle]="selectedButtonStyle()"
                    [cardStyle]="selectedCardStyle()"
                    [imageStyle]="selectedImageStyle()"
                    (buttonStyleChange)="onButtonStyleChange($event)"
                    (cardStyleChange)="onCardStyleChange($event)"
                    (imageStyleChange)="onImageStyleChange($event)"
                    (close)="selectedTextKey.set(null)"
                  />
                }
              } @else {
                <app-section-editor
                  [section]="selectedSection()"
                  (dataChange)="onDataChange($any($event))"
                />
              }
            </aside>
          </div>
        } @else {
          <p class="text-muted">No se pudo cargar la página. Recarga la pestaña.</p>
        }
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .builder { max-width: 100%; }
      .builder-topbar {
        border: 1px solid var(--sf-border);
        border-radius: 16px;
        margin-bottom: 1rem;
        padding: 1rem;
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
        background:
          radial-gradient(circle at 100% 0%, rgba(37, 99, 235, 0.09), transparent 45%),
          linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
      }
      .topbar-main h1 {
        margin: 0.15rem 0 0.35rem;
        font-size: 1.35rem;
        letter-spacing: -0.02em;
      }
      .eyebrow {
        display: inline-block;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--sf-primary);
      }
      .meta-line {
        margin: 0;
        font-size: 0.85rem;
        color: var(--sf-text-muted);
      }
      .meta-line .dot { margin: 0 0.35rem; }
      .topbar-side {
        display: grid;
        gap: 0.6rem;
        justify-items: end;
      }
      .theme-picker {
        width: min(360px, 100%);
        display: grid;
        gap: 0.35rem;
        justify-items: start;
      }
      .theme-picker label {
        margin: 0;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--sf-text-muted);
      }
      .theme-chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
      }
      .theme-chips.disabled { opacity: 0.5; pointer-events: none; }
      .theme-chip {
        padding: 0.35rem 0.75rem;
        border: 1.5px solid var(--sf-border);
        border-radius: 999px;
        background: #fff;
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--sf-text);
        cursor: pointer;
        transition: border-color 0.15s, background 0.15s, color 0.15s;
        white-space: nowrap;
      }
      .theme-chip:hover:not(:disabled) {
        border-color: var(--sf-primary);
        color: var(--sf-primary);
      }
      .theme-chip.active {
        border-color: var(--sf-primary);
        background: var(--sf-primary);
        color: #fff;
        font-weight: 600;
      }
      .theme-picker small {
        color: var(--sf-text-muted);
        font-size: 0.76rem;
        line-height: 1.3;
      }
      .topbar-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 0.5rem;
      }
      @media (max-width: 980px) {
        .builder-topbar {
          flex-direction: column;
          align-items: stretch;
        }
        .topbar-side,
        .topbar-actions {
          justify-items: start;
          justify-content: flex-start;
        }
      }

      .status {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
      }
      .saving-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        color: var(--sf-text-muted);
        background: var(--sf-surface);
        padding: 0.3rem 0.6rem;
        border-radius: 999px;
        border: 1px solid var(--sf-border);
        opacity: 0;
        transform: translateY(2px);
        transition: opacity 0.2s var(--sf-ease), transform 0.2s var(--sf-ease);
      }
      .saving-chip.show { opacity: 1; transform: translateY(0); }
      .saving-chip.ok { color: var(--sf-success); }

      .layout {
        display: grid;
        grid-template-columns: 280px 1fr 360px;
        gap: 1rem;
        align-items: start;
      }
      @media (max-width: 1180px) {
        .layout { grid-template-columns: 240px 1fr 320px; }
      }
      @media (max-width: 920px) {
        .layout { grid-template-columns: 1fr; }
      }

      .col {
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 14px;
        padding: 1rem;
        min-height: 60vh;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04);
      }
      .col.left { position: sticky; top: 5rem; max-height: calc(100vh - 6rem); overflow: auto; }
      .col.right { position: sticky; top: 5rem; max-height: calc(100vh - 6rem); overflow: auto; }
      @media (max-width: 920px) {
        .col.left, .col.right { position: static; max-height: none; }
      }

      .panel-head {
        margin-bottom: 0.75rem;
      }
      .panel-head h2 {
        margin: 0;
        font-size: 1rem;
        letter-spacing: -0.01em;
      }
      .panel-head p {
        margin: 0.2rem 0 0;
        font-size: 0.82rem;
        color: var(--sf-text-muted);
      }

      .preview-frame {
        background: var(--sf-surface-2);
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--sf-border);
      }
      .preview-bar {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.5rem 0.85rem;
        background: var(--sf-surface);
        border-bottom: 1px solid var(--sf-border);
      }
      .dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--sf-border-strong);
      }
      .dot.red { background: #f87171; }
      .dot.yellow { background: #facc15; }
      .dot.green { background: #4ade80; }
      .url { margin-left: 0.5rem; }
      .theme-pill {
        margin-left: auto;
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.2rem 0.5rem;
        border-radius: 999px;
        border: 1px solid var(--sf-border);
        background: #fff;
        color: var(--sf-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }
      .theme-pill[data-theme='premium'] {
        background: #1f2937;
        border-color: #374151;
        color: #f9fafb;
      }
      .theme-pill[data-theme='vibrant'] {
        background: #e0f2fe;
        border-color: #7dd3fc;
        color: #0369a1;
      }

      .preview-canvas {
        background: #fff;
        min-height: 60vh;
        max-height: calc(100vh - 6rem);
        overflow: auto;
      }
      .preview-theme-shell {
        min-height: 100%;
        padding-bottom: 0.75rem;
      }
      .preview-theme-shell[data-theme='commercial'] {
        --sf-primary: #1d4ed8;
        --sf-text: #0f172a;
        --sf-text-muted: #475569;
        --sf-border: #dbe3ef;
        background: linear-gradient(180deg, #f8fbff 0%, #ffffff 55%);
        font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      }
      .preview-theme-shell[data-theme='premium'] {
        --sf-primary: #d1b479;
        --sf-text: #f9fafb;
        --sf-text-muted: #d1d5db;
        --sf-border: #374151;
        background: linear-gradient(170deg, #111827 0%, #0f172a 65%);
        font-family: 'Georgia', 'Times New Roman', serif;
      }
      .preview-theme-shell[data-theme='vibrant'] {
        --sf-primary: #4f46e5;
        --sf-text: #1e1b4b;
        --sf-text-muted: #4338ca;
        --sf-border: #c4b5fd;
        background:
          radial-gradient(circle at 90% 5%, rgba(124, 58, 237, 0.12), transparent 40%),
          radial-gradient(circle at 8% 30%, rgba(37, 99, 235, 0.1), transparent 38%),
          linear-gradient(180deg, #f5f3ff 0%, #ffffff 55%);
        font-family: 'Trebuchet MS', 'Segoe UI', sans-serif;
      }
      .preview-section {
        position: relative;
        outline: 2px solid transparent;
        outline-offset: -2px;
        transition: outline-color 0.15s var(--sf-ease);
        cursor: pointer;
      }
      .preview-section:hover { outline-color: rgba(37, 99, 235, 0.25); }
      .preview-section.active { outline-color: var(--sf-primary); }
      .preview-theme-shell[data-theme='premium'] .preview-section {
        filter: saturate(0.8) contrast(1.04);
        border-bottom: 1px solid #334155;
        margin: 0;
      }
      .preview-theme-shell[data-theme='premium'] .preview-section.active {
        outline-color: #d1b479;
      }
      .preview-theme-shell[data-theme='vibrant'] .preview-section {
        margin: 0.75rem 0.7rem;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 14px 34px rgba(79, 70, 229, 0.12);
      }
      .preview-theme-shell[data-theme='vibrant'] .preview-section.active {
        outline-color: #4f46e5;
      }

      .draft-preview-overlay {
        position: fixed;
        inset: 0;
        z-index: 9000;
        display: flex;
        flex-direction: column;
        background: #fff;
        overflow: hidden;
      }
      .draft-preview-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.65rem 1.25rem;
        background: #1e293b;
        color: #f8fafc;
        flex-shrink: 0;
        border-bottom: 2px solid #f59e0b;
      }
      .draft-preview-bar-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .draft-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        background: #f59e0b;
        color: #1c1917;
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
      }
      .draft-preview-bar .text-muted { color: #94a3b8; }
      .close-preview-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.82rem;
        font-weight: 600;
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        color: #f8fafc;
        padding: 0.4rem 0.85rem;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.15s;
      }
      .close-preview-btn:hover { background: rgba(255,255,255,0.2); }
      .draft-preview-canvas {
        flex: 1;
        overflow-y: auto;
        padding-bottom: 2rem;
      }
      /* Los temas del overlay reutilizan .preview-theme-shell[data-theme='...'] ya definido arriba */
      .empty-canvas {
        padding: 3rem 1rem;
        text-align: center;
        color: var(--sf-text-muted);
      }
      .empty-canvas i {
        font-size: 2rem;
        color: var(--sf-primary);
        margin-bottom: 0.5rem;
      }
      .empty-canvas h3 {
        margin: 0.25rem 0 0.5rem;
        font-size: 1rem;
        color: var(--sf-text);
      }
      .empty-canvas p {
        margin: 0;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class WebsiteBuilderPageComponent implements OnInit, OnDestroy {
  private readonly builder = inject(WebsiteBuilderService);
  private readonly websiteConfig = inject(WebsiteConfigService);
  private readonly toast = inject(ToastService);
  private readonly confirmation = inject(ConfirmationService);

  loading = signal(true);
  publishing = signal(false);
  isSaving = signal(false);
  justSaved = signal(false);
  previewOpen = signal(false);

  page = signal<WebsitePage | null>(null);
  selectedId = signal<string | null>(null);
  primaryColor = signal('#2563eb');
  logoUrl = signal('');
  companyName = signal('');
  private localVariants = signal<Record<string, string>>({});
  pageThemeOptions = PAGE_THEME_OPTIONS;

  selectedTextKey = signal<string | null>(null);

  sections = computed(() => this.page()?.sections ?? []);
  visibleSections = computed(() => this.sections().filter((s) => s.visible));
  selectedSection = computed<WebsiteSection | null>(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.sections().find((s) => s.id === id) ?? null;
  });
  selectedPageTheme = computed<PageTheme>(() => this.extractThemeFromSections(this.sections()));

  selectedTextStyle = computed<TextStyle>(() => {
    const key = this.selectedTextKey();
    const sec = this.selectedSection();
    if (!key || !sec) return {};
    const style = (sec.data as { style?: SectionStyle })?.style ?? {};
    return (style as Record<string, TextStyle>)[key] ?? {};
  });

  selectedButtonStyle = computed<ButtonStyle>(() => {
    const key = this.selectedTextKey();
    const sec = this.selectedSection();
    if (!sec) return {};
    const style = (sec.data as { style?: SectionStyle })?.style ?? {};
    if (key === 'primary-btn')   return style.primaryBtn   ?? {};
    if (key === 'secondary-btn') return style.secondaryBtn ?? {};
    return {};
  });

  selectedCardStyle = computed<CardStyle>(() => {
    const sec = this.selectedSection();
    if (!sec || this.selectedTextKey() !== 'card') return {};
    const style = (sec.data as { style?: SectionStyle })?.style ?? {};
    return style.card ?? {};
  });

  selectedImageStyle = computed<ImageStyle>(() => {
    const sec = this.selectedSection();
    if (!sec || this.selectedTextKey() !== 'image') return {};
    const style = (sec.data as { style?: SectionStyle })?.style ?? {};
    return style.image ?? {};
  });

  textElementLabel = computed<string>(() => {
    const labels: Record<string, string> = {
      title: 'Título', subtitle: 'Subtítulo', eyebrow: 'Texto superior', body: 'Párrafo / cuerpo',
    };
    return labels[this.selectedTextKey() ?? ''] ?? (this.selectedTextKey() ?? '');
  });

  // Auto-save: cada sección tiene su propio debounce de 600ms.
  // Si llegan dos cambios para la misma sección, solo se manda el último.
  private readonly saveStream = new Subject<SaveEvent>();
  private saveSub?: Subscription;
  private justSavedTimer?: ReturnType<typeof setTimeout>;
  private readonly dateFormatter = new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  ngOnInit(): void {
    // Carga el color/nombre de la empresa para el preview (no bloquea).
    this.websiteConfig.getMine().subscribe({
      next: (c) => {
        if (c?.primaryColor) this.primaryColor.set(c.primaryColor);
        if (c?.logoUrl) this.logoUrl.set(c.logoUrl);
      },
      error: () => {
        /* sigue con defaults */
      },
    });

    this.loadHome();
    this.setupAutoSave();
  }

  ngOnDestroy(): void {
    this.saveSub?.unsubscribe();
    if (this.justSavedTimer) clearTimeout(this.justSavedTimer);
  }

  pageTitle(): string {
    const p = this.page();
    if (!p) return 'Editor del sitio';
    return p.title?.trim().length ? p.title : 'Página principal';
  }

  statusLabel(): string {
    return this.page()?.status === 'PUBLISHED' ? 'Publicado' : 'Borrador';
  }

  lastUpdatedLabel(): string {
    const p = this.page();
    if (!p) return 'Sin información';
    const dates = [p.updatedAt, ...(p.sections ?? []).map((s) => s.updatedAt)].filter(Boolean);
    if (!dates.length) return 'Sin cambios recientes';
    const latestIso = dates.reduce((latest, current) =>
      new Date(current).getTime() > new Date(latest).getTime() ? current : latest,
    );
    return this.dateFormatter.format(new Date(latestIso));
  }

  hasHeroSection(): boolean {
    return !!this.heroSection();
  }

  currentThemeHint(): string {
    return (
      this.pageThemeOptions.find((opt) => opt.value === this.selectedPageTheme())?.hint ??
      this.pageThemeOptions[0].hint
    );
  }

  currentThemeLabel(): string {
    return (
      this.pageThemeOptions.find((opt) => opt.value === this.selectedPageTheme())?.label ??
      this.pageThemeOptions[0].label
    );
  }

  onThemeChange(rawTheme: string): void {
    const hero = this.heroSection();
    if (!hero) {
      this.toast.info('Agrega primero una sección Hero para elegir el tema.');
      return;
    }
    const theme = this.normalizeTheme(rawTheme);
    const nextData: Record<string, unknown> = {
      ...(hero.data ?? {}),
      theme,
    };
    this.applySectionUpdate({ ...hero, data: nextData });
    this.saveStream.next({ id: hero.id, type: hero.type, data: nextData });
  }

  onThemeSelect(event: Event): void {
    const target = event.target as HTMLSelectElement | null;
    this.onThemeChange(target?.value ?? 'commercial');
  }

  onThemeChip(value: PageTheme): void {
    this.onThemeChange(value);
  }

  // ─── Load ───────────────────────────────────────────────────────

  private loadHome(): void {
    this.loading.set(true);
    this.builder.listPages().subscribe({
      next: (pages) => {
        const home = pages.find((p) => p.slug === 'home') ?? pages[0];
        if (!home) {
          this.loading.set(false);
          this.toast.error('No se encontró la página principal');
          return;
        }
        this.builder.getPage(home.id).subscribe({
          next: (full) => {
            this.page.set(full);
            // Selecciona la primera sección por defecto.
            const first = full.sections?.[0];
            if (first) this.selectedId.set(first.id);
            this.loading.set(false);
          },
          error: (e: ApiError) => {
            this.loading.set(false);
            this.toast.error(e.userMessage ?? 'No se pudo cargar la página');
          },
        });
      },
      error: (e: ApiError) => {
        this.loading.set(false);
        this.toast.error(e.userMessage ?? 'No se pudo cargar el editor');
      },
    });
  }

  // ─── Auto-save ──────────────────────────────────────────────────

  private setupAutoSave(): void {
    this.saveSub = this.saveStream
      .pipe(
        // un debounce independiente por id, manteniendo solo el último cambio
        groupBy((ev) => ev.id),
        mergeMap((group$) =>
          group$.pipe(
            debounceTime(600),
            switchMap((ev) => {
              this.isSaving.set(true);
              return this.builder.updateSection(ev.id, {
                data: this.sanitizeSectionData(ev.type, ev.data),
              });
            }),
          ),
        ),
      )
      .subscribe({
        next: (updated) => {
          this.applySectionUpdate(updated);
          this.isSaving.set(false);
          this.flashSaved();
        },
        error: (e: ApiError) => {
          this.isSaving.set(false);
          this.toast.error(this.friendlyBuilderError(e));
        },
      });
  }

  private flashSaved(): void {
    this.justSaved.set(true);
    if (this.justSavedTimer) clearTimeout(this.justSavedTimer);
    this.justSavedTimer = setTimeout(() => this.justSaved.set(false), 1500);
  }

  private applySectionUpdate(updated: WebsiteSection): void {
    const p = this.page();
    if (!p?.sections) return;
    const idx = p.sections.findIndex((s) => s.id === updated.id);
    if (idx === -1) return;
    const localVariant = this.localVariants()[updated.id];
    const mergedData = localVariant
      ? { ...(updated.data ?? {}), variant: localVariant }
      : updated.data;
    const next = [...p.sections];
    next[idx] = { ...updated, data: mergedData };
    this.page.set({ ...p, sections: next });
  }

  // ─── Eventos del editor ─────────────────────────────────────────

  onDataChange(data: Record<string, unknown>): void {
    const sec = this.selectedSection();
    if (!sec) return;
    const payload =
      sec.type === 'HERO' && typeof data['theme'] !== 'string'
        ? {
            ...(data ?? {}),
            theme:
              typeof sec.data?.['theme'] === 'string'
                ? sec.data['theme']
                : this.selectedPageTheme(),
          }
        : data;
    const maybeVariant = payload['variant'];
    if (typeof maybeVariant === 'string' && maybeVariant.trim().length > 0) {
      this.localVariants.update((current) => ({
        ...current,
        [sec.id]: maybeVariant,
      }));
    }
    // Actualización optimista local para que el preview reaccione al instante.
    const p = this.page();
    if (p?.sections) {
      const idx = p.sections.findIndex((s) => s.id === sec.id);
      if (idx !== -1) {
        const next = [...p.sections];
        next[idx] = { ...next[idx], data: payload };
        this.page.set({ ...p, sections: next });
      }
    }
    this.saveStream.next({ id: sec.id, type: sec.type, data: payload });
  }

  isTextKey(key: string): boolean {
    return key === 'title' || key === 'subtitle' || key === 'eyebrow' || key === 'body';
  }

  onSectionClick(event: MouseEvent, sectionId: string): void {
    this.selectedId.set(sectionId);
    const target = event.target as Element | null;
    if (!target?.closest('[data-sf-key]')) {
      this.selectedTextKey.set(null);
    }
  }

  onTextSelect(key: string, sectionId: string): void {
    this.selectedId.set(sectionId);
    this.selectedTextKey.set(key);
  }

  onTextStyleChange(textStyle: TextStyle): void {
    const sec = this.selectedSection();
    const key = this.selectedTextKey();
    if (!sec || !key) return;
    const existingStyle = (sec.data as { style?: SectionStyle })?.style ?? {};
    const nextStyle: SectionStyle = { ...existingStyle, [key]: textStyle };
    this.applyStyleUpdate(sec, nextStyle);
  }

  onButtonStyleChange(buttonStyle: ButtonStyle): void {
    const sec = this.selectedSection();
    const key = this.selectedTextKey();
    if (!sec) return;
    const existingStyle = (sec.data as { style?: SectionStyle })?.style ?? {};
    const styleKey = key === 'secondary-btn' ? 'secondaryBtn' : 'primaryBtn';
    const nextStyle: SectionStyle = { ...existingStyle, [styleKey]: buttonStyle };
    this.applyStyleUpdate(sec, nextStyle);
  }

  onCardStyleChange(cardStyle: CardStyle): void {
    const sec = this.selectedSection();
    if (!sec) return;
    const existingStyle = (sec.data as { style?: SectionStyle })?.style ?? {};
    const nextStyle: SectionStyle = { ...existingStyle, card: cardStyle };
    this.applyStyleUpdate(sec, nextStyle);
  }

  onImageStyleChange(imageStyle: ImageStyle): void {
    const sec = this.selectedSection();
    if (!sec) return;
    const existingStyle = (sec.data as { style?: SectionStyle })?.style ?? {};
    const nextStyle: SectionStyle = { ...existingStyle, image: imageStyle };
    this.applyStyleUpdate(sec, nextStyle);
  }

  private applyStyleUpdate(sec: WebsiteSection, nextStyle: SectionStyle): void {
    const nextData: Record<string, unknown> = { ...sec.data, style: nextStyle };
    const p = this.page();
    if (p?.sections) {
      const idx = p.sections.findIndex((s) => s.id === sec.id);
      if (idx !== -1) {
        const next = [...p.sections];
        next[idx] = { ...next[idx], data: nextData };
        this.page.set({ ...p, sections: next });
      }
    }
    this.saveStream.next({ id: sec.id, type: sec.type, data: nextData });
  }

  saveDraft(): void {
    const sec = this.selectedSection();
    if (!sec) {
      this.toast.info('Selecciona una sección para guardar el borrador.');
      return;
    }

    this.isSaving.set(true);
    this.builder.updateSection(sec.id, {
      data: this.sanitizeSectionData(sec.type, sec.data),
    }).subscribe({
      next: (updated) => {
        this.applySectionUpdate(updated);
        this.isSaving.set(false);
        this.flashSaved();
      },
      error: (e: ApiError) => {
        this.isSaving.set(false);
        this.toast.error(this.friendlyBuilderError(e));
      },
    });
  }

  // ─── Eventos del panel izquierdo ─────────────────────────────────

  onToggleVisible(id: string): void {
    const sec = this.sections().find((s) => s.id === id);
    if (!sec) return;
    const visible = !sec.visible;
    // Optimista
    this.applySectionUpdate({ ...sec, visible });
    this.builder.updateSection(id, { visible }).subscribe({
      next: (u) => this.applySectionUpdate(u),
      error: (e: ApiError) => {
        // Revertir
        this.applySectionUpdate({ ...sec, visible: sec.visible });
        this.toast.error(e.userMessage ?? 'No se pudo actualizar visibilidad');
      },
    });
  }

  onMove(ev: { id: string; dir: -1 | 1 }): void {
    const p = this.page();
    if (!p?.sections) return;
    const list = [...p.sections];
    const idx = list.findIndex((s) => s.id === ev.id);
    const target = idx + ev.dir;
    if (idx === -1 || target < 0 || target >= list.length) return;
    [list[idx], list[target]] = [list[target], list[idx]];
    // Actualiza locales con orden visual
    const reindexed = list.map((s, i) => ({ ...s, order: i }));
    this.page.set({ ...p, sections: reindexed });

    this.builder.reorder(p.id, reindexed.map((s) => s.id)).subscribe({
      next: (updated) => {
        this.page.set({ ...p, sections: updated });
      },
      error: (e: ApiError) => {
        this.toast.error(e.userMessage ?? 'No se pudo reordenar');
        // Recarga para volver al estado del servidor
        this.loadHome();
      },
    });
  }

  onReorder(ids: string[]): void {
    const p = this.page();
    if (!p?.sections) return;
    const map = new Map(p.sections.map((s) => [s.id, s]));
    const reindexed = ids
      .filter((id) => map.has(id))
      .map((id, i) => ({ ...map.get(id)!, order: i }));
    this.page.set({ ...p, sections: reindexed });
    this.builder.reorder(p.id, ids).subscribe({
      next: (updated) => this.page.set({ ...p, sections: updated }),
      error: (e: ApiError) => {
        this.toast.error(e.userMessage ?? 'No se pudo reordenar');
        this.loadHome();
      },
    });
  }

  onRemove(id: string): void {
    const p = this.page();
    if (!p?.sections) return;
    const sec = p.sections.find((s) => s.id === id);
    if (!sec) return;

    this.builder.deleteSection(id).subscribe({
      next: () => {
        const next = p.sections!.filter((s) => s.id !== id);
        this.page.set({ ...p, sections: next });
        if (this.selectedId() === id) {
          this.selectedId.set(next[0]?.id ?? null);
        }
        this.toast.success(`Sección "${SECTION_TYPE_LABELS[sec.type]}" eliminada`);
      },
      error: (e: ApiError) => {
        this.toast.error(e.userMessage ?? 'No se pudo eliminar');
      },
    });
  }

  onAdd(type: WebsiteSectionType): void {
    const p = this.page();
    if (!p) return;
    this.builder.createSection(p.id, { type }).subscribe({
      next: (sec) => {
        const next = [...(p.sections ?? []), sec];
        this.page.set({ ...p, sections: next });
        this.selectedId.set(sec.id);
        this.toast.success(`Sección "${SECTION_TYPE_LABELS[type]}" agregada`);
      },
      error: (e: ApiError) => {
        this.toast.error(e.userMessage ?? 'No se pudo agregar la sección');
      },
    });
  }

  // ─── Publish / Preview ─────────────────────────────────────────

  publish(): void {
    const p = this.page();
    if (!p) return;
    if (this.isSaving()) {
      this.toast.info('Espera un momento, hay cambios guardándose…');
      return;
    }
    this.confirmation.confirm({
      header: 'Publicar página',
      message: '¿Publicar la página? Los visitantes verán el contenido actual.',
      icon: 'pi pi-upload',
      acceptLabel: 'Publicar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.publishing.set(true);
        this.builder.publish(p.id).subscribe({
          next: (published) => {
            this.publishing.set(false);
            // Conserva las sections (el publish solo cambia status+snapshot)
            this.page.set({ ...published, sections: this.sections() });
            this.toast.success('Página publicada');
          },
          error: (e: ApiError) => {
            this.publishing.set(false);
            this.toast.error(e.userMessage ?? 'No se pudo publicar');
          },
        });
      },
    });
  }

  openPreview(): void {
    this.previewOpen.set(true);
  }

  closePreview(): void {
    this.previewOpen.set(false);
  }

  private sanitizeSectionData(
    type: WebsiteSectionType,
    raw: Record<string, unknown>,
  ): Record<string, unknown> {
    const data = raw ?? {};
    const asString = (value: unknown, max: number): string | undefined => {
      if (typeof value !== 'string') return undefined;
      const trimmed = value.trim();
      if (!trimmed) return undefined;
      return trimmed.slice(0, max);
    };
    const asInt = (value: unknown, min: number, max: number): number | undefined => {
      if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
      return Math.max(min, Math.min(max, Math.round(value)));
    };
    const asBool = (value: unknown): boolean | undefined =>
      typeof value === 'boolean' ? value : undefined;
    const sanitizeButton = (value: unknown): Record<string, unknown> | undefined => {
      if (!value || typeof value !== 'object') return undefined;
      const row = value as Record<string, unknown>;
      const label = asString(row['label'], 40);
      if (!label) return undefined;
      const out: Record<string, unknown> = { label };
      const href = asString(row['href'], 500);
      if (href) out['href'] = href;
      return out;
    };
    const sanitizeItems = (
      value: unknown,
      maxItems: number,
      mapper: (row: Record<string, unknown>) => Record<string, unknown> | null,
    ): Record<string, unknown>[] | undefined => {
      if (!Array.isArray(value)) return undefined;
      const mapped = value
        .slice(0, maxItems)
        .map((it) => (it && typeof it === 'object' ? mapper(it as Record<string, unknown>) : null))
        .filter((it): it is Record<string, unknown> => !!it);
      return mapped.length ? mapped : undefined;
    };
    const variantByType: Record<WebsiteSectionType, readonly string[]> = {
      NAVBAR: ['simple', 'centered', 'split'],
      HERO: ['classic', 'centered', 'promo'],
      SERVICES: ['grid', 'list', 'featured'],
      BENEFITS: ['grid', 'list', 'featured'],
      FEATURED_PRODUCTS: ['grid', 'highlight', 'compact'],
      OFFICES: ['cards', 'compact', 'contact'],
      CTA: ['centered', 'split', 'banner'],
      FAQ: ['accordion', 'list', 'twoColumns'],
      CONTACT: ['card', 'split', 'channels'],
      FOOTER: ['simple', 'columns', 'compact'],
    };
    const legacyVariantMap: Record<string, string> = {
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
    const sanitizeVariant = (currentType: WebsiteSectionType): string | undefined => {
      const rawVariant = data['variant'];
      if (typeof rawVariant !== 'string' || !rawVariant.trim()) return undefined;
      const normalized = legacyVariantMap[rawVariant] ?? rawVariant;
      const allowed = variantByType[currentType];
      return allowed.includes(normalized) ? normalized : undefined;
    };
    const sanitizeTextStyle = (obj: unknown): Record<string, unknown> | undefined => {
      if (!obj || typeof obj !== 'object') return undefined;
      const r = obj as Record<string, unknown>;
      const hexRe = /^#[0-9a-fA-F]{3,8}$/;
      const out: Record<string, unknown> = {};
      const c = asString(r['color'], 9);
      if (c && hexRe.test(c)) out['color'] = c;
      const ff = asString(r['fontFamily'], 200);
      if (ff) out['fontFamily'] = ff;
      const fs = asString(r['fontSize'], 20);
      if (fs && /^\d+(\.\d+)?(px|rem|em|pt)$/.test(fs)) out['fontSize'] = fs;
      const fw = asString(r['fontWeight'], 10);
      if (fw && /^(bold|bolder|lighter|normal|[1-9]00)$/.test(fw)) out['fontWeight'] = fw;
      const fst = asString(r['fontStyle'], 10);
      if (fst === 'normal' || fst === 'italic') out['fontStyle'] = fst;
      const ta = asString(r['textAlign'], 10);
      if (ta === 'left' || ta === 'center' || ta === 'right' || ta === 'justify') out['textAlign'] = ta;
      const tt = asString(r['textTransform'], 15);
      if (tt === 'none' || tt === 'uppercase' || tt === 'lowercase' || tt === 'capitalize') out['textTransform'] = tt;
      const ls = asString(r['letterSpacing'], 15);
      if (ls && /^-?\d+(\.\d+)?(em|px|rem)$/.test(ls)) out['letterSpacing'] = ls;
      const lh = asString(r['lineHeight'], 10);
      if (lh) out['lineHeight'] = lh;
      return Object.keys(out).length > 0 ? out : undefined;
    };
    const sanitizeButtonStyle = (obj: unknown): Record<string, unknown> | undefined => {
      if (!obj || typeof obj !== 'object') return undefined;
      const r = obj as Record<string, unknown>;
      const hexRe = /^#[0-9a-fA-F]{3,8}$/;
      const out: Record<string, unknown> = {};
      const bg = asString(r['bgColor'], 9);    if (bg && hexRe.test(bg)) out['bgColor'] = bg;
      const tc = asString(r['textColor'], 9);  if (tc && hexRe.test(tc)) out['textColor'] = tc;
      const bc = asString(r['borderColor'], 9); if (bc && hexRe.test(bc)) out['borderColor'] = bc;
      const br = asString(r['borderRadius'], 10);
      if (br && ['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(br)) out['borderRadius'] = br;
      return Object.keys(out).length > 0 ? out : undefined;
    };
    const sanitizeCardStyle = (obj: unknown): Record<string, unknown> | undefined => {
      const base = sanitizeButtonStyle(obj) ?? {};
      if (!obj || typeof obj !== 'object') return undefined;
      const r = obj as Record<string, unknown>;
      const sh = asString(r['shadow'], 6);
      if (sh && ['none', 'sm', 'md', 'lg'].includes(sh)) base['shadow'] = sh;
      return Object.keys(base).length > 0 ? base : undefined;
    };
    const sanitizeImageStyle = (obj: unknown): Record<string, unknown> | undefined => {
      if (!obj || typeof obj !== 'object') return undefined;
      const r = obj as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      const br = asString(r['borderRadius'], 10);
      if (br && ['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(br)) out['borderRadius'] = br;
      const ar = asString(r['aspectRatio'], 10);
      if (ar && ['1/1', '4/3', '3/2', '16/9', 'auto'].includes(ar)) out['aspectRatio'] = ar;
      return Object.keys(out).length > 0 ? out : undefined;
    };
    const sanitizeStyle = (): Record<string, unknown> | undefined => {
      const s = data['style'];
      if (!s || typeof s !== 'object') return undefined;
      const sr = s as Record<string, unknown>;
      const hexRe = /^#[0-9a-fA-F]{3,8}$/;
      const out: Record<string, unknown> = {};
      const bgColor = asString(sr['bgColor'], 9);
      if (bgColor && hexRe.test(bgColor)) out['bgColor'] = bgColor;
      const ff = sr['fontFamily'];
      if (ff === 'sans' || ff === 'serif' || ff === 'display') out['fontFamily'] = ff;
      const py = sr['paddingY'];
      if (['none', 'xs', 'sm', 'md', 'lg', 'xl'].includes(py as string)) out['paddingY'] = py;
      const title = sanitizeTextStyle(sr['title']);
      if (title) out['title'] = title;
      const subtitle = sanitizeTextStyle(sr['subtitle']);
      if (subtitle) out['subtitle'] = subtitle;
      const eyebrow = sanitizeTextStyle(sr['eyebrow']);
      if (eyebrow) out['eyebrow'] = eyebrow;
      const body = sanitizeTextStyle(sr['body']);
      if (body) out['body'] = body;
      const primaryBtn = sanitizeButtonStyle(sr['primaryBtn']);
      if (primaryBtn) out['primaryBtn'] = primaryBtn;
      const secondaryBtn = sanitizeButtonStyle(sr['secondaryBtn']);
      if (secondaryBtn) out['secondaryBtn'] = secondaryBtn;
      const card = sanitizeCardStyle(sr['card']);
      if (card) out['card'] = card;
      const image = sanitizeImageStyle(sr['image']);
      if (image) out['image'] = image;
      return Object.keys(out).length > 0 ? out : undefined;
    };
    const sanitizeTheme = (): PageTheme => {
      const rawTheme = data['theme'];
      if (rawTheme === 'premium' || rawTheme === 'vibrant' || rawTheme === 'commercial') {
        return rawTheme;
      }
      if (rawTheme === 'minimal') return 'premium';
      if (rawTheme === 'vibrante') return 'vibrant';
      if (rawTheme === 'comercial') return 'commercial';
      return 'commercial';
    };

    switch (type) {
      case 'NAVBAR': {
        const out: Record<string, unknown> = {};
        const variant = sanitizeVariant(type);
        const ctaLabel = asString(data['ctaLabel'], 60);
        const ctaHref = asString(data['ctaHref'], 500);
        const showLogo = asBool(data['showLogo']);
        if (variant) out['variant'] = variant;
        if (showLogo !== undefined) out['showLogo'] = showLogo;
        if (ctaLabel) out['ctaLabel'] = ctaLabel;
        if (ctaHref) out['ctaHref'] = ctaHref;
        const rawLinks = data['links'];
        if (Array.isArray(rawLinks)) {
          const cleanLinks = rawLinks
            .slice(0, 8)
            .filter((l) => l && typeof l === 'object')
            .map((l) => {
              const row = l as Record<string, unknown>;
              const label = asString(row['label'], 60);
              if (!label) return null;
              const link: Record<string, unknown> = { label };
              const href = asString(row['href'], 500);
              if (href) link['href'] = href;
              return link;
            })
            .filter((l): l is Record<string, unknown> => !!l);
          if (cleanLinks.length) out['links'] = cleanLinks;
        }
        const navBg   = asString(data['navBgColor'],      7);
        const navText = asString(data['navTextColor'],    7);
        const ctaBg   = asString(data['ctaBgColor'],      7);
        const ctaText = asString(data['ctaTextColor'],    7);
        const ctaRadius = asString(data['ctaBorderRadius'], 10);
        const ctaStyle  = asString(data['ctaStyle'], 10);
        if (navBg)   out['navBgColor']      = navBg;
        if (navText) out['navTextColor']    = navText;
        if (ctaBg)   out['ctaBgColor']      = ctaBg;
        if (ctaText) out['ctaTextColor']    = ctaText;
        if (ctaRadius) out['ctaBorderRadius'] = ctaRadius;
        if (ctaStyle === 'solid' || ctaStyle === 'outline' || ctaStyle === 'ghost') out['ctaStyle'] = ctaStyle;
        return out;
      }
      case 'HERO': {
        const out: Record<string, unknown> = {};
        const variant = sanitizeVariant(type);
        const theme = sanitizeTheme();
        const eyebrow = asString(data['eyebrow'], 60);
        const title = asString(data['title'], 120);
        const subtitle = asString(data['subtitle'], 280);
        const imageUrl = asString(data['imageUrl'], 500);
        const ctaPrimary = sanitizeButton(data['ctaPrimary']);
        const ctaSecondary = sanitizeButton(data['ctaSecondary']);
        if (variant) out['variant'] = variant;
        out['theme'] = theme;
        if (eyebrow) out['eyebrow'] = eyebrow;
        if (title) out['title'] = title;
        if (subtitle) out['subtitle'] = subtitle;
        if (imageUrl) out['imageUrl'] = imageUrl;
        if (ctaPrimary) out['ctaPrimary'] = ctaPrimary;
        if (ctaSecondary) out['ctaSecondary'] = ctaSecondary;
        const imgPos = asString(data['imagePosition'], 10);
        const heroH  = asString(data['heroHeight'],    10);
        const tAlign = asString(data['textAlign'],     10);
        if (imgPos === 'right' || imgPos === 'left') out['imagePosition'] = imgPos;
        if (heroH === 'auto' || heroH === 'medium' || heroH === 'large' || heroH === 'screen') out['heroHeight'] = heroH;
        if (tAlign === 'left' || tAlign === 'center' || tAlign === 'right') out['textAlign'] = tAlign;
        const heroStyle = sanitizeStyle();
        if (heroStyle) out['style'] = heroStyle;
        return out;
      }
      case 'FEATURED_PRODUCTS': {
        const out: Record<string, unknown> = {};
        const variant = sanitizeVariant(type);
        const eyebrow = asString(data['eyebrow'], 60);
        const title = asString(data['title'], 120);
        const subtitle = asString(data['subtitle'], 220);
        const limit = asInt(data['limit'], 1, 12);
        const ctaLabel = asString(data['ctaLabel'], 40);
        const showCta = asBool(data['showCta']);
        const emptyMessage = asString(data['emptyMessage'], 220);
        const rawIds = data['productIds'];
        const productIds = Array.isArray(rawIds)
          ? (rawIds as unknown[]).filter((id): id is string => typeof id === 'string').slice(0, 12)
          : undefined;
        if (variant) out['variant'] = variant;
        if (eyebrow) out['eyebrow'] = eyebrow;
        if (title) out['title'] = title;
        if (subtitle) out['subtitle'] = subtitle;
        if (limit !== undefined) out['limit'] = limit;
        if (ctaLabel) out['ctaLabel'] = ctaLabel;
        if (showCta !== undefined) out['showCta'] = showCta;
        if (emptyMessage) out['emptyMessage'] = emptyMessage;
        if (productIds && productIds.length > 0) out['productIds'] = productIds;
        const fpStyle = sanitizeStyle();
        if (fpStyle) out['style'] = fpStyle;
        return out;
      }
      case 'SERVICES':
      case 'BENEFITS': {
        const out: Record<string, unknown> = {};
        const variant = sanitizeVariant(type);
        const eyebrow = asString(data['eyebrow'], 60);
        const title = asString(data['title'], 120);
        const items = sanitizeItems(data['items'], 12, (row) => {
          const itemTitle = asString(row['title'], 80);
          if (!itemTitle) return null;
          const mapped: Record<string, unknown> = { title: itemTitle };
          const description = asString(row['description'], 200);
          const icon = asString(row['icon'], 40);
          if (description) mapped['description'] = description;
          if (icon) mapped['icon'] = icon;
          return mapped;
        });
        if (variant) out['variant'] = variant;
        if (eyebrow) out['eyebrow'] = eyebrow;
        if (title) out['title'] = title;
        if (items) out['items'] = items;
        const cols = data['columns'];
        if (cols === 2 || cols === 3 || cols === 4) out['columns'] = cols;
        const cl = asString(data['cardLayout'], 20);
        if (cl === 'icon-top' || cl === 'icon-left') out['cardLayout'] = cl;
        const cardBg     = asString(data['cardBgColor'],      7);
        const cardText   = asString(data['cardTextColor'],    7);
        const cardAccent = asString(data['cardAccentColor'],  7);
        const cardBorder = asString(data['cardBorderColor'],  7);
        const cardRadius = asString(data['cardBorderRadius'], 10);
        const cardShadow = asString(data['cardShadow'],       10);
        if (cardBg)     out['cardBgColor']      = cardBg;
        if (cardText)   out['cardTextColor']    = cardText;
        if (cardAccent) out['cardAccentColor']  = cardAccent;
        if (cardBorder) out['cardBorderColor']  = cardBorder;
        if (cardRadius) out['cardBorderRadius'] = cardRadius;
        if (cardShadow) out['cardShadow']       = cardShadow;
        const sbStyle = sanitizeStyle();
        if (sbStyle) out['style'] = sbStyle;
        return out;
      }
      case 'OFFICES': {
        const out: Record<string, unknown> = {};
        const variant = sanitizeVariant(type);
        const eyebrow = asString(data['eyebrow'], 60);
        const title = asString(data['title'], 120);
        const subtitle = asString(data['subtitle'], 280);
        if (variant) out['variant'] = variant;
        if (eyebrow) out['eyebrow'] = eyebrow;
        if (title) out['title'] = title;
        if (subtitle) out['subtitle'] = subtitle;
        const offStyle = sanitizeStyle();
        if (offStyle) out['style'] = offStyle;
        return out;
      }
      case 'FAQ': {
        const out: Record<string, unknown> = {};
        const variant = sanitizeVariant(type);
        const eyebrow = asString(data['eyebrow'], 60);
        const title = asString(data['title'], 120);
        const items = sanitizeItems(data['items'], 20, (row) => {
          const question = asString(row['question'], 200);
          const answer = asString(row['answer'], 1000);
          if (!question || !answer) return null;
          return { question, answer };
        });
        if (variant) out['variant'] = variant;
        if (eyebrow) out['eyebrow'] = eyebrow;
        if (title) out['title'] = title;
        if (items) out['items'] = items;
        const faqStyle = sanitizeStyle();
        if (faqStyle) out['style'] = faqStyle;
        return out;
      }
      case 'CTA': {
        const out: Record<string, unknown> = {};
        const variant = sanitizeVariant(type);
        const eyebrow = asString(data['eyebrow'], 60);
        const title = asString(data['title'], 120);
        const subtitle = asString(data['subtitle'], 280) ?? asString(data['description'], 280);
        const ctaPrimary = sanitizeButton(data['ctaPrimary']);
        const ctaSecondary = sanitizeButton(data['ctaSecondary']);
        if (variant) out['variant'] = variant;
        if (eyebrow) out['eyebrow'] = eyebrow;
        if (title) out['title'] = title;
        if (subtitle) out['subtitle'] = subtitle;
        if (ctaPrimary) out['ctaPrimary'] = ctaPrimary;
        if (ctaSecondary) out['ctaSecondary'] = ctaSecondary;
        const ctaStyle = sanitizeStyle();
        if (ctaStyle) out['style'] = ctaStyle;
        return out;
      }
      case 'CONTACT': {
        const out: Record<string, unknown> = {};
        const variant = sanitizeVariant(type);
        const title = asString(data['title'], 120);
        const phone = asString(data['phone'], 40) ?? asString(data['whatsapp'], 40);
        const email = asString(data['email'], 120);
        const address = asString(data['address'], 280);
        const useCompanyContact = asBool(data['useCompanyContact']);
        if (variant) out['variant'] = variant;
        if (title) out['title'] = title;
        if (phone) out['phone'] = phone;
        if (email) out['email'] = email;
        if (address) out['address'] = address;
        if (useCompanyContact !== undefined) out['useCompanyContact'] = useCompanyContact;
        const contactStyle = sanitizeStyle();
        if (contactStyle) out['style'] = contactStyle;
        return out;
      }
      case 'FOOTER': {
        const out: Record<string, unknown> = {};
        const variant = sanitizeVariant(type);
        const description = asString(data['description'], 300);
        const copyrightText = asString(data['copyrightText'], 120);
        const whatsapp = asString(data['whatsapp'], 30);
        const email = asString(data['email'], 120);
        const showPoweredBySalesflow = asBool(data['showPoweredBySalesflow']);
        if (variant) out['variant'] = variant;
        if (description) out['description'] = description;
        if (copyrightText) out['copyrightText'] = copyrightText;
        if (whatsapp) out['whatsapp'] = whatsapp;
        if (email) out['email'] = email;
        if (showPoweredBySalesflow !== undefined) out['showPoweredBySalesflow'] = showPoweredBySalesflow;
        const footerStyle = sanitizeStyle();
        if (footerStyle) out['style'] = footerStyle;
        return out;
      }
      default:
        return {};
    }
  }

  private heroSection(): WebsiteSection | null {
    return this.sections().find((s) => s.type === 'HERO') ?? null;
  }

  private normalizeTheme(rawTheme: string): PageTheme {
    if (rawTheme === 'premium' || rawTheme === 'vibrant' || rawTheme === 'commercial') {
      return rawTheme;
    }
    if (rawTheme === 'minimal') return 'premium';
    if (rawTheme === 'vibrante') return 'vibrant';
    if (rawTheme === 'comercial') return 'commercial';
    return 'commercial';
  }

  private extractThemeFromSections(sections: WebsiteSection[]): PageTheme {
    const hero = sections.find((s) => s.type === 'HERO');
    const rawTheme = hero?.data?.['theme'];
    if (rawTheme === 'premium' || rawTheme === 'vibrant' || rawTheme === 'commercial') {
      return rawTheme;
    }
    if (rawTheme === 'minimal') return 'premium';
    if (rawTheme === 'vibrante') return 'vibrant';
    if (rawTheme === 'comercial') return 'commercial';
    return 'commercial';
  }

  private friendlyBuilderError(error: ApiError): string {
    const raw = `${error?.userMessage ?? error?.message ?? ''}`.toLowerCase();
    if (raw.includes('property') && raw.includes('should not exist')) {
      return 'Algunos campos de esta sección todavía están en ajuste. Guardamos la versión compatible.';
    }
    if (raw.includes('invalid') || raw.includes('must be')) {
      return 'Revisa los datos de la sección. Hay campos con formato inválido.';
    }
    return error?.userMessage ?? 'No se pudo guardar el cambio';
  }
}
