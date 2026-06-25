import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BorderRadiusToken, ContentItem, ServicesData, ShadowToken } from '@core/models/website-builder.model';
import { IconPickerComponent } from './icon-picker.component';

const COLOR_PRESETS = [
  '#ffffff','#f8fafc','#f1f5f9','#0f172a','#2563eb','#4f46e5',
  '#7c3aed','#db2777','#16a34a','#ea580c','#0891b2','#c9a84c',
];

@Component({
  selector: 'app-services-section-editor',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, IconPickerComponent],
  template: `
    <div class="sf-stack">

      <!-- Diseño / variante -->
      <div class="sf-field">
        <label>Diseño de la sección</label>
        <div class="chip-group">
          @for (v of variants; track v.value) {
            <button type="button" class="style-chip" [class.active]="variant === v.value" (click)="variant = v.value; emit()">
              {{ v.label }}
            </button>
          }
        </div>
      </div>

      <!-- Columnas (solo aplica a grid/numbered/horizontal) -->
      @if (variant === 'grid' || variant === 'numbered' || variant === 'horizontal') {
        <div class="sf-field">
          <label>Columnas</label>
          <div class="chip-group">
            @for (c of colOptions; track c) {
              <button type="button" class="style-chip" [class.active]="columns === c" (click)="columns = c; emit()">
                {{ c }} col.
              </button>
            }
          </div>
        </div>
      }

      <!-- Layout interno de la card -->
      <div class="sf-field">
        <label>Posición del icono</label>
        <div class="chip-group">
          <button type="button" class="style-chip" [class.active]="cardLayout === 'icon-top'" (click)="cardLayout='icon-top'; emit()">Arriba</button>
          <button type="button" class="style-chip" [class.active]="cardLayout === 'icon-left'" (click)="cardLayout='icon-left'; emit()">A la izquierda</button>
        </div>
      </div>

      <!-- Textos de la sección -->
      <div class="sf-field">
        <label>Texto superior <span class="text-muted text-xs">(opcional)</span></label>
        <input pInputText [(ngModel)]="form.eyebrow" (ngModelChange)="emit()" maxlength="60" />
      </div>
      <div class="sf-field">
        <label>Título de la sección</label>
        <input pInputText [(ngModel)]="form.title" (ngModelChange)="emit()" maxlength="120" />
        <small class="sf-field-help">Ejemplo: "¿Por qué comprar con nosotros?"</small>
      </div>

      <!-- Colores de las cards -->
      <div class="style-group">
        <div class="group-title">Estilo de las tarjetas</div>

        <div class="color-row">
          <label>Fondo</label>
          <div class="color-input-group">
            <input type="color" [value]="cardBgColor || '#ffffff'" (input)="onColor('bg', $event)" class="color-swatch" />
            <input pInputText [(ngModel)]="cardBgColor" (ngModelChange)="emit()" maxlength="7" placeholder="—" class="color-hex" />
            @if (cardBgColor) { <button type="button" (click)="cardBgColor=''; emit()" class="color-clear" title="Quitar">×</button> }
          </div>
          <div class="color-presets">
            @for (c of presets; track c) {
              <button type="button" class="preset-dot" [style.background]="c" (click)="cardBgColor=c; emit()" [title]="c"></button>
            }
          </div>
        </div>

        <div class="color-row">
          <label>Texto</label>
          <div class="color-input-group">
            <input type="color" [value]="cardTextColor || '#0f172a'" (input)="onColor('text', $event)" class="color-swatch" />
            <input pInputText [(ngModel)]="cardTextColor" (ngModelChange)="emit()" maxlength="7" placeholder="—" class="color-hex" />
            @if (cardTextColor) { <button type="button" (click)="cardTextColor=''; emit()" class="color-clear" title="Quitar">×</button> }
          </div>
        </div>

        <div class="color-row">
          <label>Color de acento <span class="text-muted text-xs">(icono, borde superior)</span></label>
          <div class="color-input-group">
            <input type="color" [value]="cardAccentColor || '#2563eb'" (input)="onColor('accent', $event)" class="color-swatch" />
            <input pInputText [(ngModel)]="cardAccentColor" (ngModelChange)="emit()" maxlength="7" placeholder="—" class="color-hex" />
            @if (cardAccentColor) { <button type="button" (click)="cardAccentColor=''; emit()" class="color-clear" title="Quitar">×</button> }
          </div>
          <div class="color-presets">
            @for (c of presets; track c) {
              <button type="button" class="preset-dot" [style.background]="c" (click)="cardAccentColor=c; emit()" [title]="c"></button>
            }
          </div>
        </div>

        <div class="color-row">
          <label>Borde</label>
          <div class="color-input-group">
            <input type="color" [value]="cardBorderColor || '#e2e8f0'" (input)="onColor('border', $event)" class="color-swatch" />
            <input pInputText [(ngModel)]="cardBorderColor" (ngModelChange)="emit()" maxlength="7" placeholder="—" class="color-hex" />
            @if (cardBorderColor) { <button type="button" (click)="cardBorderColor=''; emit()" class="color-clear" title="Quitar">×</button> }
          </div>
        </div>

        <div class="sf-field">
          <label>Forma del borde</label>
          <div class="chip-group">
            @for (r of radiusOpts; track r.value) {
              <button type="button" class="style-chip" [class.active]="cardBorderRadius === r.value" (click)="cardBorderRadius = r.value; emit()">
                {{ r.label }}
              </button>
            }
          </div>
        </div>

        <div class="sf-field">
          <label>Sombra</label>
          <div class="chip-group">
            @for (s of shadowOpts; track s.value) {
              <button type="button" class="style-chip" [class.active]="cardShadow === s.value" (click)="cardShadow = s.value; emit()">
                {{ s.label }}
              </button>
            }
          </div>
        </div>
      </div>

      <!-- Items -->
      <div class="items-head">
        <span class="block-title">{{ section.type === 'BENEFITS' ? 'Beneficios' : 'Servicios' }}</span>
        <p-button label="Agregar" icon="pi pi-plus" size="small" severity="secondary"
          [disabled]="items.length >= 12" (onClick)="add()" />
      </div>

      @for (it of items; track $index; let i = $index) {
        <div class="item">
          <div class="sf-field">
            <label>Título</label>
            <input pInputText [(ngModel)]="it.title" (ngModelChange)="emit()" maxlength="80" />
          </div>
          <div class="sf-field">
            <label>Descripción</label>
            <input pInputText [(ngModel)]="it.description" (ngModelChange)="emit()" maxlength="200" />
          </div>
          <div class="sf-field">
            <label>Icono</label>
            <app-icon-picker [value]="it.icon || ''" (valueChange)="it.icon = $event; emit()" />
          </div>
          <div class="item-actions">
            <p-button icon="pi pi-trash" severity="danger" [text]="true" (onClick)="remove(i)" ariaLabel="Eliminar" />
          </div>
        </div>
      }

      @if (items.length === 0) {
        <p class="text-muted text-sm">Agrega al menos un item para que esta sección aparezca en el sitio.</p>
      }
      @if (items.length >= 12) {
        <p class="text-warn text-xs">Máximo 12 items por sección.</p>
      }
    </div>
  `,
  styles: [`
    .items-head { display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem; }
    .block-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sf-text-muted); }
    .item { display: flex; flex-direction: column; gap: 0.35rem; padding: 0.65rem; background: var(--sf-surface-2); border-radius: 10px; }
    .item-actions { display: flex; justify-content: flex-end; margin-top: 0.1rem; }
    .text-warn { color: var(--sf-warn); }

    .style-group { border: 1px solid var(--sf-border); border-radius: 10px; padding: 0.85rem; background: var(--sf-surface-2); display: flex; flex-direction: column; gap: 0.6rem; }
    .group-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sf-text-muted); }

    .color-row { display: flex; flex-direction: column; gap: 0.3rem; }
    .color-row label { font-size: 0.8rem; font-weight: 600; color: var(--sf-text); }
    .color-input-group { display: flex; align-items: center; gap: 0.4rem; }
    .color-swatch { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--sf-border); padding: 2px; cursor: pointer; flex-shrink: 0; }
    .color-hex { flex: 1; font-family: monospace; font-size: 0.82rem; }
    .color-clear { all: unset; width: 24px; height: 24px; border-radius: 6px; background: var(--sf-surface); border: 1px solid var(--sf-border); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: var(--sf-text-muted); flex-shrink: 0; }
    .color-clear:hover { background: #fee2e2; color: #dc2626; }
    .color-presets { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.2rem; }
    .preset-dot { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid rgba(0,0,0,0.12); cursor: pointer; flex-shrink: 0; transition: transform 0.1s; }
    .preset-dot:hover { transform: scale(1.2); }

    .chip-group { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .style-chip { padding: 0.28rem 0.65rem; border: 1.5px solid var(--sf-border); border-radius: 6px; background: #fff; font-size: 0.78rem; font-weight: 500; color: var(--sf-text); cursor: pointer; transition: all 0.12s; white-space: nowrap; }
    .style-chip:hover { border-color: var(--sf-primary); color: var(--sf-primary); }
    .style-chip.active { border-color: var(--sf-primary); background: var(--sf-primary); color: #fff; font-weight: 600; }
  `],
})
export class ServicesSectionEditorComponent implements OnChanges {
  @Input() data: ServicesData = {};
  @Input() section: { type: string } = { type: 'SERVICES' };
  @Output() dataChange = new EventEmitter<ServicesData>();

