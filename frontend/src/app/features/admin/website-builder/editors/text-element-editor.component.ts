import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TextStyle } from '@core/models/website-builder.model';

export const PREVIEW_FONTS: Array<{ label: string; family: string }> = [
  { label: 'Sistema',   family: "'Segoe UI', system-ui, -apple-system, sans-serif" },
  { label: 'Arial',     family: 'Arial, Helvetica, sans-serif' },
  { label: 'Verdana',   family: 'Verdana, Geneva, Tahoma, sans-serif' },
  { label: 'Trebuchet', family: "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif" },
  { label: 'Lucida',    family: "'Lucida Sans', 'Lucida Grande', sans-serif" },
  { label: 'Georgia',   family: "Georgia, 'Times New Roman', serif" },
  { label: 'Palatino',  family: "Palatino, 'Palatino Linotype', 'Book Antiqua', serif" },
  { label: 'Times',     family: "'Times New Roman', Times, serif" },
  { label: 'Garamond',  family: "Garamond, 'Hoefler Text', 'Times New Roman', serif" },
  { label: 'Courier',   family: "'Courier New', Courier, monospace" },
];

const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 80, 96];

const FONT_WEIGHTS = [
  { label: 'Ligera',   value: '300' },
  { label: 'Normal',   value: '400' },
  { label: 'Medio',    value: '500' },
  { label: 'Semi',     value: '600' },
  { label: 'Negrita',  value: '700' },
  { label: 'Extra',    value: '800' },
];

const TEXT_ALIGNS: Array<{ icon: string; value: TextStyle['textAlign'] }> = [
  { icon: 'pi-align-left',    value: 'left' },
  { icon: 'pi-align-center',  value: 'center' },
  { icon: 'pi-align-right',   value: 'right' },
  { icon: 'pi-align-justify', value: 'justify' },
];

const TEXT_TRANSFORMS: Array<{ label: string; value: TextStyle['textTransform'] }> = [
  { label: 'Normal',    value: 'none' },
  { label: 'MAYÚS',     value: 'uppercase' },
  { label: 'minús',     value: 'lowercase' },
  { label: '1er Letra', value: 'capitalize' },
];

const LETTER_SPACINGS: Array<{ label: string; value: string }> = [
  { label: 'Apretado',  value: '-0.05em' },
  { label: 'Normal',    value: '0em' },
  { label: 'Amplio',    value: '0.05em' },
  { label: 'Abierto',   value: '0.1em' },
];

const LINE_HEIGHTS: Array<{ label: string; value: string }> = [
  { label: 'Compacto', value: '1.2' },
  { label: 'Normal',   value: '1.5' },
  { label: 'Amplio',   value: '1.75' },
  { label: 'Doble',    value: '2' },
];

const COLOR_PRESETS = [
  '#0f172a', '#334155', '#64748b', '#94a3b8',
  '#ffffff', '#f8fafc', '#e2e8f0', '#cbd5e1',
  '#1d4ed8', '#3b82f6', '#7c3aed', '#db2777',
  '#16a34a', '#ca8a04', '#dc2626', '#0891b2',
];

const ELEMENT_LABELS: Record<string, string> = {
  title:    'Título',
  subtitle: 'Subtítulo',
  eyebrow:  'Texto superior',
  body:     'Párrafo / cuerpo',
};

