import { Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { Product } from '@core/models/catalog.model';
import {
  BorderRadiusToken,
  FeaturedProductsData,
  SectionStyle,
  ShadowToken,
} from '@core/models/website-builder.model';
import { ProductsService } from '@core/services/products.service';

const COLOR_PRESETS = [
  '#ffffff','#f8fafc','#f1f5f9','#0f172a','#1e293b',
  '#2563eb','#4f46e5','#7c3aed','#16a34a','#ea580c','#0891b2','#c9a84c',
];

@Component({
  selector: 'app-featured-products-section-editor',
  standalone: true,
  imports: [FormsModule, InputTextModule, TextareaModule],
  template: `
    <div class="sf-stack">
      <div class="intro">
        <h4>Productos destacados</h4>
        <p>Muestra los equipos que quieres impulsar en tu página principal.</p>
      </div>

      <!-- Diseño -->
      <div class="sf-field">
        <label>Diseño de la sección</label>
        <select [(ngModel)]="variant" (ngModelChange)="emit()">
          <option value="grid">Grid de productos</option>
          <option value="compact">Carrusel simple</option>
          <option value="highlight">Principal + secundarios</option>
        </select>
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

      <!-- Colores de tarjetas de productos -->
      <div class="style-group">
        <div class="group-title">Colores de tarjetas de productos</div>

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
        <label>Título de sección</label>
        <input pInputText [(ngModel)]="form.title" (ngModelChange)="emit()" maxlength="120" />
      </div>

      <div class="sf-field">
        <label>Subtítulo <span class="text-muted text-xs">(opcional)</span></label>
        <textarea
          pTextarea
          rows="3"
          [(ngModel)]="form.subtitle"
          (ngModelChange)="emit()"
          maxlength="220"
        ></textarea>
      </div>

      <div class="grid-2">
        <div class="sf-field">
          <label>Cantidad de productos</label>
          <input
            pInputText
            type="number"
            min="1"
            max="12"
            [(ngModel)]="limitInput"
            (ngModelChange)="emit()"
          />
          <small class="sf-field-help">Rango recomendado: 4 a 8 productos.</small>
        </div>
        <div class="sf-field">
          <label>Texto del botón</label>
          <input
            pInputText
            [(ngModel)]="form.ctaLabel"
            (ngModelChange)="emit()"
            maxlength="40"
            placeholder="Ver catálogo"
          />
        </div>
      </div>

      <label class="toggle-row">
        <input type="checkbox" [(ngModel)]="form.showCta" (ngModelChange)="emit()" />
        <span>Mostrar botón de catálogo</span>
      </label>

      <div class="sf-field">
        <label>Mensaje cuando no hay productos</label>
        <textarea
          pTextarea
          rows="2"
          [(ngModel)]="form.emptyMessage"
          (ngModelChange)="emit()"
          maxlength="220"
        ></textarea>
      </div>

      <div class="sf-field product-selector">
        <label>
          Productos específicos
          <span class="text-muted text-xs">(opcional)</span>
        </label>
        <small class="sf-field-help" style="margin-bottom:0.5rem;display:block">
          Si seleccionas productos, solo esos aparecerán. Si no marcas ninguno, se muestran los primeros según la cantidad configurada.
        </small>
        @if (loadingProducts()) {
          <p class="text-muted text-xs">Cargando productos…</p>
        } @else if (allProducts().length === 0) {
          <p class="text-muted text-xs">No hay productos creados aún.</p>
        } @else {
          <div class="product-list">
            @for (p of allProducts(); track p.id) {
              <label class="product-row" [class.checked]="isSelected(p.id)">
                <input
                  type="checkbox"
                  [checked]="isSelected(p.id)"
                  (change)="toggleProduct(p.id)"
                />
                @if (p.imageUrl) {
                  <img [src]="p.imageUrl" [alt]="p.name" class="product-thumb" />
                } @else {
                  <span class="product-thumb-placeholder"><i class="pi pi-mobile"></i></span>
                }
                <span class="product-name">{{ p.name }}</span>
                @if (isSelected(p.id)) {
                  <span class="check-badge"><i class="pi pi-check"></i></span>
                }
              </label>
            }
          </div>
          @if (selectedProductIds().length > 0) {
            <button type="button" class="clear-btn" (click)="clearSelection()">
              <i class="pi pi-times"></i> Limpiar selección ({{ selectedProductIds().length }})
            </button>
          }
        }
      </div>
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
      select {
        width: 100%;
        border: 1px solid var(--sf-border);
        border-radius: 8px;
        height: 2.35rem;
        padding: 0 0.65rem;
        color: var(--sf-text);
        background: #fff;
      }
      .toggle-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.84rem;
        color: var(--sf-text);
      }
      @media (max-width: 680px) {
        .grid-2 { grid-template-columns: 1fr; }
      }
      .product-selector { margin-top: 0.25rem; }
      .product-list {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        max-height: 220px;
        overflow-y: auto;
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        padding: 0.4rem;
        background: var(--sf-surface-2);
      }
      .product-row {
        display: flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.4rem 0.5rem;
        border-radius: 8px;
        cursor: pointer;
        border: 1px solid transparent;
        transition: background 0.12s, border-color 0.12s;
        font-size: 0.82rem;
      }
      .product-row:hover { background: #fff; border-color: var(--sf-border); }
      .product-row.checked {
        background: rgba(37, 99, 235, 0.06);
        border-color: rgba(37, 99, 235, 0.3);
      }
      .product-row input[type='checkbox'] { flex-shrink: 0; cursor: pointer; }
      .product-thumb {
        width: 32px;
        height: 32px;
        object-fit: cover;
        border-radius: 6px;
        flex-shrink: 0;
        border: 1px solid var(--sf-border);
      }
      .product-thumb-placeholder {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        background: var(--sf-primary-soft);
        color: var(--sf-primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        flex-shrink: 0;
      }
      .product-name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--sf-text);
      }
      .check-badge {
        font-size: 0.72rem;
        color: var(--sf-primary);
        margin-left: auto;
      }
      .clear-btn {
        margin-top: 0.4rem;
        font-size: 0.75rem;
        color: var(--sf-text-muted);
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.2rem 0.3rem;
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        border-radius: 6px;
      }
      .clear-btn:hover { color: #dc2626; background: rgba(239, 68, 68, 0.07); }
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
export class FeaturedProductsSectionEditorComponent implements OnChanges, OnInit {
  private readonly productsService = inject(ProductsService);

  @Input() data: FeaturedProductsData = {};
  @Output() dataChange = new EventEmitter<FeaturedProductsData>();

  form: FeaturedProductsData = {};
  variant: NonNullable<FeaturedProductsData['variant']> = 'grid';
  limitInput: number | string = 6;

  allProducts = signal<Product[]>([]);
  selectedProductIds = signal<string[]>([]);
  loadingProducts = signal(false);

  bgColor         = '';
  cardBgColor     = '';
  cardTextColor   = '';
  cardBorderColor = '';
  cardRadius      = '';
  cardShadow      = '';

  readonly presets = COLOR_PRESETS;

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

  ngOnInit(): void {
    this.loadingProducts.set(true);
    this.productsService.getAll(1, 50).subscribe({
      next: (res) => {
        this.allProducts.set(res.items);
        this.loadingProducts.set(false);
      },
      error: () => this.loadingProducts.set(false),
    });
  }

  ngOnChanges(): void {
    this.form = {
      title: this.data?.title ?? 'Productos destacados',
      subtitle: this.data?.subtitle ?? '',
      ctaLabel: this.data?.ctaLabel ?? 'Ver catálogo',
      showCta: this.data?.showCta ?? true,
      emptyMessage:
        this.data?.emptyMessage ??
        'Estamos actualizando nuestro catálogo. Escríbenos para asesorarte.',
    };
    this.variant = this.data?.variant ?? 'grid';
    this.limitInput = this.normalizeLimit(this.data?.limit ?? 6);
    this.selectedProductIds.set(this.data?.productIds ?? []);

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

  isSelected(id: string): boolean {
    return this.selectedProductIds().includes(id);
  }

  toggleProduct(id: string): void {
    const current = this.selectedProductIds();
    const next = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    this.selectedProductIds.set(next);
    this.emit();
  }

  clearSelection(): void {
    this.selectedProductIds.set([]);
    this.emit();
  }

  emit(): void {
    const out: FeaturedProductsData = {
      variant: this.variant,
      limit: this.normalizeLimit(this.limitInput),
      showCta: !!this.form.showCta,
    };
    if (this.form.title?.trim()) out.title = this.form.title.trim();
    if (this.form.subtitle?.trim()) out.subtitle = this.form.subtitle.trim();
    if (this.form.ctaLabel?.trim()) out.ctaLabel = this.form.ctaLabel.trim();
    if (this.form.emptyMessage?.trim()) out.emptyMessage = this.form.emptyMessage.trim();
    const ids = this.selectedProductIds();
    if (ids.length > 0) out.productIds = ids;

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

  private normalizeLimit(value: number | string): number {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 6;
    return Math.max(1, Math.min(12, Math.round(numeric)));
  }
}