  readonly presets = COLOR_PRESETS;
  readonly variants = [
    { value: 'grid',       label: 'Cards en grid' },
    { value: 'list',       label: 'Lista con íconos' },
    { value: 'featured',   label: 'Bloques destacados' },
    { value: 'numbered',   label: 'Numerados' },
    { value: 'horizontal', label: 'Horizontal' },
  ] as const;
  readonly colOptions: Array<2|3|4> = [2, 3, 4];
  readonly radiusOpts = [
    { value: '' as const,     label: 'Default' },
    { value: 'none' as const, label: 'Cuadrado' },
    { value: 'sm' as const,   label: 'Poco' },
    { value: 'md' as const,   label: 'Medio' },
    { value: 'lg' as const,   label: 'Amplio' },
    { value: 'xl' as const,   label: 'Extra' },
    { value: 'full' as const, label: 'Pill' },
  ];
  readonly shadowOpts = [
    { value: '' as const,     label: 'Sin sombra' },
    { value: 'sm' as const,   label: 'Sutil' },
    { value: 'md' as const,   label: 'Media' },
    { value: 'lg' as const,   label: 'Grande' },
  ];

  form: { eyebrow?: string; title?: string } = {};
  variant: NonNullable<ServicesData['variant']> = 'grid';
  columns: 2 | 3 | 4 = 3;
  cardLayout: 'icon-top' | 'icon-left' = 'icon-top';
  items: ContentItem[] = [];

