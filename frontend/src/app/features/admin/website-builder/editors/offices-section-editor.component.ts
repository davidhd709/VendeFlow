import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import {
  BorderRadiusToken,
  OfficesData,
  SectionStyle,
  ShadowToken,
} from '@core/models/website-builder.model';

const COLOR_PRESETS = [
  '#ffffff','#f8fafc','#f1f5f9','#0f172a','#1e293b',
  '#2563eb','#4f46e5','#7c3aed','#16a34a','#ea580c','#0891b2','#c9a84c',
];

@Component({
  selector: 'app-offices-section-editor',
  standalone: true,
  imports: [FormsModule, InputTextModule, TextareaModule],
  template: `
    <div class="sf-stack">
      <div class="intro">
        <h4>Oficinas y puntos de atención</h4>
        <p>Ayuda a tus clientes a escoger el punto más cercano.</p>
      </div>

      <!-- Diseño -->
      <div class="sf-field">
        <label>Diseño de la sección</label>
        <div class="chip-group">
          @for (v of variants; track v.value) {
            <button
              type="button"
              class="style-chip"
              [class.active]="variant === v.value"
              (click)="variant = v.value; emit()"
            >{{ v.label }}</button>
          }
        </div>
        <small class="sf-field-help">Selecciona un diseño para esta sección.</small>
      </div>

      <!-- Colores de sección -->
      <div class="style-group">
        <div class="group-title">Colores de sección</div>
        <div class="color-row">
          <label>Fondo de sección</label>
          <div class="color-input-group">
            <input type="color" class="color-swatch" [value]="bgColor || '#ffffff'"
              (input)="onColor('bg', $event)" />
            <input pInputText class="color-hex" [(ngModel)]="bgColor" (ngModelChange)="emit()"
              maxlength="7" placeholder="#ffffff" />
            <button type="button" class="color-clear" (click)="bgColor=''; emit()">×</button>
          </div>
          <div class="presets-row">
            @for (c of presets; track c) {
              <button type="button" class="pdot" [style.background]="c" (click)="bgColor=c; emit()"></button>
            }
          </div>
        </div>
      </div>

      <!-- Colores de tarjetas -->
      <div class="style-group">
        <div class="group-title">Colores de tarjetas</div>

        <div class="color-row">
          <label>Fondo de tarjeta</label>
          <div class="color-input-group">
            <input type="color" class="color-swatch" [value]="cardBgColor || '#ffffff'"
              (input)="onColor('cardBg', $event)" />
            <input pInputText class="color-hex" [(ngModel)]="cardBgColor" (ngModelChange)="emit()"
              maxlength="7" placeholder="#ffffff" />
            <button type="button" class="color-clear" (click)="cardBgColor=''; emit()">×</button>
          </div>
          <div class="presets-row">
            @for (c of presets; track c) {
              <button type="button" class="pdot" [style.background]="c" (click)="cardBgColor=c; emit()"></button>
            }
          </div>
        </div>

        <div class="color-row">
          <label>Texto de tarjeta</label>
          <div class="color-input-group">
            <input type="color" class="color-swatch" [value]="cardTextColor || '#0f172a'"
              (input)="onColor('cardText', $event)" />
            <input pInputText class="color-hex" [(ngModel)]="cardTextColor" (ngModelChange)="emit()"
              maxlength="7" placeholder="#0f172a" />
            <button type="button" class="color-clear" (click)="cardTextColor=''; emit()">×</button>
          </div>
        </div>

        <div class="color-row">
          <label>Borde de tarjeta</label>
          <div class="color-input-group">
            <input type="color" class="color-swatch" [value]="cardBorderColor || '#e2e8f0'"
              (input)="onColor('cardBorder', $event)" />
            <input pInputText class="color-hex" [(ngModel)]="cardBorderColor" (ngModelChange)="emit()"
              maxlength="7" placeholder="#e2e8f0" />
            <button type="button" class="color-clear" (click)="cardBorderColor=''; emit()">×</button>
          </div>
        </div>

        <div class="color-row">
          <label>Radio de bordes</label>
          <div class="chip-group">
            @for (r of radiusOptions; track r.value) {
              <button type="button" class="style-chip"
                [class.active]="cardRadius === r.value"
                (click)="cardRadius = r.value; emit()">{{ r.label }}</button>
            }
            @if (cardRadius) {
              <button type="button" class="style-chip" (click)="cardRadius=''; emit()">× Limpiar</button>
            }
          </div>
        </div>

        <div class="color-row">
          <label>Sombra</label>
          <div class="chip-group">
            @for (s of shadowOptions; track s.value) {
              <button type="button" class="style-chip"
                [class.active]="cardShadow === s.value"
                (click)="cardShadow = s.value; emit()">{{ s.label }}</button>
            }
            @if (cardShadow) {
              <button type="button" class="style-chip" (click)="cardShadow=''; emit()">× Limpiar</button>
            }
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div class="sf-field">
        <label>Título</label>
        <input pInputText [(ngModel)]="form.title" (ngModelChange)="emit()" maxlength="120" />
      </div>

      <div class="sf-field">
        <label>Subtítulo</label>
        <textarea
          pTextarea
          rows="2"
          [(ngModel)]="form.subtitle"
          (ngModelChange)="emit()"
          maxlength="220"
        ></textarea>
      </div>

      <div class="sf-field">
        <label>Texto del botón</label>
        <input
          pInputText
          [(ngModel)]="form.ctaLabel"
          (ngModelChange)="emit()"
          maxlength="40"
          placeholder="Ver oficinas"
        />
      </div>

      <div class="sf-field">
        <label>Mensaje si no hay oficinas</label>
        <textarea
          pTextarea
          rows="2"
          [(ngModel)]="form.emptyMessage"
          (ngModelChange)="emit()"
          maxlength="220"
        ></textarea>
      </div>

      <label class="toggle-row">
        <input type="checkbox" [(ngModel)]="form.showContactData" (ngModelChange)="emit()" />
        <span>Mostrar datos de contacto en cada oficina</span>
      </label>
    </div>
  `,
  styles: [
    `
      .intro {
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        padding: 0.75rem;
        background: linear-gradient(180deg, #fff 0%, var(--sf-surface-2) 100%);
      }
      .intro h4 {
        margin: 0;
        font-size: 0.9rem;
      }
      .intro p {
        margin: 0.3rem 0 0;
        font-size: 0.8rem;
        color: var(--sf-text-muted);
      }
      .toggle-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.84rem;
        color: var(--sf-text);
      }
      .style-group { border: 1px solid var(--sf-border); border-radius: 10px; padding: 0.85rem; background: var(--sf-surface-2); display: flex; flex-direction: column; gap: 0.6rem; }
      .group-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sf-text-muted); }
      .color-row { display: flex; flex-direction: column; gap: 0.3rem; }
      .color-row label { font-size: 0.8rem; font-weight: 600; }
      .color-input-group { display: flex; align-items: center; gap: 0.4rem; }
      .color-swatch { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--sf-border); padding: 2px; cursor: pointer; flex-shrink: 0; }
      .color-hex { flex: 1; font-family: monospace; font-size: 0.82rem; }
      .color-clear { all: unset; width: 24px; height: 24px; border-radius: 6px; background: var(--sf-surface); border: 1px solid var(--sf-border); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: var(--sf-text-muted); flex-shrink: 0; }
      .color-clear:hover { background: #fee2e2; color: #dc2626; }
      .presets-row { display: flex; flex-wrap: wrap; gap: 0.3rem; }
      .pdot { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid rgba(0,0,0,0.12); cursor: pointer; flex-shrink: 0; transition: transform 0.1s; }
      .pdot:hover { transform: scale(1.2); }
      .chip-group { display: flex; flex-wrap: wrap; gap: 0.35rem; }
      .style-chip { padding: 0.28rem 0.65rem; border: 1.5px solid var(--sf-border); border-radius: 6px; background: #fff; font-size: 0.78rem; font-weight: 500; color: var(--sf-text); cursor: pointer; transition: all 0.12s; white-space: nowrap; }
      .style-chip:hover { border-color: var(--sf-primary); color: var(--sf-primary); }
      .style-chip.active { border-color: var(--sf-primary); background: var(--sf-primary); color: #fff; font-weight: 600; }
    `,
  ],
})
export class OfficesSectionEditorComponent implements OnChanges {
  @Input() data: OfficesData = {};
  @Output() dataChange = new EventEmitter<OfficesData>();

