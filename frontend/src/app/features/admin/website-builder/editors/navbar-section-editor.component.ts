import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { BorderRadiusToken, NavbarData, NavLink } from '@core/models/website-builder.model';

const RADIUS_LABELS: Array<{ value: BorderRadiusToken | ''; label: string }> = [
  { value: '',     label: 'Predeterminado' },
  { value: 'none', label: 'Cuadrado' },
  { value: 'sm',   label: 'Poco redondeado' },
  { value: 'md',   label: 'Redondeado' },
  { value: 'lg',   label: 'Muy redondeado' },
  { value: 'xl',   label: 'Extra redondeado' },
  { value: 'full', label: 'Pastilla (pill)' },
];

const COLOR_PRESETS = [
  '#ffffff','#f8fafc','#0f172a','#1e293b','#2563eb','#4f46e5',
  '#7c3aed','#db2777','#dc2626','#ea580c','#16a34a','#0891b2',
];

@Component({
  selector: 'app-navbar-section-editor',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule],
  template: `
    <div class="sf-stack">

      <!-- Layout -->
      <div class="sf-field">
        <label>Diseño del menú</label>
        <select [(ngModel)]="variant" (ngModelChange)="emit()">
          <option value="simple">Simple — logo izquierda, links derecha</option>
          <option value="centered">Centrado — links en el centro</option>
          <option value="split">Dividido — logo + links izquierda, CTA derecha</option>
        </select>
      </div>

      <div class="sf-field toggle-row">
        <label>
          <input type="checkbox" [(ngModel)]="showLogo" (ngModelChange)="emit()" />
          Mostrar logo en el menú
        </label>
        <small class="sf-field-help">Usa el logo configurado en "Config. sitio".</small>
      </div>

      <!-- Color de la barra -->
      <div class="style-group">
        <div class="group-title">Estilo de la barra</div>
        <div class="color-row">
          <label>Fondo del menú</label>
          <div class="color-input-group">
            <input type="color" [value]="navBgColor || '#ffffff'" (input)="onColor('navBg', $event)" class="color-swatch" />
            <input pInputText [(ngModel)]="navBgColor" (ngModelChange)="emit()" maxlength="7" placeholder="—" class="color-hex" />
            @if (navBgColor) { <button type="button" (click)="navBgColor=''; emit()" class="color-clear" title="Quitar">×</button> }
          </div>
          <div class="color-presets">
            @for (c of presets; track c) {
              <button type="button" class="preset-dot" [style.background]="c" (click)="navBgColor=c; emit()" [title]="c"></button>
            }
          </div>
        </div>
        <div class="color-row">
          <label>Color de links</label>
          <div class="color-input-group">
            <input type="color" [value]="navTextColor || '#0f172a'" (input)="onColor('navText', $event)" class="color-swatch" />
            <input pInputText [(ngModel)]="navTextColor" (ngModelChange)="emit()" maxlength="7" placeholder="—" class="color-hex" />
            @if (navTextColor) { <button type="button" (click)="navTextColor=''; emit()" class="color-clear" title="Quitar">×</button> }
          </div>
        </div>
      </div>

      <!-- Links -->
      <div class="links-head">
        <span class="block-title">Elementos del menú</span>
        <p-button label="Agregar" icon="pi pi-plus" size="small" severity="secondary"
          [disabled]="links.length >= 8" (onClick)="addLink()" />
      </div>

      @for (lnk of links; track $index; let i = $index) {
        <div class="link-item">
          <div class="link-fields">
            <div class="sf-field">
              <label>Texto</label>
              <input pInputText [(ngModel)]="lnk.label" (ngModelChange)="emit()" maxlength="60" placeholder="Inicio" />
            </div>
            <div class="sf-field">
              <label>Enlace <span class="text-muted text-xs">(opcional)</span></label>
              <input pInputText [(ngModel)]="lnk.href" (ngModelChange)="emit()" maxlength="500" placeholder="#inicio" />
            </div>
          </div>
          <p-button icon="pi pi-trash" severity="danger" [text]="true" (onClick)="removeLink(i)" ariaLabel="Eliminar enlace" />
        </div>
      }

      @if (links.length === 0) {
        <p class="text-muted text-sm">Agrega al menos un elemento al menú.</p>
      }

      <!-- CTA button -->
      <div class="sf-field">
        <label>Texto del botón CTA <span class="text-muted text-xs">(opcional)</span></label>
        <input pInputText [(ngModel)]="ctaLabel" (ngModelChange)="emit()" maxlength="60" placeholder="Cotizar ahora" />
        <small class="sf-field-help">Botón de acción principal del menú. Déjalo vacío para ocultarlo.</small>
      </div>

      @if (ctaLabel) {
        <div class="sf-field">
          <label>Enlace del botón CTA</label>
          <input pInputText [(ngModel)]="ctaHref" (ngModelChange)="emit()" maxlength="500" placeholder="#contacto" />
        </div>

        <!-- Estilo del botón CTA -->
        <div class="style-group">
          <div class="group-title">Estilo del botón CTA</div>

          <div class="sf-field">
            <label>Tipo de botón</label>
            <div class="chip-group">
              @for (s of ctaStyles; track s.value) {
                <button type="button" class="style-chip" [class.active]="ctaStyle === s.value" (click)="ctaStyle = s.value; emit()">
                  {{ s.label }}
                </button>
              }
            </div>
          </div>

          <div class="color-row">
            <label>Color de fondo</label>
            <div class="color-input-group">
              <input type="color" [value]="ctaBgColor || '#16a34a'" (input)="onColor('ctaBg', $event)" class="color-swatch" />
              <input pInputText [(ngModel)]="ctaBgColor" (ngModelChange)="emit()" maxlength="7" placeholder="—" class="color-hex" />
              @if (ctaBgColor) { <button type="button" (click)="ctaBgColor=''; emit()" class="color-clear" title="Quitar">×</button> }
            </div>
            <div class="color-presets">
              @for (c of presets; track c) {
                <button type="button" class="preset-dot" [style.background]="c" (click)="ctaBgColor=c; emit()" [title]="c"></button>
              }
            </div>
          </div>

          <div class="color-row">
            <label>Color del texto</label>
            <div class="color-input-group">
              <input type="color" [value]="ctaTextColor || '#ffffff'" (input)="onColor('ctaText', $event)" class="color-swatch" />
              <input pInputText [(ngModel)]="ctaTextColor" (ngModelChange)="emit()" maxlength="7" placeholder="—" class="color-hex" />
              @if (ctaTextColor) { <button type="button" (click)="ctaTextColor=''; emit()" class="color-clear" title="Quitar">×</button> }
            </div>
          </div>

          <div class="sf-field">
            <label>Forma del botón</label>
            <div class="chip-group">
              @for (r of radiusLabels; track r.value) {
                <button type="button" class="style-chip" [class.active]="ctaBorderRadius === r.value" (click)="ctaBorderRadius = r.value; emit()">
                  {{ r.label }}
                </button>
              }
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .links-head { display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem; }
    .block-title { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--sf-text-muted); }
    .link-item { display: flex; align-items: flex-end; gap: 0.5rem; padding: 0.65rem; background: var(--sf-surface-2); border-radius: 10px; }
    .link-fields { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
    .toggle-row label { display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; font-weight: 500; cursor: pointer; }
    .toggle-row input[type='checkbox'] { width: 16px; height: 16px; cursor: pointer; accent-color: var(--sf-primary); }
    select { width: 100%; border: 1px solid var(--sf-border); border-radius: 8px; height: 2.35rem; padding: 0 0.65rem; color: var(--sf-text); background: #fff; }

    /* Style group */
    .style-group { border: 1px solid var(--sf-border); border-radius: 10px; padding: 0.85rem; background: var(--sf-surface-2); display: flex; flex-direction: column; gap: 0.6rem; }
    .group-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--sf-text-muted); }

    /* Color picker */
    .color-row { display: flex; flex-direction: column; gap: 0.3rem; }
    .color-row label { font-size: 0.8rem; font-weight: 600; color: var(--sf-text); }
    .color-input-group { display: flex; align-items: center; gap: 0.4rem; }
    .color-swatch { width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--sf-border); padding: 2px; cursor: pointer; flex-shrink: 0; }
    .color-hex { flex: 1; font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; }
    .color-clear { all: unset; width: 24px; height: 24px; border-radius: 6px; background: var(--sf-surface); border: 1px solid var(--sf-border); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: var(--sf-text-muted); flex-shrink: 0; }
    .color-clear:hover { background: #fee2e2; color: #dc2626; }
    .color-presets { display: flex; flex-wrap: wrap; gap: 0.3rem; margin-top: 0.2rem; }
    .preset-dot { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid rgba(0,0,0,0.12); cursor: pointer; flex-shrink: 0; transition: transform 0.1s; }
    .preset-dot:hover { transform: scale(1.2); }

    /* Chips */
    .chip-group { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .style-chip { padding: 0.28rem 0.65rem; border: 1.5px solid var(--sf-border); border-radius: 6px; background: #fff; font-size: 0.78rem; font-weight: 500; color: var(--sf-text); cursor: pointer; transition: all 0.12s; white-space: nowrap; }
    .style-chip:hover { border-color: var(--sf-primary); color: var(--sf-primary); }
    .style-chip.active { border-color: var(--sf-primary); background: var(--sf-primary); color: #fff; font-weight: 600; }
  `],
})
export class NavbarSectionEditorComponent implements OnChanges {
  @Input() data: NavbarData = {};
  @Output() dataChange = new EventEmitter<NavbarData>();

