import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { Role, ROLE_LABELS } from '@core/constants/roles';
import { ApiError } from '@core/models/api-error.model';
import { Office } from '@core/models/catalog.model';
import { CreateUser, ManagedUser, UpdateUser } from '@core/models/user.model';
import { OfficesService } from '@core/services/offices.service';
import { UsersService } from '@core/services/users.service';
import { ToastService } from '@core/services/toast.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

// CreateUser ya no tiene password — el backend la genera automáticamente
type CreateUserForm = Omit<CreateUser, 'password'>;

type StatusFilter = 'all' | 'active' | 'inactive';
interface CoordOffice { id: string; name: string; city: string | null; isActive: boolean; }

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    TableModule,
    Tag,
    EmptyStateComponent,
    LoadingComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  template: `
    <div class="sf-page">
      <app-page-header
        title="Usuarios"
        subtitle="Coordinadores y vendedores de tu empresa."
      >
        <p-button label="Nuevo usuario" icon="pi pi-plus" (onClick)="openNew()" />
      </app-page-header>

      <app-section-card
        title="Listado del equipo"
        description="Filtra por rol o estado para encontrar a alguien rápido."
      >
        <div class="filters">
          <div class="sf-field grow">
            <label>Buscar</label>
            <input pInputText [(ngModel)]="search" placeholder="Nombre o usuario..." />
          </div>
          <div class="sf-field">
            <label>Rol</label>
            <select class="sf-select" [(ngModel)]="roleFilter">
              <option value="all">Todos los roles</option>
              <option [value]="Role.COORDINADOR">Coordinador</option>
              <option [value]="Role.VENDEDOR">Vendedor</option>
            </select>
          </div>
          <div class="sf-field">
            <label>Estado</label>
            <select class="sf-select" [(ngModel)]="statusFilter">
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>
        </div>

        @if (loading()) {
          <app-loading />
        } @else if (error()) {
          <p-message severity="error" [text]="error()!" />
        } @else if (users().length === 0) {
          <app-empty-state
            icon="pi pi-id-card"
            title="Aún no has creado usuarios"
            description="Crea coordinadores y vendedores para empezar a operar."
          >
            <p-button label="Crear el primero" icon="pi pi-plus" (onClick)="openNew()" />
          </app-empty-state>
        } @else if (filtered().length === 0) {
          <app-empty-state icon="pi pi-search" title="Sin coincidencias" description="Ajusta el buscador o los filtros." />
        } @else {
          <p-table [value]="filtered()" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th class="actions-col"></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-u>
              <tr>
                <td class="mono">{{ u.username }}</td>
                <td>{{ u.name }}</td>
                <td>
                  <span class="role-badge" [attr.data-role]="u.role">{{ roleLabel(u.role) }}</span>
                </td>
                <td>
                  <p-tag
                    [value]="u.isActive ? 'Activo' : 'Inactivo'"
                    [severity]="u.isActive ? 'success' : 'secondary'"
                  />
                </td>
                <td class="actions-col">
                  <p-button
                    icon="pi pi-pencil"
                    size="small"
                    severity="secondary"
                    [text]="true"
                    title="Editar usuario"
                    (onClick)="openEdit(u)"
                  />
                  <p-button
                    icon="pi pi-key"
                    size="small"
                    severity="secondary"
                    [text]="true"
                    title="Restablecer contraseña"
                    (onClick)="resetUserPassword(u)"
                  />
                  @if (u.role === Role.COORDINADOR) {
                    <p-button
                      icon="pi pi-building"
                      size="small"
                      severity="secondary"
                      [text]="true"
                      title="Gestionar oficinas"
                      (onClick)="openOffices(u)"
                    />
                    <p-button
                      icon="pi pi-users"
                      size="small"
                      severity="secondary"
                      [text]="true"
                      title="Gestionar vendedores"
                      (onClick)="openSellers(u)"
                    />
                  }
                  <p-button
                    [label]="u.isActive ? 'Desactivar' : 'Activar'"
                    size="small"
                    severity="secondary"
                    (onClick)="toggleActive(u)"
                  />
                </td>
              </tr>
            </ng-template>
          </p-table>
        }
      </app-section-card>
    </div>

    <!-- ── Modal: crear usuario ─────────────────────────── -->
    <p-dialog header="Nuevo usuario" [(visible)]="newDialog" [modal]="true" [style]="{ width: '440px' }">
      <div class="sf-stack">
        <div class="sf-field">
          <label>Usuario <span class="req">*</span></label>
          <input pInputText [(ngModel)]="newForm.username" />
        </div>
        <div class="sf-field">
          <label>Nombre <span class="req">*</span></label>
          <input pInputText [(ngModel)]="newForm.name" />
        </div>
        <div class="sf-field">
          <label>Email <span class="text-muted">(opcional)</span></label>
          <input pInputText type="email" [(ngModel)]="newForm.email" />
        </div>
        <div class="sf-field">
          <label>Rol <span class="req">*</span></label>
          <select class="sf-select" [(ngModel)]="newForm.role">
            <option [ngValue]="Role.VENDEDOR">Vendedor</option>
            <option [ngValue]="Role.COORDINADOR">Coordinador</option>
          </select>
        </div>
        <div class="sf-field">
          <label>Oficina <span class="text-muted">(opcional)</span></label>
          <select class="sf-select" [(ngModel)]="newForm.officeId">
            <option [ngValue]="undefined">— Sin oficina —</option>
            @for (o of offices(); track o.id) {
              <option [ngValue]="o.id">{{ o.name }}</option>
            }
          </select>
        </div>
        <p-message
          severity="info"
          text="El sistema generará una contraseña temporal. Al ingresar, el usuario deberá cambiarla."
          styleClass="w-full"
        />
      </div>
      <div class="dialog-actions">
        <p-button label="Cancelar" severity="secondary" (onClick)="newDialog = false" />
        <p-button label="Crear usuario" [loading]="saving()" (onClick)="saveNew()" />
      </div>
    </p-dialog>

    <!-- ── Modal: editar usuario ────────────────────────── -->
    <p-dialog header="Editar usuario" [(visible)]="editDialog" [modal]="true" [style]="{ width: '440px' }">
      <div class="sf-stack">
        <div class="sf-field">
          <label>Usuario</label>
          <input pInputText [ngModel]="editTarget()?.username" disabled class="disabled-field" />
          <small class="sf-field-help">El nombre de usuario no se puede cambiar.</small>
        </div>
        <div class="sf-field">
          <label>Nombre <span class="req">*</span></label>
          <input pInputText [(ngModel)]="editForm.name" />
        </div>
        <div class="sf-field">
          <label>Email <span class="text-muted">(opcional)</span></label>
          <input pInputText type="email" [(ngModel)]="editForm.email" />
        </div>
        <div class="sf-field">
          <label>Rol <span class="req">*</span></label>
          <select class="sf-select" [(ngModel)]="editForm.role">
            <option [ngValue]="Role.VENDEDOR">Vendedor</option>
            <option [ngValue]="Role.COORDINADOR">Coordinador</option>
          </select>
        </div>
        <div class="sf-field">
          <label>Oficina <span class="text-muted">(opcional)</span></label>
          <select class="sf-select" [(ngModel)]="editForm.officeId">
            <option [ngValue]="null">— Sin oficina —</option>
            @for (o of offices(); track o.id) {
              <option [ngValue]="o.id">{{ o.name }}</option>
            }
          </select>
        </div>
      </div>
      <div class="dialog-actions">
        <p-button label="Cancelar" severity="secondary" (onClick)="editDialog = false" />
        <p-button label="Guardar cambios" [loading]="saving()" (onClick)="saveEdit()" />
      </div>
    </p-dialog>

    <!-- ── Modal: contraseña temporal generada ─────────────── -->
    <p-dialog
      [header]="tempPwTitle()"
      [(visible)]="tempPwDialog"
      [modal]="true"
      [closable]="true"
      [style]="{ width: '420px' }"
    >
      <div class="sf-stack">
        <p-message
          severity="warn"
          text="Esta contraseña solo se muestra una vez. Cópiala y entrégala al usuario."
          styleClass="w-full"
        />
        <div class="sf-field">
          <label>Contraseña temporal</label>
          <div class="temp-pw-box">
            <span class="temp-pw-value mono">{{ tempPassword() }}</span>
            <p-button
              icon="pi pi-copy"
              size="small"
              severity="secondary"
              [text]="true"
              title="Copiar"
              (onClick)="copyTempPw()"
            />
          </div>
        </div>
        <p class="temp-pw-note text-muted">
          El usuario deberá cambiar esta contraseña al ingresar por primera vez.
        </p>
      </div>
      <div class="dialog-actions">
        <p-button label="Entendido" (onClick)="tempPwDialog = false" />
      </div>
    </p-dialog>

    <!-- ── Modal: vendedores del coordinador ────────────── -->
    <p-dialog
      [header]="'Vendedores — ' + (sellersTarget()?.name ?? '')"
      [(visible)]="sellersDialog"
      [modal]="true"
      [style]="{ width: '480px' }"
      (onHide)="sellersTarget.set(null)"
    >
      <div class="sf-stack">
        <div class="assign-row">
          <div class="sf-field" style="flex:1">
            <label>Agregar vendedor</label>
            <select class="sf-select" [(ngModel)]="selectedSellerId">
              <option [ngValue]="null">— Selecciona un vendedor —</option>
              @for (s of availableSellers(); track s.id) {
                <option [ngValue]="s.id">{{ s.name }} · {{ s.username }}</option>
              }
            </select>
          </div>
          <p-button
            label="Agregar"
            icon="pi pi-plus"
            [disabled]="!selectedSellerId"
            [loading]="assigningSeller()"
            (onClick)="addSeller()"
          />
        </div>

        @if (loadingSellers()) {
          <app-loading />
        } @else if (coordSellers().length === 0) {
          <div class="empty-offices">
            <i class="pi pi-users"></i>
            <p>Este coordinador aún no tiene vendedores asignados.</p>
          </div>
        } @else {
          <div class="office-list">
            @for (s of coordSellers(); track s.id) {
              <div class="office-row">
                <div class="office-info">
                  <span class="office-name">{{ s.name }}</span>
                  <span class="office-city">{{ s.username }}</span>
                </div>
                <p-button icon="pi pi-times" severity="danger" [text]="true" size="small" (onClick)="removeSeller(s.id)" />
              </div>
            }
          </div>
        }
      </div>
    </p-dialog>

    <!-- ── Modal: oficinas del coordinador ──────────────── -->
    <p-dialog
      [header]="'Oficinas — ' + (officeTarget()?.name ?? '')"
      [(visible)]="officesDialog"
      [modal]="true"
      [style]="{ width: '480px' }"
      (onHide)="officeTarget.set(null)"
    >
      <div class="sf-stack">
        <div class="assign-row">
          <div class="sf-field" style="flex:1">
            <label>Agregar oficina</label>
            <select class="sf-select" [(ngModel)]="selectedOfficeId">
              <option [ngValue]="null">— Selecciona una oficina —</option>
              @for (o of availableOffices(); track o.id) {
                <option [ngValue]="o.id">{{ o.name }}{{ o.city ? ' · ' + o.city : '' }}</option>
              }
            </select>
          </div>
          <p-button
            label="Agregar"
            icon="pi pi-plus"
            [disabled]="!selectedOfficeId"
            [loading]="assigningOffice()"
            (onClick)="addOffice()"
          />
        </div>

        @if (loadingOffices()) {
          <app-loading />
        } @else if (coordOffices().length === 0) {
          <div class="empty-offices">
            <i class="pi pi-building"></i>
            <p>Este coordinador aún no tiene oficinas asignadas.</p>
          </div>
        } @else {
          <div class="office-list">
            @for (o of coordOffices(); track o.id) {
              <div class="office-row">
                <div class="office-info">
                  <span class="office-name">{{ o.name }}</span>
                  @if (o.city) { <span class="office-city">{{ o.city }}</span> }
                  @if (!o.isActive) { <span class="office-inactive">Inactiva</span> }
                </div>
                <p-button icon="pi pi-times" severity="danger" [text]="true" size="small" (onClick)="removeOffice(o.id)" />
              </div>
            }
          </div>
        }
      </div>
    </p-dialog>
  `,
  styles: [`
    .filters {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .filters .grow { min-width: 0; }
    @media (max-width: 720px) { .filters { grid-template-columns: 1fr; } }
    .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    .actions-col { text-align: right; white-space: nowrap; }
    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.18rem 0.55rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.01em;
      background: var(--sf-surface-2);
      color: var(--sf-text-muted);
      border: 1px solid var(--sf-border);
    }
    .role-badge[data-role='ADMIN']       { background: var(--sf-primary-soft); color: var(--sf-primary); border-color: rgba(37,99,235,.25); }
    .role-badge[data-role='COORDINADOR'] { background: rgba(168,85,247,.1); color: #7c3aed; border-color: rgba(168,85,247,.25); }
    .role-badge[data-role='VENDEDOR']    { background: var(--sf-success-soft); color: #047857; border-color: rgba(16,185,129,.25); }
    .role-badge[data-role='SUPERADMIN']  { background: rgba(15,23,42,.1); color: #0f172a; border-color: rgba(15,23,42,.2); }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; }
    .req { color: #dc2626; }
    .sf-field-error { color: #dc2626; font-size: 0.78rem; margin-top: 0.25rem; display: block; }
    .disabled-field { opacity: 0.6; cursor: not-allowed; }
    /* Oficinas */
    .assign-row { display: flex; align-items: flex-end; gap: 0.75rem; }
    .empty-offices {
      text-align: center; padding: 1.5rem 1rem;
      color: var(--sf-text-muted);
      border: 1px dashed var(--sf-border-strong);
      border-radius: 10px;
      background: var(--sf-surface-2);
    }
    .empty-offices i { font-size: 1.8rem; display: block; margin-bottom: 0.5rem; }
    .empty-offices p { margin: 0; font-size: 0.85rem; }
    .office-list { display: flex; flex-direction: column; gap: 0.35rem; }
    .office-row {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.55rem 0.75rem;
      border: 1px solid var(--sf-border);
      border-radius: 10px;
      background: #fff;
    }
    .office-info { flex: 1; min-width: 0; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .office-name { font-weight: 600; font-size: 0.88rem; color: var(--sf-text); }
    .office-city { font-size: 0.78rem; color: var(--sf-text-muted); }
    .office-inactive {
      font-size: 0.68rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
      color: #b45309; background: #fef3c7; border: 1px solid #fde68a;
      border-radius: 999px; padding: 0.1rem 0.45rem;
    }
    .w-full { width: 100%; }
    .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    .temp-pw-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: var(--sf-surface-2);
      border: 1px solid var(--sf-border);
      border-radius: 8px;
    }
    .temp-pw-value {
      flex: 1;
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      color: var(--sf-primary);
    }
    .temp-pw-note { margin: 0; font-size: 0.85rem; }
  `],
})
export class AdminUsersComponent implements OnInit {
  private readonly service = inject(UsersService);
  private readonly officesService = inject(OfficesService);
  private readonly toast = inject(ToastService);

