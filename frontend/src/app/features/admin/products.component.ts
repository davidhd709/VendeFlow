import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { ApiError } from '@core/models/api-error.model';
import { CreateProduct, Product } from '@core/models/catalog.model';
import { ProductsService } from '@core/services/products.service';
import { ToastService } from '@core/services/toast.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [
    CurrencyPipe,
    SlicePipe,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    TableModule,
    Tag,
    TooltipModule,
    EmptyStateComponent,
    LoadingComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  template: `
    <div class="sf-page">
      <app-page-header
        title="Productos"
        subtitle="Catálogo que muestras a tus clientes en la web pública."
      >
        <p-button label="Nuevo producto" icon="pi pi-plus" (onClick)="openNew()" />
      </app-page-header>

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <p-message severity="error" [text]="error()!" />
      } @else if (products().length === 0) {
        <app-empty-state
          icon="pi pi-mobile"
          title="Sin productos en catálogo"
          description="Crea tu primer producto para que aparezca en la web pública."
        >
          <p-button label="Crear el primero" icon="pi pi-plus" (onClick)="openNew()" />
        </app-empty-state>
      } @else {
        <app-section-card
          title="Catálogo"
          description="Productos visibles en tu web cuando están activos."
        >
          <p-table [value]="products()" [paginator]="true" [rows]="15">
            <ng-template pTemplate="header">
              <tr>
                <th>Imagen</th>
                <th>Nombre</th>
                <th>Marca / Modelo</th>
                <th>Precio</th>
                <th>Condición</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-p>
              <tr>
                <td class="thumb-cell">
                  @if (p.imageUrl) {
                    <img [src]="p.imageUrl" [alt]="p.name" class="thumb" />
                  } @else {
                    <span class="thumb-placeholder"><i class="pi pi-mobile"></i></span>
                  }
                </td>
                <td>
                  <strong>{{ p.name }}</strong>
                  @if (p.description) {
                    <div class="text-xs text-muted">{{ p.description | slice:0:60 }}{{ p.description.length > 60 ? '…' : '' }}</div>
                  }
                </td>
                <td class="text-muted text-sm">
                  {{ p.brand || '—' }}
                  @if (p.model) { <span class="sep">/</span> {{ p.model }} }
                </td>
                <td class="price">{{ +p.price | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}</td>
                <td>
                  <span class="cond-badge" [attr.data-cond]="p.condition">
                    {{ condLabel(p.condition) }}
                  </span>
                </td>
                <td>
                  <p-tag
                    [value]="p.isActive ? 'Activo' : 'Inactivo'"
                    [severity]="p.isActive ? 'success' : 'secondary'"
                  />
                </td>
                <td class="actions-cell">
                  <p-button
                    icon="pi pi-pencil"
                    [text]="true"
                    size="small"
                    severity="secondary"
                    (onClick)="openEdit(p)"
                    pTooltip="Editar"
                  />
                  <p-button
                    [icon]="p.isActive ? 'pi pi-eye-slash' : 'pi pi-eye'"
                    [text]="true"
                    size="small"
                    [severity]="p.isActive ? 'warn' : 'success'"
                    (onClick)="toggleActive(p)"
                    [pTooltip]="p.isActive ? 'Desactivar' : 'Activar'"
                  />
                </td>
              </tr>
            </ng-template>
          </p-table>
        </app-section-card>
      }
    </div>

    <p-dialog
      [header]="editId ? 'Editar producto' : 'Nuevo producto'"
      [(visible)]="dialog"
      [modal]="true"
      [style]="{ width: '580px' }"
    >
      <div class="sf-stack">

        <!-- Nombre + Slug -->
        <div class="grid-2">
          <div class="sf-field">
            <label>Nombre *</label>
            <input pInputText [(ngModel)]="form.name" (ngModelChange)="autoSlug()" />
          </div>
          <div class="sf-field">
            <label>Slug *</label>
            <input pInputText [(ngModel)]="form.slug" placeholder="iphone-13-pro" />
          </div>
        </div>

        <!-- Descripción -->
        <div class="sf-field">
          <label>Descripción</label>
          <textarea
            class="sf-input"
            rows="2"
            [(ngModel)]="form.description"
            placeholder="Descripción breve del producto…"
          ></textarea>
        </div>

        <!-- Marca + Modelo -->
        <div class="grid-2">
          <div class="sf-field">
            <label>Marca</label>
            <input pInputText [(ngModel)]="form.brand" placeholder="Apple, Samsung…" />
          </div>
          <div class="sf-field">
            <label>Modelo</label>
            <input pInputText [(ngModel)]="form.model" placeholder="iPhone 13 Pro" />
          </div>
        </div>

        <!-- RAM + Almacenamiento + Color -->
        <div class="grid-3">
          <div class="sf-field">
            <label>RAM</label>
            <input pInputText [(ngModel)]="form.ram" placeholder="8GB" />
          </div>
          <div class="sf-field">
            <label>Almacenamiento</label>
            <input pInputText [(ngModel)]="form.storage" placeholder="128GB" />
          </div>
          <div class="sf-field">
            <label>Color</label>
            <input pInputText [(ngModel)]="form.color" placeholder="Negro" />
          </div>
        </div>

        <!-- Precio + Garantía + Condición -->
        <div class="grid-3">
          <div class="sf-field">
            <label>Precio (COP) *</label>
            <input pInputText type="number" [(ngModel)]="form.price" />
          </div>
          <div class="sf-field">
            <label>Garantía</label>
            <input pInputText [(ngModel)]="form.warranty" placeholder="12 meses" />
          </div>
          <div class="sf-field">
            <label>Condición</label>
            <select class="sf-select" [(ngModel)]="form.condition">
              <option value="NUEVO">Nuevo</option>
              <option value="USADO">Usado</option>
              <option value="REACONDICIONADO">Reacondicionado</option>
            </select>
          </div>
        </div>

        <!-- Imagen portada -->
        <div class="sf-field">
          <label>URL imagen portada</label>
          <input pInputText [(ngModel)]="form.imageUrl" placeholder="https://…" />
          @if (form.imageUrl) {
            <img [src]="form.imageUrl" alt="preview" class="img-preview" />
          }
        </div>

        @if (editId) {
          <div class="sf-field">
            <label>Estado</label>
            <select class="sf-select" [(ngModel)]="form.isActive">
              <option [ngValue]="true">Activo</option>
              <option [ngValue]="false">Inactivo</option>
            </select>
          </div>
        }

      </div>
      <div class="dialog-actions">
        <p-button label="Cancelar" severity="secondary" (onClick)="dialog = false" />
        <p-button [label]="editId ? 'Guardar cambios' : 'Crear'" [loading]="saving()" (onClick)="save()" />
      </div>
    </p-dialog>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }
      @media (max-width: 600px) {
        .grid-2, .grid-3 { grid-template-columns: 1fr; }
      }

      .price { font-variant-numeric: tabular-nums; font-weight: 600; }
      .sep { color: var(--sf-border); margin: 0 0.25rem; }

      /* thumbnail */
      .thumb-cell { width: 52px; }
      .thumb {
        width: 44px;
        height: 44px;
        object-fit: cover;
        border-radius: 8px;
        border: 1px solid var(--sf-border);
      }
      .thumb-placeholder {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border-radius: 8px;
        background: var(--sf-surface-2);
        color: var(--sf-text-muted);
        font-size: 1.1rem;
      }

      .actions-cell { white-space: nowrap; text-align: right; }

      .cond-badge {
        display: inline-flex;
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        font-size: 0.72rem;
        font-weight: 700;
        background: var(--sf-surface-2);
        color: var(--sf-text-muted);
        border: 1px solid var(--sf-border);
      }
      .cond-badge[data-cond='NUEVO'] {
        background: var(--sf-success-soft);
        color: #047857;
        border-color: rgba(16, 185, 129, 0.25);
      }
      .cond-badge[data-cond='USADO'] {
        background: var(--sf-warn-soft);
        color: #b45309;
        border-color: rgba(245, 158, 11, 0.3);
      }
      .cond-badge[data-cond='REACONDICIONADO'] {
        background: var(--sf-primary-soft);
        color: var(--sf-primary);
        border-color: rgba(37, 99, 235, 0.25);
      }

      .img-preview {
        margin-top: 0.5rem;
        width: 100%;
        max-height: 140px;
        object-fit: contain;
        border-radius: 8px;
        border: 1px solid var(--sf-border);
        background: var(--sf-surface-2);
      }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.25rem;
      }
    `,
  ],
})
export class AdminProductsComponent implements OnInit {
  private readonly service = inject(ProductsService);
  private readonly toast = inject(ToastService);