  form: OfficesData = {};
  variant: NonNullable<OfficesData['variant']> = 'cards';

  bgColor         = '';
  cardBgColor     = '';
  cardTextColor   = '';
  cardBorderColor = '';
  cardRadius      = '';
  cardShadow      = '';

  readonly presets = COLOR_PRESETS;

  readonly variants = [
    { value: 'cards',   label: 'Tarjetas en grid' },
    { value: 'compact', label: 'Lista compacta' },
    { value: 'contact', label: 'Oficina principal' },
  ] as const;

  readonly radiusOptions = [
    { value: 'none', label: 'Sin redondeo' },
    { value: 'sm',   label: 'Pequeño' },
    { value: 'md',   label: 'Medio' },
    { value: 'lg',   label: 'Grande' },
    { value: 'xl',   label: 'Extra grande' },
    { value: 'full', label: 'Circular' },
  ] as const;

  readonly shadowOptions = [
    { value: 'none', label: 'Sin sombra' },
    { value: 'sm',   label: 'Sutil' },
    { value: 'md',   label: 'Media' },
    { value: 'lg',   label: 'Grande' },
  ] as const;

  ngOnChanges(): void {
    this.form = {
      title: this.data?.title ?? 'Oficinas y puntos de atención',
      subtitle:
        this.data?.subtitle ??
        'Ayuda a tus clientes a escoger el punto más cercano.',
      ctaLabel: this.data?.ctaLabel ?? 'Ver oficinas',
      emptyMessage:
        this.data?.emptyMessage ??
        'No tenemos oficinas visibles por ahora. Contáctanos por WhatsApp.',
      showContactData: this.data?.showContactData ?? true,
    };
    this.variant = this.data?.variant ?? 'cards';

    const s = this.data?.style;
    this.bgColor         = s?.bgColor            ?? '';
    this.cardBgColor     = s?.card?.bgColor      ?? '';
    this.cardTextColor   = s?.card?.textColor    ?? '';
    this.cardBorderColor = s?.card?.borderColor  ?? '';
    this.cardRadius      = s?.card?.borderRadius ?? '';
    this.cardShadow      = s?.card?.shadow       ?? '';
  }

