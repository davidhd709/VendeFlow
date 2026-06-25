import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ApiError } from '@core/models/api-error.model';
import { CreateOffice, Office } from '@core/models/catalog.model';
import { OfficesService } from '@core/services/offices.service';
import { ToastService } from '@core/services/toast.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

@Component({
  selector: 'app-admin-offices',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    TagModule,
    TableModule,
    EmptyStateComponent,
    LoadingComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  template: `
    <div class="sf-page">
      <app-page-header
        title="Oficinas"
        subtitle="Sedes desde las que tu equipo atiende a los clientes."
      >
        <p-button label="Nueva oficina" icon="pi pi-plus" (onClick)="openCreate()" />
      </app-page-header>

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <p-message severity="error" [text]="error()!" />
      } @else if (offices().length === 0) {
        <app-empty-state
          icon="pi pi-map-marker"
          title="Sin oficinas"
          description="Crea la primera oficina para asignar vendedores y recibir leads."
        >
          <p-button label="Crear la primera" icon="pi pi-plus" (onClick)="openCreate()" />
        </app-empty-state>
      } @else {
        <app-section-card
          title="Sedes activas"
          description="Las oficinas activas aparecen como opción en el formulario público de cotización."
        >
          <p-table [value]="offices()" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
              <tr>
                <th>Nombre</th>
                <th>Ciudad</th>
                <th>Dirección</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th class="actions-col"></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-o>
              <tr>
                <td><strong>{{ o.name }}</strong></td>
                <td>{{ o.city || '—' }}</td>
                <td class="text-muted">{{ o.address || '—' }}</td>
                <td>{{ o.phone || '—' }}</td>
                <td>
                  <p-tag
                    [value]="o.isActive ? 'Activa' : 'Inactiva'"
                    [severity]="o.isActive ? 'success' : 'warn'"
                  />
                </td>
                <td class="actions-col">
                  <p-button
                    label="Editar"
                    size="small"
                    icon="pi pi-pencil"
                    [text]="true"
                    (onClick)="openEdit(o)"
                  />
                </td>
              </tr>
            </ng-template>
          </p-table>
        </app-section-card>
      }
    </div>

    <p-dialog
      [header]="dialogTitle()"
      [(visible)]="dialog"
      [modal]="true"
      [style]="{ width: '420px' }"
    >
      <div class="sf-stack">
        <div class="sf-field">
          <label>Nombre</label>
          <input pInputText [(ngModel)]="form.name" placeholder="Sede Centro" />
        </div>
        <div class="grid-2">
          <div class="sf-field">
            <label>Ciudad</label>
            <input pInputText [(ngModel)]="form.city" />
          </div>
          <div class="sf-field">
            <label>Teléfono</label>
            <input pInputText [(ngModel)]="form.phone" />
          </div>
        </div>
        <div class="sf-field">
          <label>Dirección</label>
          <input pInputText [(ngModel)]="form.address" />
        </div>
        <label class="toggle-row">
          <input type="checkbox" [(ngModel)]="form.isActive" />
          <span>Oficina activa</span>
        </label>
        <small class="text-muted text-xs">
          Las oficinas activas aparecen en el formulario público de cotización.
        </small>
      </div>
      <div class="dialog-actions">
        <p-button label="Cancelar" severity="secondary" (onClick)="dialog = false" />
        <p-button label="Guardar" [loading]="saving()" (onClick)="saveOffice()" />
      </div>
    </p-dialog>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
      .actions-col { text-align: right; }
      .toggle-row {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.84rem;
        color: var(--sf-text);
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
export class AdminOfficesComponent implements OnInit {
  private readonly service = inject(OfficesService);
  private readonly toast = inject(ToastService);

  offices = signal<Office[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  saving = signal(false);
  editingId = signal<string | null>(null);
  editingOffice = signal<Office | null>(null);
  dialog = false;
  form: CreateOffice = { name: '', isActive: true };
  dialogTitle = computed(() =>
    this.editingId() ? 'Editar oficina' : 'Nueva oficina',
  );

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (res) => {
        this.offices.set(res.items);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'Error al cargar oficinas');
        this.loading.set(false);
      },
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.editingOffice.set(null);
    this.form = { name: '', isActive: true };
    this.dialog = true;
  }

  openEdit(office: Office): void {
    this.editingId.set(office.id);
    this.editingOffice.set(office);
    this.form = {
      name: office.name ?? '',
      city: office.city ?? '',
      address: office.address ?? '',
      phone: office.phone ?? '',
      isActive: office.isActive,
    };
    this.dialog = true;
  }

  saveOffice(): void {
    const payload = this.normalizedPayload();
    if (!payload) return;

    this.saving.set(true);
    const editingId = this.editingId();
    const request$ = editingId
      ? this.buildUpdateRequest(editingId, payload)
      : this.service.create(payload);

    if (!request$) {
      this.saving.set(false);
      return;
    }

    request$.subscribe({
      next: (saved) => {
        this.applySavedOffice(saved, editingId);
        this.toast.success(editingId ? 'Oficina actualizada' : 'Oficina creada');
        this.saving.set(false);
        this.dialog = false;
        this.editingId.set(null);
        this.editingOffice.set(null);
      },
      error: (e: ApiError) => {
        this.saving.set(false);
        this.toast.error(e.userMessage ?? 'No se pudo guardar la oficina');
      },
    });
  }

  private normalizedPayload(): CreateOffice | null {
    const name = (this.form.name ?? '').trim();
    if (name.length < 2) {
      this.toast.error('Ingresa un nombre de oficina válido.');
      return null;
    }

    return {
      name,
      city: this.cleanOptional(this.form.city),
      address: this.cleanOptional(this.form.address),
      phone: this.cleanOptional(this.form.phone),
      isActive: this.form.isActive !== false,
    };
  }

  private cleanOptional(value: string | undefined): string | undefined {
    const clean = (value ?? '').trim();
    return clean.length > 0 ? clean : undefined;
  }

  private buildUpdateRequest(
    editingId: string,
    payload: CreateOffice,
  ) {
    const original = this.editingOffice();
    if (!original) {
      return this.service.update(editingId, payload);
    }
    const patch = this.buildUpdatePayload(original, payload);
    if (Object.keys(patch).length === 0) {
      this.toast.info('No hay cambios para guardar.');
      return null;
    }
    return this.service.update(editingId, patch);
  }

  private buildUpdatePayload(
    original: Office,
    payload: CreateOffice,
  ): Partial<CreateOffice> {
    const next: Partial<CreateOffice> = {};
    const originalName = (original.name ?? '').trim();
    const originalCity = this.cleanOptional(original.city ?? undefined);
    const originalAddress = this.cleanOptional(original.address ?? undefined);
    const originalPhone = this.cleanOptional(original.phone ?? undefined);

    if (payload.name !== originalName) next.name = payload.name;
    if (payload.city !== originalCity) next.city = payload.city;
    if (payload.address !== originalAddress) next.address = payload.address;
    if (payload.phone !== originalPhone) next.phone = payload.phone;
    if ((payload.isActive !== false) !== original.isActive) {
      next.isActive = payload.isActive;
    }
    return next;
  }

  private applySavedOffice(saved: Office, editingId: string | null): void {
    if (editingId) {
      this.offices.update((list) =>
        list.map((office) => (office.id === editingId ? saved : office)),
      );
      return;
    }
    this.offices.update((list) => [saved, ...list]);
  }
}
