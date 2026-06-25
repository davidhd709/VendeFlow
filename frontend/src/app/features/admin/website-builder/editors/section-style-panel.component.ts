import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PaddingYToken, SectionStyle } from '@core/models/website-builder.model';

const PRESET_BG = [
  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0',
  '#0f172a', '#1e293b', '#1d4ed8', '#3b82f6',
  '#7c3aed', '#db2777', '#dc2626', '#16a34a',
  '#ca8a04', '#ea580c', '#dbeafe', '#fef9c3',
];

const FONT_OPTIONS: Array<{ value: NonNullable<SectionStyle['fontFamily']> | ''; label: string; css: string }> = [
  { value: '',        label: 'Predeterminada', css: 'inherit' },
  { value: 'sans',    label: 'Sans',    css: "'Helvetica Neue', Arial, sans-serif" },
  { value: 'serif',   label: 'Serif',   css: "Georgia, 'Times New Roman', serif" },
  { value: 'display', label: 'Display', css: "Palatino, 'Book Antiqua', serif" },
];

const PADDING_OPTIONS: Array<{ value: PaddingYToken | ''; label: string }> = [
  { value: '',    label: 'Auto' },
  { value: 'none', label: 'Ninguno' },
  { value: 'xs',  label: 'XS' },
  { value: 'sm',  label: 'S' },
  { value: 'md',  label: 'M' },
  { value: 'lg',  label: 'L' },
  { value: 'xl',  label: 'XL' },
];