  onColor(field: string, event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    if (field === 'bg')         this.bgColor         = v;
    if (field === 'cardBg')     this.cardBgColor     = v;
    if (field === 'cardText')   this.cardTextColor   = v;
    if (field === 'cardBorder') this.cardBorderColor = v;
    this.emit();
  }

  emit(): void {
    const out: OfficesData = {
      variant: this.variant,
      showContactData: !!this.form.showContactData,
    };
    if (this.form.title?.trim()) out.title = this.form.title.trim();
    if (this.form.subtitle?.trim()) out.subtitle = this.form.subtitle.trim();
    if (this.form.ctaLabel?.trim()) out.ctaLabel = this.form.ctaLabel.trim();
    if (this.form.emptyMessage?.trim()) out.emptyMessage = this.form.emptyMessage.trim();

    const style: SectionStyle = {};
    if (this.bgColor) style.bgColor = this.bgColor;
    if (this.cardBgColor || this.cardTextColor || this.cardBorderColor || this.cardRadius || this.cardShadow) {
      style.card = {};
      if (this.cardBgColor)     style.card.bgColor      = this.cardBgColor;
      if (this.cardTextColor)   style.card.textColor    = this.cardTextColor;
      if (this.cardBorderColor) style.card.borderColor  = this.cardBorderColor;
      if (this.cardRadius)      style.card.borderRadius = this.cardRadius as BorderRadiusToken;
      if (this.cardShadow)      style.card.shadow       = this.cardShadow as ShadowToken;
    }
    if (Object.keys(style).length) out.style = style;

    this.dataChange.emit(out);
  }
}