  products = signal<Product[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  saving = signal(false);
  dialog = false;
  editId: string | null = null;
  form: CreateProduct & { isActive?: boolean } = this.empty();

  condLabel(c: string): string {
    return c === 'NUEVO' ? 'Nuevo' : c === 'USADO' ? 'Usado' : 'Reacondicionado';
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll(1, 100).subscribe({
      next: (res) => {
        this.products.set(res.items);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'Error al cargar productos');
        this.loading.set(false);
      },
    });
  }

  openNew(): void {
    this.editId = null;
    this.form = this.empty();
    this.dialog = true;
  }

  openEdit(p: Product): void {
    this.editId = p.id;
    this.form = {
      name: p.name,
      slug: p.slug,
      description: p.description ?? '',
      brand: p.brand ?? '',
      model: p.model ?? '',
      ram: p.ram ?? '',
      storage: p.storage ?? '',
      color: p.color ?? '',
      condition: p.condition,
      warranty: p.warranty ?? '',
      price: Number(p.price),
      imageUrl: p.imageUrl ?? '',
      isActive: p.isActive,
    };
    this.dialog = true;
  }

  autoSlug(): void {
    if (this.editId) return;
    this.form.slug = this.form.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  save(): void {
    if (!this.form.name?.trim() || !this.form.slug?.trim()) {
      this.toast.error('Nombre y slug son obligatorios');
      return;
    }
    if (!this.form.price || this.form.price <= 0) {
      this.toast.error('Ingresa un precio válido');
      return;
    }
    this.saving.set(true);
    const dto: Partial<CreateProduct> & { isActive?: boolean } = {
      name:        this.form.name.trim(),
      slug:        this.form.slug.trim(),
      description: this.form.description?.trim() || undefined,
      brand:       this.form.brand?.trim() || undefined,
      model:       this.form.model?.trim() || undefined,
      ram:         this.form.ram?.trim() || undefined,
      storage:     this.form.storage?.trim() || undefined,
      color:       this.form.color?.trim() || undefined,
      condition:   this.form.condition || 'NUEVO',
      warranty:    this.form.warranty?.trim() || undefined,
      price:       Number(this.form.price),
      imageUrl:    this.form.imageUrl?.trim() || undefined,
    };

    if (this.editId) {
      dto.isActive = this.form.isActive;
      this.service.update(this.editId, dto).subscribe({
        next: () => {
          this.toast.success('Producto actualizado');
          this.saving.set(false);
          this.dialog = false;
          this.load();
        },
        error: (e: ApiError) => {
          this.saving.set(false);
          this.toast.error(e.userMessage ?? 'No se pudo actualizar el producto');
        },
      });
    } else {
      this.service.create(dto as CreateProduct).subscribe({
        next: () => {
          this.toast.success('Producto creado');
          this.saving.set(false);
          this.dialog = false;
          this.load();
        },
        error: (e: ApiError) => {
          this.saving.set(false);
          this.toast.error(e.userMessage ?? 'No se pudo crear el producto');
        },
      });
    }
  }

  toggleActive(p: Product): void {
    this.service.update(p.id, { isActive: !p.isActive }).subscribe({
      next: () => {
        this.toast.success(p.isActive ? 'Producto desactivado' : 'Producto activado');
        this.load();
      },
      error: (e: ApiError) => this.toast.error(e.userMessage ?? 'No se pudo actualizar'),
    });
  }

  private empty(): CreateProduct & { isActive?: boolean } {
    return {
      name: '', slug: '', description: '', brand: '', model: '',
      ram: '', storage: '', color: '', condition: 'NUEVO',
      warranty: '', price: 0, imageUrl: '', isActive: true,
    };
  }
}