@Component({
  selector: 'app-section-style-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="style-panel">
      <div class="panel-header" (click)="expanded = !expanded">
        <span class="panel-title"><i class="pi pi-palette"></i> Estilo de sección</span>
        <i class="pi pi-angle-down caret" [class.rotated]="expanded"></i>
      </div>

      @if (expanded) {
        <div class="panel-body">

          <!-- ── Color de fondo ── -->
          <div class="section-label">Fondo</div>
          <div class="color-control">
            <label class="swatch-wrap" title="Abrir selector de color">
              <span class="swatch" [style.background]="bgColor || null" [class.empty]="!bgColor"></span>
              <input type="color" class="hidden-input" [value]="bgColor || '#ffffff'"
                     (change)="onPickBg($event)" />
            </label>
            <input class="hex-input" [(ngModel)]="bgColor" (ngModelChange)="onHexBg()"
                   placeholder="#ffffff" maxlength="9" />
            @if (bgColor) {
              <button type="button" class="clear-btn" (click)="bgColor = ''; emit()" title="Quitar fondo">
                <i class="pi pi-times"></i>
              </button>
            }
          </div>
          <div class="presets">
            @for (c of BG_PRESETS; track c) {
              <button type="button" class="preset" [style.background]="c"
                      [class.active]="bgColor === c" [title]="c"
                      (click)="bgColor = c; emit()"></button>
            }
          </div>

          <!-- ── Espaciado vertical ── -->
          <div class="section-label mt">Espaciado vertical</div>
          <div class="font-buttons">
            @for (opt of PADDINGS; track opt.value) {
              <button type="button" class="font-btn"
                      [class.active]="paddingY === opt.value"
                      (click)="paddingY = opt.value; emit()">
                {{ opt.label }}
              </button>
            }
          </div>

          <!-- ── Tipografía de sección ── -->
          <div class="section-label mt">Tipografía de sección</div>
          <div class="font-buttons">
            @for (opt of FONTS; track opt.value) {
              <button type="button" class="font-btn"
                      [class.active]="fontFamily === opt.value"
                      [style.fontFamily]="opt.css"
                      (click)="fontFamily = opt.value; emit()">
                {{ opt.label }}
              </button>
            }
          </div>
          <p class="hint">Para colores y tipografía por elemento, haz clic en el texto o elemento dentro del preview.</p>

        </div>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .style-panel {
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        overflow: hidden;
        margin-bottom: 1rem;
        background: #fff;
      }
      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.55rem 0.75rem;
        cursor: pointer;
        background: var(--sf-surface-2);
        user-select: none;
        transition: background 0.12s;
      }
      .panel-header:hover { background: var(--sf-surface); }
      .panel-title {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--sf-primary);
      }
      .caret { font-size: 0.7rem; color: var(--sf-text-muted); transition: transform 0.15s; }
      .caret.rotated { transform: rotate(180deg); }
      .panel-body {
        padding: 0.75rem;
        border-top: 1px solid var(--sf-border);
      }
      .section-label {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.07em;
        color: var(--sf-text-muted);
        margin-bottom: 0.4rem;
      }
      .section-label.mt { margin-top: 0.85rem; }
      .color-control {
        display: flex;
        align-items: center;
        gap: 0.4rem;
      }
      .swatch-wrap {
        position: relative;
        cursor: pointer;
        flex-shrink: 0;
      }
      .swatch {
        display: block;
        width: 28px;
        height: 28px;
        border-radius: 7px;
        border: 2px solid var(--sf-border);
        transition: border-color 0.12s;
      }
      .swatch:hover { border-color: var(--sf-border-strong); }
      .swatch.empty {
        background: repeating-linear-gradient(
          45deg, #e2e8f0 0, #e2e8f0 3px, #ffffff 3px, #ffffff 8px
        ) !important;
      }
      .hidden-input {
        position: absolute;
        inset: 0;
        opacity: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
        padding: 0;
        border: none;
      }
      .hex-input {
        flex: 1;
        min-width: 0;
        border: 1px solid var(--sf-border);
        border-radius: 7px;
        height: 28px;
        padding: 0 0.5rem;
        font-size: 0.8rem;
        font-family: 'Courier New', monospace;
        color: var(--sf-text);
        background: #fff;
      }
      .hex-input:focus { outline: none; border-color: var(--sf-primary); }
      .clear-btn {
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        color: var(--sf-text-muted);
        font-size: 0.65rem;
        transition: color 0.12s, background 0.12s;
      }
      .clear-btn:hover { color: #dc2626; background: rgba(220,38,38,0.08); }
      .presets {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 0.4rem;
      }
      .preset {
        width: 20px;
        height: 20px;
        border-radius: 5px;
        border: 2px solid transparent;
        cursor: pointer;
        transition: transform 0.1s, border-color 0.1s;
        outline: 1px solid rgba(0,0,0,0.1);
      }
      .preset:hover { transform: scale(1.25); }
      .preset.active { border-color: var(--sf-primary); transform: scale(1.15); }
      .font-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem;
      }
      .font-btn {
        padding: 0.28rem 0.65rem;
        border: 1px solid var(--sf-border);
        border-radius: 7px;
        background: #fff;
        font-size: 0.8rem;
        cursor: pointer;
        color: var(--sf-text);
        transition: border-color 0.12s, background 0.12s, color 0.12s;
        white-space: nowrap;
      }
      .font-btn:hover { border-color: var(--sf-border-strong); background: var(--sf-surface); }
      .font-btn.active { border-color: var(--sf-primary); background: var(--sf-primary-soft); color: var(--sf-primary); }
      .hint {
        margin: 0.55rem 0 0;
        font-size: 0.72rem;
        color: var(--sf-text-muted);
        line-height: 1.4;
      }
    `,
  ],
})
export class SectionStylePanelComponent implements OnChanges {
  @Input() style: SectionStyle = {};
  @Output() styleChange = new EventEmitter<SectionStyle>();

  bgColor = '';
  fontFamily: NonNullable<SectionStyle['fontFamily']> | '' = '';
  paddingY: PaddingYToken | '' = '';
  expanded = true;

  readonly BG_PRESETS = PRESET_BG;
  readonly FONTS = FONT_OPTIONS;
  readonly PADDINGS = PADDING_OPTIONS;

  ngOnChanges(): void {
    this.bgColor    = this.style?.bgColor    ?? '';
    this.fontFamily = this.style?.fontFamily ?? '';
    this.paddingY   = this.style?.paddingY   ?? '';
  }

  onPickBg(event: Event): void {
    this.bgColor = (event.target as HTMLInputElement).value;
    this.emit();
  }

  onHexBg(): void {
    if (!this.bgColor || /^#[0-9a-fA-F]{3,8}$/.test(this.bgColor)) this.emit();
  }

  emit(): void {
    const out: SectionStyle = {};
    if (this.bgColor && /^#[0-9a-fA-F]{3,8}$/.test(this.bgColor)) out.bgColor = this.bgColor;
    if (this.fontFamily) out.fontFamily = this.fontFamily as SectionStyle['fontFamily'];
    if (this.paddingY)   out.paddingY   = this.paddingY as PaddingYToken;
    this.styleChange.emit(out);
  }
}