  cardBgColor      = '';
  cardTextColor    = '';
  cardAccentColor  = '';
  cardBorderColor  = '';
  cardBorderRadius: BorderRadiusToken | '' = '';
  cardShadow: ShadowToken | '' = '';

  ngOnChanges(): void {
    this.form      = { eyebrow: this.data?.eyebrow ?? '', title: this.data?.title ?? '' };
    this.variant   = this.data?.variant ?? 'grid';
    this.columns   = this.data?.columns ?? 3;
    this.cardLayout = this.data?.cardLayout ?? 'icon-top';
    this.items     = (this.data?.items ?? []).map((i) => ({ ...i }));
    this.cardBgColor      = this.data?.cardBgColor      ?? '';
    this.cardTextColor    = this.data?.cardTextColor    ?? '';
    this.cardAccentColor  = this.data?.cardAccentColor  ?? '';
    this.cardBorderColor  = this.data?.cardBorderColor  ?? '';
    this.cardBorderRadius = this.data?.cardBorderRadius ?? '';
    this.cardShadow       = this.data?.cardShadow       ?? '';
  }

  onColor(field: 'bg' | 'text' | 'accent' | 'border', event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    if (field === 'bg')     this.cardBgColor     = v;
    if (field === 'text')   this.cardTextColor   = v;
    if (field === 'accent') this.cardAccentColor = v;
    if (field === 'border') this.cardBorderColor = v;
    this.emit();
  }

  add(): void {
    if (this.items.length >= 12) return;
    this.items.push({ title: '', description: '', icon: 'pi-check' });
    this.emit();
  }

  remove(idx: number): void {
    this.items.splice(idx, 1);
    this.emit();
  }

  emit(): void {
    const cleaned = this.items
      .filter((i) => (i.title ?? '').trim().length > 0)
      .map((i) => {
        const out: ContentItem = { title: i.title };
        if (i.description) out.description = i.description;
        if (i.icon) out.icon = i.icon;
        return out;
      });

    const out: ServicesData = { items: cleaned, variant: this.variant };
    if (this.form.eyebrow) out.eyebrow = this.form.eyebrow;
    if (this.form.title)   out.title   = this.form.title;
    if (this.columns !== 3) out.columns = this.columns;
    if (this.cardLayout !== 'icon-top') out.cardLayout = this.cardLayout;
    if (this.cardBgColor)      out.cardBgColor      = this.cardBgColor;
    if (this.cardTextColor)    out.cardTextColor    = this.cardTextColor;
    if (this.cardAccentColor)  out.cardAccentColor  = this.cardAccentColor;
    if (this.cardBorderColor)  out.cardBorderColor  = this.cardBorderColor;
    if (this.cardBorderRadius) out.cardBorderRadius = this.cardBorderRadius as BorderRadiusToken;
    if (this.cardShadow)       out.cardShadow       = this.cardShadow as ShadowToken;

    this.dataChange.emit(out);
  }
}