@Component({
  selector: 'app-text-element-editor',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="te-root">
      <!-- Header -->
      <div class="te-head">
        <button type="button" class="back-btn" (click)="close.emit()">
          <i class="pi pi-arrow-left"></i> Volver
        </button>
        <div class="te-label">
          <span class="pill">{{ elementLabel }}</span>
          <span class="editing-hint">Editando texto</span>
        </div>
      </div>

      <!-- Preview del texto actual -->
      <div class="te-preview" [style.fontFamily]="localStyle.fontFamily || null"
                               [style.fontSize]="localStyle.fontSize || null"
                               [style.fontWeight]="localStyle.fontWeight || null"
                               [style.fontStyle]="localStyle.fontStyle || null"
                               [style.textAlign]="localStyle.textAlign || null"
                               [style.textTransform]="localStyle.textTransform || null"
                               [style.letterSpacing]="localStyle.letterSpacing || null"
                               [style.color]="localStyle.color || null">
        Texto de ejemplo
      </div>

      <div class="te-body">

        <!-- Color -->
        <div class="sec-label">Color del texto</div>
        <div class="color-ctrl">
          <label class="swatch-wrap" title="Selector de color">
            <span class="swatch" [style.background]="localStyle.color || null"
                  [class.empty]="!localStyle.color"></span>
            <input type="color" class="hidden-input"
                   [value]="localStyle.color || '#000000'"
                   (change)="onColorPick($event)" />
          </label>
          <input class="hex-input" [(ngModel)]="localStyle.color"
                 (ngModelChange)="onHexChange()" placeholder="#0f172a" maxlength="9" />
          @if (localStyle.color) {
            <button type="button" class="clear-xs" (click)="localStyle.color = undefined; emit()">
              <i class="pi pi-times"></i>
            </button>
          }
        </div>
        <div class="presets">
          @for (c of COLOR_PRESETS; track c) {
            <button type="button" class="preset" [style.background]="c"
                    [class.active]="localStyle.color === c" [title]="c"
                    (click)="localStyle.color = c; emit()"></button>
          }
        </div>

        <!-- Fuente -->
        <div class="sec-label mt">Tipografía</div>
        <div class="font-grid">
          @for (f of FONTS; track f.family) {
            <button type="button" class="font-btn"
                    [class.active]="localStyle.fontFamily === f.family"
                    [style.fontFamily]="f.family"
                    (click)="localStyle.fontFamily = f.family; emit()"
                    [title]="f.label">
              <span class="font-name">{{ f.label }}</span>
              <span class="font-preview">Aa Bb</span>
            </button>
          }
          @if (localStyle.fontFamily) {
            <button type="button" class="font-btn clear-font"
                    (click)="localStyle.fontFamily = undefined; emit()">
              <span class="font-name">Limpiar</span>
              <i class="pi pi-times"></i>
            </button>
          }
        </div>

        <!-- Tamaño -->
        <div class="sec-label mt">Tamaño</div>
        <div class="size-grid">
          @for (s of SIZES; track s) {
            <button type="button" class="size-btn"
                    [class.active]="localStyle.fontSize === s + 'px'"
                    (click)="localStyle.fontSize = s + 'px'; emit()">
              {{ s }}
            </button>
          }
        </div>
        <div class="custom-size">
          <input type="number" [(ngModel)]="customPx" (ngModelChange)="onCustomSize()"
                 min="8" max="200" placeholder="px personalizado" />
          <span class="unit-label">px</span>
        </div>

        <!-- Peso -->
        <div class="sec-label mt">Peso</div>
        <div class="btn-row">
          @for (w of WEIGHTS; track w.value) {
            <button type="button" class="toggle-btn"
                    [class.active]="localStyle.fontWeight === w.value"
                    [style.fontWeight]="w.value"
                    (click)="toggleProp('fontWeight', w.value)">
              {{ w.label }}
            </button>
          }
        </div>

        <!-- Estilo / Cursiva -->
        <div class="sec-label mt">Estilo</div>
        <div class="btn-row">
          <button type="button" class="toggle-btn"
                  [class.active]="!localStyle.fontStyle || localStyle.fontStyle === 'normal'"
                  (click)="localStyle.fontStyle = 'normal'; emit()">Normal</button>
          <button type="button" class="toggle-btn italic-btn"
                  [class.active]="localStyle.fontStyle === 'italic'"
                  (click)="localStyle.fontStyle = 'italic'; emit()"><i>Cursiva</i></button>
        </div>

        <!-- Alineación -->
        <div class="sec-label mt">Alineación</div>
        <div class="btn-row">
          @for (a of ALIGNS; track a.value) {
            <button type="button" class="toggle-btn icon-btn"
                    [class.active]="localStyle.textAlign === a.value"
                    [title]="a.value"
                    (click)="toggleProp('textAlign', a.value)">
              <i class="pi {{ a.icon }}"></i>
            </button>
          }
        </div>

        <!-- Transformación -->
        <div class="sec-label mt">Transformación</div>
        <div class="btn-row wrap">
          @for (t of TRANSFORMS; track t.value) {
            <button type="button" class="toggle-btn"
                    [class.active]="localStyle.textTransform === t.value"
                    [style.textTransform]="t.value"
                    (click)="toggleProp('textTransform', t.value)">
              {{ t.label }}
            </button>
          }
        </div>

        <!-- Espaciado entre letras -->
        <div class="sec-label mt">Espaciado de letras</div>
        <div class="btn-row wrap">
          @for (l of LETTER_SPACINGS; track l.value) {
            <button type="button" class="toggle-btn"
                    [class.active]="localStyle.letterSpacing === l.value"
                    (click)="toggleProp('letterSpacing', l.value)">
              {{ l.label }}
            </button>
          }
        </div>

        <!-- Altura de línea -->
        <div class="sec-label mt">Altura de línea</div>
        <div class="btn-row">
          @for (lh of LINE_HEIGHTS; track lh.value) {
            <button type="button" class="toggle-btn"
                    [class.active]="localStyle.lineHeight === lh.value"
                    (click)="toggleProp('lineHeight', lh.value)">
              {{ lh.label }}
            </button>
          }
        </div>

        <!-- Reset -->
        <button type="button" class="reset-btn" (click)="resetStyle()">
          <i class="pi pi-refresh"></i> Resetear estilo de {{ elementLabel }}
        </button>

      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .te-root { display: flex; flex-direction: column; height: 100%; }
      .te-head {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding-bottom: 0.75rem;
        margin-bottom: 0.75rem;
        border-bottom: 1px solid var(--sf-border);
      }
      .back-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--sf-text-muted);
        background: var(--sf-surface-2);
        border: 1px solid var(--sf-border);
        border-radius: 8px;
        padding: 0.3rem 0.65rem;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: border-color 0.12s, color 0.12s;
      }
      .back-btn:hover { border-color: var(--sf-border-strong); color: var(--sf-text); }
      .te-label { min-width: 0; }
      .pill {
        display: inline-flex;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        background: var(--sf-primary-soft);
        color: var(--sf-primary);
        padding: 0.18rem 0.5rem;
        border-radius: 999px;
      }
      .editing-hint { display: block; font-size: 0.72rem; color: var(--sf-text-muted); margin-top: 0.1rem; }
      .te-preview {
        border: 1px dashed var(--sf-border);
        border-radius: 8px;
        padding: 0.55rem 0.75rem;
        margin-bottom: 0.85rem;
        font-size: 1.1rem;
        font-weight: 600;
        color: var(--sf-text);
        background: var(--sf-surface-2);
        min-height: 2.5rem;
        transition: all 0.15s;
      }
      .te-body { flex: 1; overflow-y: auto; }
      .sec-label {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--sf-text-muted);
        margin-bottom: 0.4rem;
      }
      .sec-label.mt { margin-top: 0.9rem; }
      /* Color */
      .color-ctrl { display: flex; align-items: center; gap: 0.4rem; }
      .swatch-wrap { position: relative; cursor: pointer; flex-shrink: 0; }
      .swatch {
        display: block; width: 28px; height: 28px; border-radius: 7px;
        border: 2px solid var(--sf-border); transition: border-color 0.12s;
      }
      .swatch:hover { border-color: var(--sf-border-strong); }
      .swatch.empty {
        background: repeating-linear-gradient(
          45deg, #e2e8f0 0, #e2e8f0 3px, #fff 3px, #fff 8px
        ) !important;
      }
      .hidden-input {
        position: absolute; inset: 0; opacity: 0;
        width: 100%; height: 100%; cursor: pointer; padding: 0; border: none;
      }
      .hex-input {
        flex: 1; min-width: 0; border: 1px solid var(--sf-border); border-radius: 7px;
        height: 28px; padding: 0 0.5rem; font-size: 0.8rem;
        font-family: 'Courier New', monospace; color: var(--sf-text); background: #fff;
      }
      .hex-input:focus { outline: none; border-color: var(--sf-primary); }
      .clear-xs {
        width: 22px; height: 22px; flex-shrink: 0; display: inline-flex;
        align-items: center; justify-content: center; background: transparent;
        border: none; border-radius: 5px; cursor: pointer; color: var(--sf-text-muted); font-size: 0.65rem;
      }
      .clear-xs:hover { color: #dc2626; background: rgba(220,38,38,0.08); }
      .presets { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 0.4rem; }
      .preset {
        width: 20px; height: 20px; border-radius: 5px; border: 2px solid transparent;
        cursor: pointer; transition: transform 0.1s, border-color 0.1s; outline: 1px solid rgba(0,0,0,0.1);
      }
      .preset:hover { transform: scale(1.25); }
      .preset.active { border-color: var(--sf-primary); transform: scale(1.15); }
      /* Fuentes */
      .font-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4px;
      }
      .font-btn {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        padding: 0.45rem 0.6rem;
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 8px;
        cursor: pointer;
        transition: border-color 0.12s, background 0.12s;
        text-align: left;
        overflow: hidden;
      }
      .font-btn:hover { border-color: var(--sf-border-strong); background: var(--sf-surface); }
      .font-btn.active { border-color: var(--sf-primary); background: var(--sf-primary-soft); }
      .font-name { font-size: 0.65rem; font-weight: 700; font-family: inherit; text-transform: uppercase; letter-spacing: 0.06em; color: var(--sf-text-muted); }
      .font-btn.active .font-name { color: var(--sf-primary); }
      .font-preview { font-size: 0.95rem; font-weight: 500; color: var(--sf-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%; }
      .clear-font {
        background: var(--sf-surface-2);
        border-color: var(--sf-border);
        align-items: center;
        flex-direction: row;
        gap: 0.35rem;
        color: var(--sf-text-muted);
        font-size: 0.75rem;
      }
      .clear-font .font-name { color: var(--sf-text-muted); font-weight: 600; text-transform: none; letter-spacing: 0; }
      /* Tamaño */
      .size-grid { display: flex; flex-wrap: wrap; gap: 4px; }
      .size-btn {
        padding: 0.25rem 0.45rem;
        border: 1px solid var(--sf-border); border-radius: 6px;
        background: #fff; cursor: pointer; font-size: 0.75rem; color: var(--sf-text);
        min-width: 32px; text-align: center;
        transition: border-color 0.1s, background 0.1s;
      }
      .size-btn:hover { border-color: var(--sf-border-strong); }
      .size-btn.active { border-color: var(--sf-primary); background: var(--sf-primary-soft); color: var(--sf-primary); font-weight: 700; }
      .custom-size { display: flex; align-items: center; gap: 0.35rem; margin-top: 0.35rem; }
      .custom-size input {
        width: 90px; border: 1px solid var(--sf-border); border-radius: 7px;
        height: 28px; padding: 0 0.5rem; font-size: 0.8rem; color: var(--sf-text); background: #fff;
      }
      .custom-size input:focus { outline: none; border-color: var(--sf-primary); }
      .unit-label { font-size: 0.75rem; color: var(--sf-text-muted); }
      /* Botones de toggle */
      .btn-row {
        display: flex; gap: 4px;
        flex-wrap: nowrap;
      }
      .btn-row.wrap { flex-wrap: wrap; }
      .toggle-btn {
        flex: 1;
        padding: 0.3rem 0.5rem;
        border: 1px solid var(--sf-border); border-radius: 7px;
        background: #fff; cursor: pointer; font-size: 0.78rem; color: var(--sf-text);
        text-align: center; white-space: nowrap;
        transition: border-color 0.1s, background 0.1s, color 0.1s;
      }
      .toggle-btn.wrap { flex: none; }
      .toggle-btn:hover { border-color: var(--sf-border-strong); }
      .toggle-btn.active { border-color: var(--sf-primary); background: var(--sf-primary-soft); color: var(--sf-primary); font-weight: 700; }
      .toggle-btn.icon-btn { flex: none; width: 34px; padding: 0.3rem; }
      .italic-btn { font-style: italic; }
      .reset-btn {
        display: flex; align-items: center; gap: 0.4rem;
        width: 100%; margin-top: 1.25rem; padding: 0.55rem 0.75rem;
        border: 1px solid var(--sf-border); border-radius: 8px;
        background: var(--sf-surface-2); cursor: pointer;
        font-size: 0.78rem; color: var(--sf-text-muted);
        transition: background 0.12s, color 0.12s;
      }
      .reset-btn:hover { background: rgba(220,38,38,0.07); color: #dc2626; border-color: rgba(220,38,38,0.25); }
    `,
  ],
})
export class TextElementEditorComponent implements OnChanges {
  @Input({ required: true }) textKey!: string;
  @Input() textStyle: TextStyle = {};
  @Output() textStyleChange = new EventEmitter<TextStyle>();
  @Output() close = new EventEmitter<void>();

  localStyle: TextStyle = {};
  customPx: number | null = null;

  readonly COLOR_PRESETS = COLOR_PRESETS;
  readonly FONTS = PREVIEW_FONTS;
  readonly SIZES = FONT_SIZES;
  readonly WEIGHTS = FONT_WEIGHTS;
  readonly ALIGNS = TEXT_ALIGNS;
  readonly TRANSFORMS = TEXT_TRANSFORMS;
  readonly LETTER_SPACINGS = LETTER_SPACINGS;
  readonly LINE_HEIGHTS = LINE_HEIGHTS;

  get elementLabel(): string {
    return ELEMENT_LABELS[this.textKey] ?? this.textKey;
  }

  ngOnChanges(): void {
    this.localStyle = { ...(this.textStyle ?? {}) };
    const fs = this.localStyle.fontSize;
    if (fs?.endsWith('px')) {
      const n = parseFloat(fs);
      this.customPx = Number.isFinite(n) ? n : null;
    } else {
      this.customPx = null;
    }
  }

  onColorPick(event: Event): void {
    this.localStyle = { ...this.localStyle, color: (event.target as HTMLInputElement).value };
    this.emit();
  }

  onHexChange(): void {
    const c = this.localStyle.color;
    if (!c || /^#[0-9a-fA-F]{3,8}$/.test(c)) this.emit();
  }

  onCustomSize(): void {
    if (!this.customPx) return;
    const n = Math.max(8, Math.min(200, Math.round(this.customPx)));
    this.localStyle = { ...this.localStyle, fontSize: `${n}px` };
    this.emit();
  }

  toggleProp<K extends keyof TextStyle>(key: K, value: TextStyle[K]): void {
    this.localStyle = {
      ...this.localStyle,
      [key]: this.localStyle[key] === value ? undefined : value,
    };
    this.emit();
  }

  resetStyle(): void {
    this.localStyle = {};
    this.customPx = null;
    this.emit();
  }

  emit(): void {
    const out: TextStyle = {};
    if (this.localStyle.color)          out.color          = this.localStyle.color;
    if (this.localStyle.fontFamily)     out.fontFamily     = this.localStyle.fontFamily;
    if (this.localStyle.fontSize)       out.fontSize       = this.localStyle.fontSize;
    if (this.localStyle.fontWeight)     out.fontWeight     = this.localStyle.fontWeight;
    if (this.localStyle.fontStyle && this.localStyle.fontStyle !== 'normal')
                                        out.fontStyle      = this.localStyle.fontStyle;
    if (this.localStyle.textAlign)      out.textAlign      = this.localStyle.textAlign;
    if (this.localStyle.textTransform && this.localStyle.textTransform !== 'none')
                                        out.textTransform  = this.localStyle.textTransform;
    if (this.localStyle.letterSpacing && this.localStyle.letterSpacing !== '0em')
                                        out.letterSpacing  = this.localStyle.letterSpacing;
    if (this.localStyle.lineHeight)     out.lineHeight     = this.localStyle.lineHeight;
    this.textStyleChange.emit(out);
  }
}