  protected readonly Role = Role;

  users    = signal<ManagedUser[]>([]);
  offices  = signal<Office[]>([]);
  loading  = signal(false);
  error    = signal<string | null>(null);
  saving   = signal(false);

  // Filtros
  search       = '';
  roleFilter: Role | 'all' = 'all';
  statusFilter: StatusFilter = 'all';

  // Modal: crear
  newDialog = false;
  newForm: CreateUserForm = this.emptyNew();

  // Modal: editar
  editDialog = false;
  editTarget = signal<ManagedUser | null>(null);
  editForm: UpdateUser = {};

  // Modal: contraseña temporal
  tempPwDialog = false;
  tempPassword = signal('');
  tempPwTitle  = signal('Contraseña temporal generada');

  // Modal: vendedores del coordinador
  sellersDialog   = false;
  sellersTarget   = signal<ManagedUser | null>(null);
  coordSellers    = signal<ManagedUser[]>([]);
  allSellers      = signal<ManagedUser[]>([]);
  loadingSellers  = signal(false);
  assigningSeller = signal(false);
  selectedSellerId: string | null = null;

  availableSellers = computed(() => {
    const assigned = new Set(this.coordSellers().map((s) => s.id));
    return this.allSellers().filter((s) => !assigned.has(s.id));
  });

