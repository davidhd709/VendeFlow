import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { BorderRadiusToken, CtaData, SectionStyle } from '@core/models/website-builder.model';

type CtaAction = 'QUOTE' | 'WHATSAPP' | 'CATALOG';

const PRESETS = [
  '#ffffff','#f8fafc','#0f172a','#1e293b','#2563eb','#4f46e5',
  '#7c3aed','#16a34a','#dc2626','#ea580c','#0891b2','#c9a84c',
];

@Component({
  selector: 'app-cta-section-editor',
  standalone: true,
  imports: [FormsModule, InputTextModule, TextareaModule],
  template: `
    <div class="sf-stack">

      <!-- Variante -->
      <div class="sf-field">
        <label>Diseño del CTA</label>
        <div class="chip-group">
          @for (v of variants; track v.value) {
            <button type="button" class="style-chip" [class.active]="variant === v.value" (click)="variant=v.value; emit()">
              {{ v.label }}
            </button>
          }
        </div>
      </div>

      <!-- Estilo visual -->
      <div class="sf-field">
        <label>Tono del fondo</label>
        <div class="chip-group">
          @for (s of styleVariants; track s.value) {
            <button type="button" class="style-chip" [class.active]="styleVariant===s.value"
              (click)="styleVariant=s.value; bgColor=''; emit()">{{ s.label }}</button>
          }
          <button type="button" class="style-chip" [class.active]="styleVariant==='CUSTOM'"
            (click)="styleVariant='CUSTOM'; emit()">Personalizado</button>
        </div>
        <small class="sf-field-help">Con "Personalizado" puedes elegir el color exacto abajo.</small>
      </div>

      <!-- Colores -->
      <div class="style-group">
        <div class="group-title">Colores</div>

        @if (styleVariant === 'CUSTOM') {
          <div class="color-row">
            <label>Fondo del bloque</label>
            <div class="color-input-group">
              <input type="color" [value]="bgColor || '#0f172a'" (input)="onClr('bg', $event)" class="color-swatch" />
              <input pInputText [(ngModel)]="bgColor" (ngModelChange)="emit()" maxlength="7" placeholder="—" class="color-hex" />
              @if (bgColor) { <button type="button" (click)="bgColor=''; emit()" class="color-clear">×</button> }
            </div>
            <div class="presets-row">
              @for (c of presets; track c) { <button class="pdot" [style.background]="c" (click)="bgColor=c; emit()" [title]="c" type="button"></button> }
            </div>
          </div>
        }

        <div class="color-row">
          <label>Botón — fondo</label>
          <div class="color-input-group">
            <input type="color" [value]="btnBgColor || '#16a34a'" (input)="onClr('btnBg', $event)" class="color-swatch" />
            <input pInputText [(ngModel)]="btnBgColor" (ngModelChange)="emit()" maxlength="7" placeholder="—" class="color-hex" />
            @if (btnBgColor) { <button type="button" (click)="btnBgColor=''; emit()" class="color-clear">×</button> }
          </div>
          <div class="presets-row">
            @for (c of presets; track c) { <button class="pdot" [style.background]="c" (click)="btnBgColor=c; emit()" [title]="c" type="button"></button> }
          </div>
        </div>

        <div class="color-row">
          <label>Botón — texto</label>
          <div class="color-input-group">
            <input type="color" [value]="btnTextColor || '#ffffff'" (input)="onClr('btnText', $event)" class="color-swatch" />
            <input pInputText [(ngModel)]="btnTextColor" (ngModelChange)="emit()" maxlength="7" placeholder="—" class="color-hex" />
            @if (btnTextColor) { <button type="button" (click)="btnTextColor=''; emit()" class="color-clear">×</button> }
          </div>
        </div>

        <div class="sf-field">
          <label>Forma del botón</label>
          <div class="chip-group">
            @for (r of radiusOpts; track r.value) {
              <button type="button" class="style-chip" [class.active]="btnRadius===r.value"
                (click)="btnRadius=r.value; emit()">{{ r.label }}</button>
            }
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div class="sf-field">
        <label>Título</label>
        <input pInputText [(ngModel)]="form.title" (ngModelChange)="emit()" maxlength="120"
          placeholder="¿No sabes qué celular elegir?" />
      </div>
      <div class="sf-field">
        <label>Descripción</label>
        <textarea pTextarea rows="3" [(ngModel)]="form.description" (ngModelChange)="emit()" maxlength="260"
          placeholder="Cuéntanos tu presupuesto y te ayudamos a encontrar la mejor opción."></textarea>
      </div>

      <div class="cta-block">
        <div class="block-title">Botón principal</div>
        <div class="sf-field">
          <label>Texto</label>
          <input pInputText [(ngModel)]="primaryLabel" (ngModelChange)="emit()" maxlength="40"
            placeholder="Solicitar cotización" />
        </div>
        <div class="sf-field">
          <label>Acción al hacer clic</label>
          <select [(ngModel)]="primaryAction" (ngModelChange)="emit()">
            <option value="QUOTE">Formulario de cotización</option>
            <option value="WHATSAPP">Abrir WhatsApp</option>
            <option value="CATALOG">Ver catálogo</option>
          </select>
        </div>
      </div>

      <div class="cta-block">
        <div class="block-title">Botón secundario <span class="text-muted text-xs">(opcional)</span></div>
        <div class="sf-field">
          <label>Texto</label>
          <input pInputText [(ngModel)]="secondaryLabel" (ngModelChange)="emit()" maxlength="40" />
        </div>
      </div>

    </div>
  `,
  styles: [`
    .cta-block { border: 1px solid var(--sf-border); border-radius: 10px; padding: 0.85rem; background: var(--sf-surface-2); display: flex; flex-direction: column; gap: 0.4rem; }
    .block-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sf-text-muted); }
    select { width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; height: 2.35rem; padding: 0 0.65rem; color: var(--sf-text); background: #fff; }
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
  `],
})
export class CtaSectionEditorComponent implements OnChanges {
  @Input() data: CtaData = {};
  @Output() dataChange = new EventEmitter<CtaData>();

