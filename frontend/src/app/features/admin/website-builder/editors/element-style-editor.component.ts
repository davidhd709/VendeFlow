import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BorderRadiusToken, ButtonStyle, CardStyle, ImageStyle, ShadowToken } from '@core/models/website-builder.model';

const COLOR_PRESETS = [
  '#0f172a', '#334155', '#64748b', '#ffffff',
  '#1d4ed8', '#3b82f6', '#16a34a', '#dc2626',
  '#7c3aed', '#db2777', '#ca8a04', '#0891b2',
];

const RADIUS_OPTIONS: Array<{ label: string; value: BorderRadiusToken; px: string }> = [
  { label: 'Ninguno', value: 'none', px: '0px' },
  { label: 'Suave',   value: 'sm',   px: '6px' },
  { label: 'Medio',   value: 'md',   px: '12px' },
  { label: 'Grande',  value: 'lg',   px: '18px' },
  { label: 'Extra',   value: 'xl',   px: '24px' },
  { label: 'Píldora', value: 'full', px: '999px' },
];

const SHADOW_OPTIONS: Array<{ label: string; value: ShadowToken }> = [
  { label: 'Ninguna', value: 'none' },
  { label: 'Suave',   value: 'sm' },
  { label: 'Media',   value: 'md' },
  { label: 'Fuerte',  value: 'lg' },
];

const ASPECT_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'Auto',  value: 'auto' },
  { label: '1:1',   value: '1/1' },
  { label: '4:3',   value: '4/3' },
  { label: '3:2',   value: '3/2' },
  { label: '16:9',  value: '16/9' },
];

const ELEMENT_LABELS: Record<string, string> = {
  'primary-btn':   'Botón principal',
  'secondary-btn': 'Botón secundario',
  card:            'Tarjetas / Items',
  image:           'Imágenes',
};

const RADIUS_CSS: Record<string, string> = {
  none: '0px', sm: '6px', md: '12px', lg: '18px', xl: '24px', full: '999px',
};
const SHADOW_CSS: Record<string, string> = {
  none: 'none',
  sm: '0 2px 8px rgba(15,23,42,0.08)',
  md: '0 8px 24px rgba(15,23,42,0.12)',
  lg: '0 16px 40px rgba(15,23,42,0.16)',
};