  readonly presets = COLOR_PRESETS;
  readonly radiusLabels = RADIUS_LABELS;
  readonly ctaStyles = [
    { value: 'solid',   label: 'Sólido' },
    { value: 'outline', label: 'Outline' },
    { value: 'ghost',   label: 'Ghost' },
  ] as const;

  variant: NonNullable<NavbarData['variant']> = 'simple';
  showLogo = true;
  links: NavLink[] = [];
  ctaLabel = '';
  ctaHref = '';

  navBgColor   = '';
  navTextColor = '';
  ctaBgColor   = '';
  ctaTextColor = '';
  ctaBorderRadius: BorderRadiusToken | '' = '';
  ctaStyle: 'solid' | 'outline' | 'ghost' = 'solid';

  ngOnChanges(): void {
    this.variant      = this.data?.variant ?? 'simple';
    this.showLogo     = this.data?.showLogo ?? true;
    this.links        = (this.data?.links ?? []).map((l) => ({ ...l }));
    this.ctaLabel     = this.data?.ctaLabel ?? '';
    this.ctaHref      = this.data?.ctaHref ?? '';
    this.navBgColor   = this.data?.navBgColor ?? '';
    this.navTextColor = this.data?.navTextColor ?? '';
    this.ctaBgColor   = this.data?.ctaBgColor ?? '';
    this.ctaTextColor = this.data?.ctaTextColor ?? '';
    this.ctaBorderRadius = this.data?.ctaBorderRadius ?? '';
    this.ctaStyle     = this.data?.ctaStyle ?? 'solid';
  }