  readonly presets = PRESETS;
  readonly variants = [
    { value: 'centered', label: 'Centrado' },
    { value: 'banner',   label: 'Con imagen' },
    { value: 'split',    label: 'Dividido' },
  ] as const;
  readonly styleVariants = [
    { value: 'DARK',  label: 'Oscuro' },
    { value: 'LIGHT', label: 'Claro' },
  ] as const;
  readonly radiusOpts = [
    { value: '',     label: 'Default' },
    { value: 'none', label: 'Cuadrado' },
    { value: 'sm',   label: 'Poco' },
    { value: 'md',   label: 'Medio' },
    { value: 'lg',   label: 'Amplio' },
    { value: 'full', label: 'Pill' },
  ];

  form: CtaData = {};
  variant: NonNullable<CtaData['variant']> = 'centered';
  styleVariant: 'DARK' | 'LIGHT' | 'CUSTOM' = 'DARK';
  primaryLabel  = '';
  secondaryLabel = '';
  primaryAction: CtaAction = 'QUOTE';
  bgColor      = '';
  btnBgColor   = '';
  btnTextColor = '';
  btnRadius    = '';

  ngOnChanges(): void {
    this.form = {
      title:       this.data?.title       ?? '',
      description: this.data?.description ?? this.data?.subtitle ?? '',
    };
    this.variant        = this.data?.variant ?? 'centered';
    this.styleVariant   = (this.data?.styleVariant as 'DARK'|'LIGHT'|'CUSTOM') ?? 'DARK';
    this.primaryLabel   = this.data?.ctaPrimary?.label   ?? '';
    this.secondaryLabel = this.data?.ctaSecondary?.label ?? '';
    this.primaryAction  = (this.data?.primaryAction as CtaAction) ?? 'QUOTE';
    const s = this.data?.style;
    this.bgColor      = s?.bgColor                 ?? '';
    this.btnBgColor   = s?.primaryBtn?.bgColor      ?? '';
    this.btnTextColor = s?.primaryBtn?.textColor    ?? '';
    this.btnRadius    = s?.primaryBtn?.borderRadius ?? '';
  }

  onClr(field: string, event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    if (field === 'bg')      this.bgColor      = v;
    if (field === 'btnBg')   this.btnBgColor   = v;
    if (field === 'btnText') this.btnTextColor = v;
    this.emit();
  }

  emit(): void {
    const out: CtaData = { variant: this.variant };
    if (this.styleVariant !== 'CUSTOM') out.styleVariant = this.styleVariant;
    if ((this.form.title ?? '').trim()) out.title = this.form.title!.trim();
    if ((this.form.description ?? '').trim()) {
      out.description = this.form.description!.trim();
      out.subtitle    = this.form.description!.trim();
    }
    if (this.primaryLabel.trim()) {
      out.ctaPrimary    = { label: this.primaryLabel.trim() };
      out.primaryAction = this.primaryAction;
    }
    if (this.secondaryLabel.trim()) out.ctaSecondary = { label: this.secondaryLabel.trim() };

    const style: SectionStyle = {};
    if (this.styleVariant === 'CUSTOM' && this.bgColor) style.bgColor = this.bgColor;
    if (this.btnBgColor || this.btnTextColor || this.btnRadius) {
      style.primaryBtn = {};
      if (this.btnBgColor)   style.primaryBtn.bgColor      = this.btnBgColor;
      if (this.btnTextColor) style.primaryBtn.textColor    = this.btnTextColor;
      if (this.btnRadius)    style.primaryBtn.borderRadius = this.btnRadius as BorderRadiusToken;
    }
    if (Object.keys(style).length > 0) out.style = style;

    this.dataChange.emit(out);
  }
}