  // Modal: oficinas del coordinador
  officesDialog    = false;
  officeTarget     = signal<ManagedUser | null>(null);
  coordOffices     = signal<CoordOffice[]>([]);
  loadingOffices   = signal(false);
  assigningOffice  = signal(false);
  selectedOfficeId: string | null = null;

  availableOffices = computed(() => {
    const assigned = new Set(this.coordOffices().map((o) => o.id));
    return this.offices().filter((o) => !assigned.has(o.id));
  });

  filtered = computed(() => {
    const text = this.search.trim().toLowerCase();
    return this.users().filter((u) => {
      if (this.roleFilter !== 'all' && u.role !== this.roleFilter) return false;
      if (this.statusFilter === 'active'   && !u.isActive)  return false;
      if (this.statusFilter === 'inactive' &&  u.isActive)  return false;
      if (!text) return true;
      return u.name.toLowerCase().includes(text) || u.username.toLowerCase().includes(text);
    });
  });

  roleLabel(role: Role): string { return ROLE_LABELS[role]; }

  ngOnInit(): void {
    this.load();
    this.officesService.getAll().subscribe({
      next: (res) => this.offices.set(res.items),
      error: ()    => this.offices.set([]),
    });
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next:  (res) => { this.users.set(res.items); this.loading.set(false); },
      error: (e: ApiError) => { this.error.set(e.userMessage ?? 'Error al cargar usuarios'); this.loading.set(false); },
    });
  }

  // ── Crear ──────────────────────────────────────────────
  openNew(): void { this.newForm = this.emptyNew(); this.newDialog = true; }

  saveNew(): void {
    if (!this.newForm.username || !this.newForm.name) {
      this.toast.error('Completa los campos requeridos');
      return;
    }
    this.saving.set(true);
    this.service.create(this.newForm).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.newDialog = false;
        this.load();
        this.tempPwTitle.set(`Contraseña temporal — ${res.user.name}`);
        this.tempPassword.set(res.tempPassword);
        this.tempPwDialog = true;
      },
      error: (e: ApiError) => { this.saving.set(false); this.toast.error(e.userMessage ?? 'No se pudo crear el usuario'); },
    });
  }

  // ── Editar ─────────────────────────────────────────────
  openEdit(u: ManagedUser): void {
    this.editTarget.set(u);
    this.editForm = { name: u.name, email: u.email ?? '', role: u.role, officeId: u.officeId ?? null };
    this.editDialog = true;
  }

  saveEdit(): void {
    const target = this.editTarget();
    if (!target) return;
    this.saving.set(true);
    this.service.update(target.id, this.editForm).subscribe({
      next: () => { this.toast.success('Usuario actualizado'); this.saving.set(false); this.editDialog = false; this.load(); },
      error: (e: ApiError) => { this.saving.set(false); this.toast.error(e.userMessage ?? 'No se pudo actualizar'); },
    });
  }

  // ── Restablecer contraseña (genera temporal) ───────────
  resetUserPassword(u: ManagedUser): void {
    this.service.resetPassword(u.id).subscribe({
      next: (res) => {
        this.tempPwTitle.set(`Nueva contraseña temporal — ${u.name}`);
        this.tempPassword.set(res.tempPassword);
        this.tempPwDialog = true;
      },
      error: (e: ApiError) => this.toast.error(e.userMessage ?? 'No se pudo restablecer la contraseña'),
    });
  }

  copyTempPw(): void {
    navigator.clipboard.writeText(this.tempPassword()).then(
      () => this.toast.success('Contraseña copiada'),
      () => this.toast.error('No se pudo copiar'),
    );
  }

  // ── Activar / desactivar ───────────────────────────────
  toggleActive(u: ManagedUser): void {
    this.service.updateStatus(u.id, !u.isActive).subscribe({
      next:  () => { this.toast.success(u.isActive ? 'Usuario desactivado' : 'Usuario activado'); this.load(); },
      error: (e: ApiError) => this.toast.error(e.userMessage ?? 'No se pudo actualizar'),
    });
  }

  // ── Vendedores del coordinador ─────────────────────────
  openSellers(u: ManagedUser): void {
    this.sellersTarget.set(u);
    this.selectedSellerId = null;
    this.sellersDialog = true;
    this.loadSellers(u.id);
    if (!this.allSellers().length) {
      this.service.getSellers().subscribe({
        next: (res) => this.allSellers.set(res.items),
        error: () => {},
      });
    }
  }

  private loadSellers(coordinatorId: string): void {
    this.loadingSellers.set(true);
    this.service.getAssignedSellers(coordinatorId).subscribe({
      next:  (list) => { this.coordSellers.set(list); this.loadingSellers.set(false); },
      error: ()     => this.loadingSellers.set(false),
    });
  }

  addSeller(): void {
    const coord = this.sellersTarget();
    if (!coord || !this.selectedSellerId) return;
    this.assigningSeller.set(true);
    this.service.assignSeller(coord.id, this.selectedSellerId).subscribe({
      next: () => {
        this.assigningSeller.set(false);
        this.selectedSellerId = null;
        this.loadSellers(coord.id);
        this.toast.success('Vendedor asignado');
      },
      error: (e: ApiError) => { this.assigningSeller.set(false); this.toast.error(e.userMessage ?? 'No se pudo asignar el vendedor'); },
    });
  }

  removeSeller(sellerId: string): void {
    const coord = this.sellersTarget();
    if (!coord) return;
    this.service.unassignSeller(coord.id, sellerId).subscribe({
      next:  () => { this.loadSellers(coord.id); this.toast.success('Vendedor removido'); },
      error: (e: ApiError) => this.toast.error(e.userMessage ?? 'No se pudo remover el vendedor'),
    });
  }

  // ── Oficinas del coordinador ───────────────────────────
  openOffices(u: ManagedUser): void {
    this.officeTarget.set(u);
    this.selectedOfficeId = null;
    this.officesDialog = true;
    this.loadOffices(u.id);
  }

  private loadOffices(coordinatorId: string): void {
    this.loadingOffices.set(true);
    this.service.getCoordinatorOffices(coordinatorId).subscribe({
      next:  (list) => { this.coordOffices.set(list); this.loadingOffices.set(false); },
      error: ()     => this.loadingOffices.set(false),
    });
  }

  addOffice(): void {
    const coord = this.officeTarget();
    if (!coord || !this.selectedOfficeId) return;
    this.assigningOffice.set(true);
    this.service.assignOffice(coord.id, this.selectedOfficeId).subscribe({
      next: () => { this.assigningOffice.set(false); this.selectedOfficeId = null; this.loadOffices(coord.id); this.toast.success('Oficina asignada'); },
      error: (e: ApiError) => { this.assigningOffice.set(false); this.toast.error(e.userMessage ?? 'No se pudo asignar la oficina'); },
    });
  }

  removeOffice(officeId: string): void {
    const coord = this.officeTarget();
    if (!coord) return;
    this.service.unassignOffice(coord.id, officeId).subscribe({
      next:  () => { this.loadOffices(coord.id); this.toast.success('Oficina removida'); },
      error: (e: ApiError) => this.toast.error(e.userMessage ?? 'No se pudo remover la oficina'),
    });
  }

  private emptyNew(): CreateUserForm {
    return { username: '', name: '', role: Role.VENDEDOR };
  }
}
