import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import {
  BorderRadiusToken,
  FaqData,
  FaqItem,
  SectionStyle,
  ShadowToken,
} from '@core/models/website-builder.model';

const COLOR_PRESETS = [
  '#ffffff','#f8fafc','#f1f5f9','#0f172a','#1e293b',
  '#2563eb','#4f46e5','#7c3aed','#16a34a','#ea580c','#0891b2','#c9a84c',
];

@Component({
  selector: 'app-faq-section-editor',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, TextareaModule],
  template: `
    <div class="sf-stack">

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
            <button type="button" class="color-clear" title="Limpiar" (click)="bgColor=''; emit()">×</button>
          </div>
          <div class="presets-row">
            @for (c of presets; track c) {
              <button type="button" class="pdot" [style.background]="c" (click)="bgColor=c; emit()"></button>
            }
          </div>
        </div>
      </div>

      <!-- Colores de tarjetas (solo cuando NO es accordion) -->
      @if (variant !== 'accordion') {
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
      }

      <!-- Contenido -->
      <div class="sf-field">
        <label>Texto superior <span class="text-muted text-xs">(opcional)</span></label>
        <input pInputText [(ngModel)]="form.eyebrow" (ngModelChange)="emit()" maxlength="60" />
      </div>
      <div class="sf-field">
        <label>Título de la sección</label>
        <input pInputText [(ngModel)]="form.title" (ngModelChange)="emit()" maxlength="120" />
        <small class="sf-field-help">Ejemplo: "Resolvemos tus dudas antes de comprar".</small>
      </div>

      <div class="items-head">
        <span class="block-title">Preguntas</span>
        <p-button
          label="Agregar"
          icon="pi pi-plus"
          size="small"
          severity="secondary"
          [disabled]="items.length >= 20"
          (onClick)="add()"
        />
      </div>

      @for (it of items; track $index; let i = $index) {
        <div class="item">
          <div class="grow">
            <div class="sf-field">
              <label>Pregunta frecuente</label>
              <input
                pInputText
                [(ngModel)]="it.question"
                (ngModelChange)="emit()"
                maxlength="200"
              />
            </div>
            <div class="sf-field">
              <label>Respuesta</label>
              <textarea
                pTextarea
                rows="2"
                [(ngModel)]="it.answer"
                (ngModelChange)="emit()"
                maxlength="1000"
              ></textarea>
            </div>
          </div>
          <p-button
            icon="pi pi-trash"
            severity="danger"
            [text]="true"
            (onClick)="remove(i)"
            ariaLabel="Eliminar"
          />
        </div>
      }

      @if (items.length === 0) {
        <p class="text-muted text-sm">
          Agrega preguntas y respuestas para mejorar la confianza del cliente.
        </p>
      }
      @if (items.length >= 20) {
        <p class="text-warn text-xs">Máximo 20 preguntas por sección.</p>
      }
    </div>
  `,
  styles: [
    `
      .items-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 0.25rem;
      }
      .block-title {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--sf-text-muted);
      }
      .item {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.5rem;
        padding: 0.75rem;
        background: var(--sf-surface-2);
        border-radius: 10px;
        align-items: start;
      }
      .grow { min-width: 0; }
      .text-warn { color: var(--sf-warn); }
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
export class FaqSectionEditorComponent implements OnChanges {
  @Input() data: FaqData = {};
  @Output() dataChange = new EventEmitter<FaqData>();

  form: { eyebrow?: string; title?: string } = {};
  variant: NonNullable<FaqData['variant']> = 'accordion';
  items: FaqItem[] = [];

  bgColor         = '';
  cardBgColor     = '';
  cardTextColor   = '';
  cardBorderColor = '';
  cardRadius      = '';
  cardShadow      = '';

  readonly presets = COLOR_PRESETS;

  readonly variants = [
    { value: 'accordion',  label: 'Acordeón' },
    { value: 'list',       label: 'Lista simple' },
    { value: 'twoColumns', label: 'Dos columnas' },
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
      eyebrow: this.data?.eyebrow ?? '',
      title: this.data?.title ?? '',
    };
    this.variant = this.data?.variant ?? 'accordion';
    this.items = (this.data?.items ?? []).map((i) => ({ ...i }));

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

  add(): void {
    if (this.items.length >= 20) return;
    this.items.push({ question: '', answer: '' });
    this.emit();
  }

  remove(idx: number): void {
    this.items.splice(idx, 1);
    this.emit();
  }

  emit(): void {
    const cleaned = this.items.filter(
      (i) => i.question?.trim() && i.answer?.trim(),
    );
    const out: FaqData = { items: cleaned, variant: this.variant };
    if (this.form.eyebrow) out.eyebrow = this.form.eyebrow;
    if (this.form.title) out.title = this.form.title;

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