@Component({
  selector: 'app-element-style-editor',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="ee-root">

      <!-- Header -->
      <div class="ee-head">
        <button type="button" class="back-btn" (click)="close.emit()">
          <i class="pi pi-arrow-left"></i> Volver
        </button>
        <div>
          <span class="pill">{{ elementLabel }}</span>
          <span class="editing-hint">Editando elemento</span>
        </div>
      </div>

      <!-- Preview -->
      @if (isButton) {
        <div class="ee-preview">
          <button type="button" class="preview-btn"
                  [style.background]="localBtn.bgColor || null"
                  [style.color]="localBtn.textColor || null"
                  [style.borderColor]="localBtn.borderColor || null"
                  [style.borderWidth]="localBtn.borderColor ? '2px' : null"
                  [style.borderStyle]="localBtn.borderColor ? 'solid' : null"
                  [style.borderRadius]="rCss(localBtn.borderRadius)">
            {{ elementKey === 'primary-btn' ? 'Botón principal' : 'Botón secundario' }}
          </button>
        </div>
      }
      @if (isCard) {
        <div class="ee-preview card-prev"
             [style.background]="localCard.bgColor || null"
             [style.color]="localCard.textColor || null"
             [style.borderColor]="localCard.borderColor || null"
             [style.borderRadius]="rCss(localCard.borderRadius)"
             [style.boxShadow]="sCss(localCard.shadow)">
          <strong>Título del item</strong>
          <span>Descripción de ejemplo</span>
        </div>
      }
      @if (isImage) {
        <div class="ee-preview img-prev"
             [style.borderRadius]="rCss(localImg.borderRadius)"
             [style.aspectRatio]="localImg.aspectRatio !== 'auto' ? (localImg.aspectRatio || null) : null">
          <i class="pi pi-image"></i>
        </div>
      }

      <div class="ee-body">

        <!-- ══ BOTÓN ═════════════════════════════ -->
        @if (isButton) {

          <div class="sec-label">Fondo del botón</div>
          <div class="color-ctrl">
            <label class="swatch-wrap">
              <span class="swatch" [style.background]="localBtn.bgColor || null" [class.empty]="!localBtn.bgColor"></span>
              <input type="color" class="hidden-input" [value]="localBtn.bgColor || '#000000'"
                     (change)="onColor($event, 'btn-bg')" />
            </label>
            <input class="hex-input" [value]="localBtn.bgColor || ''" placeholder="#16a34a" maxlength="9"
                   (input)="onHex($event, 'btn-bg')" />
            @if (localBtn.bgColor) { <button type="button" class="clear-xs" (click)="clearProp('btn-bg')"><i class="pi pi-times"></i></button> }
          </div>
          <div class="presets">
            @for (c of PRESETS; track c) {
              <button type="button" class="preset" [style.background]="c" [title]="c"
                      [class.active]="localBtn.bgColor === c" (click)="applyPreset('btn-bg', c)"></button>
            }
          </div>

          <div class="sec-label mt">Color de texto</div>
          <div class="color-ctrl">
            <label class="swatch-wrap">
              <span class="swatch" [style.background]="localBtn.textColor || null" [class.empty]="!localBtn.textColor"></span>
              <input type="color" class="hidden-input" [value]="localBtn.textColor || '#ffffff'"
                     (change)="onColor($event, 'btn-text')" />
            </label>
            <input class="hex-input" [value]="localBtn.textColor || ''" placeholder="#ffffff" maxlength="9"
                   (input)="onHex($event, 'btn-text')" />
            @if (localBtn.textColor) { <button type="button" class="clear-xs" (click)="clearProp('btn-text')"><i class="pi pi-times"></i></button> }
          </div>
          <div class="presets">
            @for (c of PRESETS; track c) {
              <button type="button" class="preset" [style.background]="c" [title]="c"
                      [class.active]="localBtn.textColor === c" (click)="applyPreset('btn-text', c)"></button>
            }
          </div>

          <div class="sec-label mt">Color de borde</div>
          <div class="color-ctrl">
            <label class="swatch-wrap">
              <span class="swatch" [style.background]="localBtn.borderColor || null" [class.empty]="!localBtn.borderColor"></span>
              <input type="color" class="hidden-input" [value]="localBtn.borderColor || '#000000'"
                     (change)="onColor($event, 'btn-border')" />
            </label>
            <input class="hex-input" [value]="localBtn.borderColor || ''" placeholder="Sin borde" maxlength="9"
                   (input)="onHex($event, 'btn-border')" />
            @if (localBtn.borderColor) { <button type="button" class="clear-xs" (click)="clearProp('btn-border')"><i class="pi pi-times"></i></button> }
          </div>

          <div class="sec-label mt">Radio de esquinas</div>
          <div class="btn-row wrap">
            @for (r of RADIUS; track r.value) {
              <button type="button" class="toggle-btn"
                      [class.active]="localBtn.borderRadius === r.value"
                      [style.borderRadius]="r.px"
                      (click)="togglePropBtn('borderRadius', r.value)">{{ r.label }}</button>
            }
          </div>

          <button type="button" class="reset-btn" (click)="resetBtn()">
            <i class="pi pi-refresh"></i> Resetear botón
          </button>
        }

        <!-- ══ TARJETA ════════════════════════════ -->
        @if (isCard) {

          <div class="sec-label">Color de fondo</div>
          <div class="color-ctrl">
            <label class="swatch-wrap">
              <span class="swatch" [style.background]="localCard.bgColor || null" [class.empty]="!localCard.bgColor"></span>
              <input type="color" class="hidden-input" [value]="localCard.bgColor || '#ffffff'"
                     (change)="onColor($event, 'card-bg')" />
            </label>
            <input class="hex-input" [value]="localCard.bgColor || ''" placeholder="#ffffff" maxlength="9"
                   (input)="onHex($event, 'card-bg')" />
            @if (localCard.bgColor) { <button type="button" class="clear-xs" (click)="clearProp('card-bg')"><i class="pi pi-times"></i></button> }
          </div>
          <div class="presets">
            @for (c of PRESETS; track c) {
              <button type="button" class="preset" [style.background]="c" [title]="c"
                      [class.active]="localCard.bgColor === c" (click)="applyPreset('card-bg', c)"></button>
            }
          </div>

          <div class="sec-label mt">Color de texto</div>
          <div class="color-ctrl">
            <label class="swatch-wrap">
              <span class="swatch" [style.background]="localCard.textColor || null" [class.empty]="!localCard.textColor"></span>
              <input type="color" class="hidden-input" [value]="localCard.textColor || '#000000'"
                     (change)="onColor($event, 'card-text')" />
            </label>
            <input class="hex-input" [value]="localCard.textColor || ''" placeholder="Heredar" maxlength="9"
                   (input)="onHex($event, 'card-text')" />
            @if (localCard.textColor) { <button type="button" class="clear-xs" (click)="clearProp('card-text')"><i class="pi pi-times"></i></button> }
          </div>
          <div class="presets">
            @for (c of PRESETS; track c) {
              <button type="button" class="preset" [style.background]="c" [title]="c"
                      [class.active]="localCard.textColor === c" (click)="applyPreset('card-text', c)"></button>
            }
          </div>

          <div class="sec-label mt">Color de borde</div>
          <div class="color-ctrl">
            <label class="swatch-wrap">
              <span class="swatch" [style.background]="localCard.borderColor || null" [class.empty]="!localCard.borderColor"></span>
              <input type="color" class="hidden-input" [value]="localCard.borderColor || '#000000'"
                     (change)="onColor($event, 'card-border')" />
            </label>
            <input class="hex-input" [value]="localCard.borderColor || ''" placeholder="Sin borde" maxlength="9"
                   (input)="onHex($event, 'card-border')" />
            @if (localCard.borderColor) { <button type="button" class="clear-xs" (click)="clearProp('card-border')"><i class="pi pi-times"></i></button> }
          </div>

          <div class="sec-label mt">Radio de esquinas</div>
          <div class="btn-row wrap">
            @for (r of RADIUS; track r.value) {
              <button type="button" class="toggle-btn"
                      [class.active]="localCard.borderRadius === r.value"
                      [style.borderRadius]="r.px"
                      (click)="togglePropCard('borderRadius', r.value)">{{ r.label }}</button>
            }
          </div>

          <div class="sec-label mt">Sombra</div>
          <div class="btn-row">
            @for (sh of SHADOWS; track sh.value) {
              <button type="button" class="toggle-btn"
                      [class.active]="localCard.shadow === sh.value"
                      (click)="togglePropCard('shadow', sh.value)">{{ sh.label }}</button>
            }
          </div>

          <button type="button" class="reset-btn" (click)="resetCard()">
            <i class="pi pi-refresh"></i> Resetear tarjetas
          </button>
        }

        <!-- ══ IMAGEN ═════════════════════════════ -->
        @if (isImage) {

          <div class="sec-label">Radio de esquinas</div>
          <div class="btn-row wrap">
            @for (r of RADIUS; track r.value) {
              <button type="button" class="toggle-btn"
                      [class.active]="localImg.borderRadius === r.value"
                      [style.borderRadius]="r.px"
                      (click)="togglePropImg('borderRadius', r.value)">{{ r.label }}</button>
            }
          </div>

          <div class="sec-label mt">Relación de aspecto</div>
          <div class="btn-row wrap">
            @for (a of ASPECTS; track a.value) {
              <button type="button" class="toggle-btn"
                      [class.active]="localImg.aspectRatio === a.value"
                      (click)="togglePropImg('aspectRatio', a.value)">{{ a.label }}</button>
            }
          </div>

          <button type="button" class="reset-btn" (click)="resetImg()">
            <i class="pi pi-refresh"></i> Resetear imágenes
          </button>
        }

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .ee-root { display: flex; flex-direction: column; height: 100%; }
    .ee-head {
      display: flex; align-items: center; gap: 0.6rem;
      padding-bottom: 0.75rem; margin-bottom: 0.75rem;
      border-bottom: 1px solid var(--sf-border);
    }
    .back-btn {
      display: inline-flex; align-items: center; gap: 0.35rem;
      font-size: 0.78rem; font-weight: 600; color: var(--sf-text-muted);
      background: var(--sf-surface-2); border: 1px solid var(--sf-border);
      border-radius: 8px; padding: 0.3rem 0.65rem; cursor: pointer; flex-shrink: 0;
      transition: border-color 0.12s, color 0.12s;
    }
    .back-btn:hover { border-color: var(--sf-border-strong); color: var(--sf-text); }
    .pill {
      display: inline-flex; font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.07em; background: var(--sf-primary-soft); color: var(--sf-primary);
      padding: 0.18rem 0.5rem; border-radius: 999px;
    }
    .editing-hint { display: block; font-size: 0.72rem; color: var(--sf-text-muted); margin-top: 0.1rem; }
    .ee-preview {
      border-radius: 10px; background: var(--sf-surface-2); border: 1px dashed var(--sf-border);
      margin-bottom: 0.85rem; display: flex; align-items: center; justify-content: center;
      padding: 0.75rem; min-height: 64px; transition: all 0.15s;
    }
    .preview-btn {
      padding: 0.5rem 1.25rem; border-radius: 10px;
      background: #16a34a; color: #fff; border: 1px solid transparent;
      font-weight: 700; font-size: 0.9rem; cursor: default; transition: all 0.15s;
    }
    .card-prev {
      flex-direction: column; align-items: flex-start;
      border: 1px solid var(--sf-border); border-radius: 12px; background: #fff;
      padding: 0.85rem; gap: 0.3rem; min-height: 80px; min-width: 180px;
      transition: all 0.15s;
    }
    .card-prev strong { font-size: 0.92rem; }
    .card-prev span { font-size: 0.8rem; color: var(--sf-text-muted); }
    .img-prev {
      background: linear-gradient(145deg, #dbeafe, #bfdbfe);
      border-radius: 12px; min-height: 100px; min-width: 140px;
      font-size: 2rem; color: #93c5fd; transition: all 0.15s;
    }
    .ee-body { flex: 1; overflow-y: auto; }
    .sec-label {
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.08em; color: var(--sf-text-muted); margin-bottom: 0.4rem;
    }
    .sec-label.mt { margin-top: 0.9rem; }
    .color-ctrl { display: flex; align-items: center; gap: 0.4rem; }
    .swatch-wrap { position: relative; cursor: pointer; flex-shrink: 0; }
    .swatch {
      display: block; width: 28px; height: 28px; border-radius: 7px;
      border: 2px solid var(--sf-border); transition: border-color 0.12s;
    }
    .swatch:hover { border-color: var(--sf-border-strong); }
    .swatch.empty {
      background: repeating-linear-gradient(45deg, #e2e8f0 0, #e2e8f0 3px, #fff 3px, #fff 8px) !important;
    }
    .hidden-input { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer; padding: 0; border: none; }
    .hex-input {
      flex: 1; min-width: 0; border: 1px solid var(--sf-border); border-radius: 7px;
      height: 28px; padding: 0 0.5rem; font-size: 0.8rem;
      font-family: 'Courier New', monospace; color: var(--sf-text); background: #fff;
    }
    .hex-input:focus { outline: none; border-color: var(--sf-primary); }
    .clear-xs {
      width: 22px; height: 22px; flex-shrink: 0; display: inline-flex; align-items: center;
      justify-content: center; background: transparent; border: none; border-radius: 5px;
      cursor: pointer; color: var(--sf-text-muted); font-size: 0.65rem;
    }
    .clear-xs:hover { color: #dc2626; background: rgba(220,38,38,0.08); }
    .presets { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 0.4rem; }
    .preset {
      width: 20px; height: 20px; border-radius: 5px; border: 2px solid transparent;
      cursor: pointer; transition: transform 0.1s; outline: 1px solid rgba(0,0,0,0.1);
    }
    .preset:hover { transform: scale(1.25); }
    .preset.active { border-color: var(--sf-primary); transform: scale(1.15); }
    .btn-row { display: flex; gap: 4px; }
    .btn-row.wrap { flex-wrap: wrap; }
    .toggle-btn {
      flex: 1; padding: 0.3rem 0.45rem; border: 1px solid var(--sf-border); border-radius: 7px;
      background: #fff; cursor: pointer; font-size: 0.75rem; color: var(--sf-text);
      text-align: center; white-space: nowrap; transition: border-color 0.1s, background 0.1s, color 0.1s;
    }
    .toggle-btn:hover { border-color: var(--sf-border-strong); }
    .toggle-btn.active { border-color: var(--sf-primary); background: var(--sf-primary-soft); color: var(--sf-primary); font-weight: 700; }
    .reset-btn {
      display: flex; align-items: center; gap: 0.4rem; width: 100%; margin-top: 1.25rem;
      padding: 0.55rem 0.75rem; border: 1px solid var(--sf-border); border-radius: 8px;
      background: var(--sf-surface-2); cursor: pointer; font-size: 0.78rem; color: var(--sf-text-muted);
      transition: background 0.12s, color 0.12s;
    }
    .reset-btn:hover { background: rgba(220,38,38,0.07); color: #dc2626; border-color: rgba(220,38,38,0.25); }
  `],
})
export class ElementStyleEditorComponent implements OnChanges {
  @Input({ required: true }) elementKey!: string;
  @Input() buttonStyle: ButtonStyle = {};
  @Input() cardStyle: CardStyle = {};
  @Input() imageStyle: ImageStyle = {};
  @Output() buttonStyleChange = new EventEmitter<ButtonStyle>();
  @Output() cardStyleChange = new EventEmitter<CardStyle>();
  @Output() imageStyleChange = new EventEmitter<ImageStyle>();
  @Output() close = new EventEmitter<void>();

  localBtn: ButtonStyle = {};
  localCard: CardStyle = {};
  localImg: ImageStyle = {};
  private readonly hexRe = /^#[0-9a-fA-F]{3,8}$/;

  readonly PRESETS = COLOR_PRESETS;
  readonly RADIUS = RADIUS_OPTIONS;
  readonly SHADOWS = SHADOW_OPTIONS;
  readonly ASPECTS = ASPECT_OPTIONS;

  get elementLabel(): string { return ELEMENT_LABELS[this.elementKey] ?? this.elementKey; }
  get isButton(): boolean { return this.elementKey === 'primary-btn' || this.elementKey === 'secondary-btn'; }
  get isCard(): boolean { return this.elementKey === 'card'; }
  get isImage(): boolean { return this.elementKey === 'image'; }

  ngOnChanges(): void {
    this.localBtn  = { ...(this.buttonStyle ?? {}) };
    this.localCard = { ...(this.cardStyle   ?? {}) };
    this.localImg  = { ...(this.imageStyle  ?? {}) };
  }

  rCss(token?: string): string | null {
    return token ? (RADIUS_CSS[token] ?? null) : null;
  }
  sCss(token?: string): string | null {
    return token ? (SHADOW_CSS[token] ?? null) : null;
  }

  onColor(event: Event, target: string): void {
    const v = (event.target as HTMLInputElement).value;
    this.applyPreset(target, v);
  }

  onHex(event: Event, target: string): void {
    const v = ((event.target as HTMLInputElement).value ?? '').trim();
    if (!v || this.hexRe.test(v)) this.applyPreset(target, v || '');
  }

  clearProp(target: string): void { this.applyPreset(target, ''); }

  applyPreset(target: string, color: string): void {
    const c = color || undefined;
    if (target === 'btn-bg')     { this.localBtn  = {...this.localBtn,  bgColor: c};     this.emitBtn(); }
    if (target === 'btn-text')   { this.localBtn  = {...this.localBtn,  textColor: c};   this.emitBtn(); }
    if (target === 'btn-border') { this.localBtn  = {...this.localBtn,  borderColor: c}; this.emitBtn(); }
    if (target === 'card-bg')    { this.localCard = {...this.localCard, bgColor: c};     this.emitCard(); }
    if (target === 'card-text')  { this.localCard = {...this.localCard, textColor: c};   this.emitCard(); }
    if (target === 'card-border'){ this.localCard = {...this.localCard, borderColor: c}; this.emitCard(); }
  }

  togglePropBtn(key: keyof ButtonStyle, value: string): void {
    const cur = this.localBtn[key] as string | undefined;
    this.localBtn = { ...this.localBtn, [key]: cur === value ? undefined : value };
    this.emitBtn();
  }

  togglePropCard(key: keyof CardStyle, value: string): void {
    const cur = this.localCard[key] as string | undefined;
    this.localCard = { ...this.localCard, [key]: cur === value ? undefined : value };
    this.emitCard();
  }

  togglePropImg(key: keyof ImageStyle, value: string): void {
    const cur = this.localImg[key] as string | undefined;
    this.localImg = { ...this.localImg, [key]: cur === value ? undefined : value };
    this.emitImg();
  }

  resetBtn()  { this.localBtn  = {}; this.emitBtn(); }
  resetCard() { this.localCard = {}; this.emitCard(); }
  resetImg()  { this.localImg  = {}; this.emitImg(); }

  emitBtn(): void {
    const o: ButtonStyle = {};
    if (this.localBtn.bgColor)      o.bgColor     = this.localBtn.bgColor;
    if (this.localBtn.textColor)    o.textColor   = this.localBtn.textColor;
    if (this.localBtn.borderColor)  o.borderColor = this.localBtn.borderColor;
    if (this.localBtn.borderRadius) o.borderRadius = this.localBtn.borderRadius;
    this.buttonStyleChange.emit(o);
  }

  emitCard(): void {
    const o: CardStyle = {};
    if (this.localCard.bgColor)      o.bgColor     = this.localCard.bgColor;
    if (this.localCard.textColor)    o.textColor   = this.localCard.textColor;
    if (this.localCard.borderColor)  o.borderColor = this.localCard.borderColor;
    if (this.localCard.borderRadius) o.borderRadius = this.localCard.borderRadius;
    if (this.localCard.shadow)       o.shadow      = this.localCard.shadow;
    this.cardStyleChange.emit(o);
  }

  emitImg(): void {
    const o: ImageStyle = {};
    if (this.localImg.borderRadius) o.borderRadius = this.localImg.borderRadius;
    if (this.localImg.aspectRatio)  o.aspectRatio  = this.localImg.aspectRatio;
    this.imageStyleChange.emit(o);
  }
}
