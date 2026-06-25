import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FooterData, SectionStyle } from '@core/models/website-builder.model';

const COLOR_PRESETS = [
  '#ffffff','#f8fafc','#f1f5f9','#0f172a','#1e293b',
  '#2563eb','#4f46e5','#7c3aed','#16a34a','#ea580c','#0891b2','#c9a84c',
];

@Component({
  selector: 'app-footer-section-editor',
  standalone: true,
  imports: [FormsModule, InputTextModule, TextareaModule],
  template: `
    <div class="sf-stack">
      <div class="intro">
        <h4>Pie de página</h4>
        <p>Configura el mensaje final de tu marca y la información de cierre.</p>
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

      <!-- Colores del pie de página -->
      <div class="style-group">
        <div class="group-title">Colores del pie de página</div>

        <div class="color-row">
          <label>Fondo del footer</label>
          <div class="color-input-group">
            <input type="color" class="color-swatch" [value]="bgColor || '#0f172a'"
              (input)="onColor('bg', $event)" />
            <input pInputText class="color-hex" [(ngModel)]="bgColor" (ngModelChange)="emit()"
              maxlength="7" placeholder="#0f172a" />
            <button type="button" class="color-clear" (click)="bgColor=''; emit()">×</button>
          </div>
          <div class="presets-row">
            @for (c of presets; track c) {
              <button type="button" class="pdot" [style.background]="c" (click)="bgColor=c; emit()"></button>
            }
          </div>
        </div>

        <div class="color-row">
          <label>Color del texto</label>
          <div class="color-input-group">
            <input type="color" class="color-swatch" [value]="textColor || '#f8fafc'"
              (input)="onColor('text', $event)" />
            <input pInputText class="color-hex" [(ngModel)]="textColor" (ngModelChange)="emit()"
              maxlength="7" placeholder="#f8fafc" />
            <button type="button" class="color-clear" (click)="textColor=''; emit()">×</button>
          </div>
          <div class="presets-row">
            @for (c of presets; track c) {
              <button type="button" class="pdot" [style.background]="c" (click)="textColor=c; emit()"></button>
            }
          </div>
        </div>
      </div>

      <!-- Contenido -->
      <div class="sf-field">
        <label>Descripción corta</label>
        <textarea
          pTextarea
          rows="3"
          [(ngModel)]="form.description"
          (ngModelChange)="emit()"
          maxlength="260"
        ></textarea>
      </div>

      <div class="sf-field">
        <label>Texto de derechos reservados</label>
        <input
          pInputText
          [(ngModel)]="form.copyrightText"
          (ngModelChange)="emit()"
          maxlength="120"
          placeholder="Todos los derechos reservados"
        />
      </div>

      <div class="grid-2">
        <div class="sf-field">
          <label>WhatsApp visible</label>
          <input pInputText [(ngModel)]="form.whatsapp" (ngModelChange)="emit()" maxlength="30" />
        </div>
        <div class="sf-field">
          <label>Email visible</label>
          <input pInputText [(ngModel)]="form.email" (ngModelChange)="emit()" maxlength="120" />
        </div>
      </div>

      <label class="toggle-row">
        <input type="checkbox" [(ngModel)]="form.showPoweredBySalesflow" (ngModelChange)="emit()" />
        <span>Mostrar "Powered by SalesFlow"</span>
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
      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.6rem;
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
      @media (max-width: 680px) {
        .grid-2 { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class FooterSectionEditorComponent implements OnChanges {
  @Input() data: FooterData = {};
  @Output() dataChange = new EventEmitter<FooterData>();

  form: FooterData = {};
  variant: NonNullable<FooterData['variant']> = 'simple';

  bgColor   = '';
  textColor = '';

  readonly presets = COLOR_PRESETS;

  readonly variants = [
    { value: 'simple',  label: 'Footer simple' },
    { value: 'columns', label: 'Con columnas' },
    { value: 'compact', label: 'Compacto' },
  ] as const;

  ngOnChanges(): void {
    this.form = {
      description:
        this.data?.description ??
        'Atención cercana, asesoría honesta y productos confiables para tu próxima compra.',
      copyrightText:
        this.data?.copyrightText ?? 'Todos los derechos reservados',
      whatsapp: this.data?.whatsapp ?? '',
      email: this.data?.email ?? '',
      showPoweredBySalesflow: this.data?.showPoweredBySalesflow ?? true,
    };
    this.variant = this.data?.variant ?? 'simple';

    const s = this.data?.style;
    this.bgColor   = s?.bgColor      ?? '';
    this.textColor = s?.body?.color  ?? '';
  }

  onColor(field: string, event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    if (field === 'bg')   this.bgColor   = v;
    if (field === 'text') this.textColor = v;
    this.emit();
  }

  emit(): void {
    const out: FooterData = {
      variant: this.variant,
      showPoweredBySalesflow: !!this.form.showPoweredBySalesflow,
    };
    if (this.form.description?.trim()) out.description = this.form.description.trim();
    if (this.form.copyrightText?.trim()) out.copyrightText = this.form.copyrightText.trim();
    if (this.form.whatsapp?.trim()) out.whatsapp = this.form.whatsapp.trim();
    if (this.form.email?.trim()) out.email = this.form.email.trim();

    const style: SectionStyle = {};
    if (this.bgColor)   style.bgColor = this.bgColor;
    if (this.textColor) style.body    = { color: this.textColor };
    if (Object.keys(style).length) out.style = style;

    this.dataChange.emit(out);
  }
}