  onColor(field: 'navBg' | 'navText' | 'ctaBg' | 'ctaText', event: Event): void {
    const v = (event.target as HTMLInputElement).value;
    if (field === 'navBg')   this.navBgColor   = v;
    if (field === 'navText') this.navTextColor = v;
    if (field === 'ctaBg')   this.ctaBgColor   = v;
    if (field === 'ctaText') this.ctaTextColor = v;
    this.emit();
  }

  addLink(): void {
    if (this.links.length >= 8) return;
    this.links.push({ label: '', href: '' });
    this.emit();
  }

  removeLink(idx: number): void {
    this.links.splice(idx, 1);
    this.emit();
  }

  emit(): void {
    const cleanLinks = this.links
      .filter((l) => l.label.trim().length > 0)
      .map((l) => {
        const out: NavLink = { label: l.label.trim() };
        if (l.href?.trim()) out.href = l.href.trim();
        return out;
      });

    const out: NavbarData = { variant: this.variant, showLogo: this.showLogo, links: cleanLinks };
    if (this.ctaLabel.trim()) {
      out.ctaLabel = this.ctaLabel.trim();
      if (this.ctaHref.trim()) out.ctaHref = this.ctaHref.trim();
      if (this.ctaBgColor)   out.ctaBgColor   = this.ctaBgColor;
      if (this.ctaTextColor) out.ctaTextColor = this.ctaTextColor;
      if (this.ctaBorderRadius) out.ctaBorderRadius = this.ctaBorderRadius as BorderRadiusToken;
      if (this.ctaStyle !== 'solid') out.ctaStyle = this.ctaStyle;
    }
    if (this.navBgColor)   out.navBgColor   = this.navBgColor;
    if (this.navTextColor) out.navTextColor = this.navTextColor;

    this.dataChange.emit(out);
  }
}
