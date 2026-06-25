import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { AuthService } from '@core/auth/auth.service';
import { Role } from '@core/constants/roles';
import { ApiError } from '@core/models/api-error.model';
import { CreateTask, Task, TASK_STATUS_LABELS } from '@core/models/task.model';
import { ManagedUser } from '@core/models/user.model';
import { TasksService } from '@core/services/tasks.service';
import { UsersService } from '@core/services/users.service';
import { ToastService } from '@core/services/toast.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
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
        title="Tareas"
        [subtitle]="canCreate() ? 'Asigna acciones de seguimiento a tu equipo y dales cierre.' : 'Tareas asignadas a ti.'"
      >
        @if (canCreate()) {
          <p-button label="Nueva tarea" icon="pi pi-plus" (onClick)="openNew()" />
        }
      </app-page-header>

      <!-- Filtro de estado -->
      <div class="filters-bar">
        <div class="sf-field">
          <label>Estado</label>
          <select class="sf-select" [(ngModel)]="statusFilter" (ngModelChange)="load()">
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROGRESO">En progreso</option>
            <option value="COMPLETADA">Completada</option>
          </select>
        </div>
      </div>

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <p-message severity="error" [text]="error()!" />
      } @else if (tasks().length === 0) {
        <app-empty-state
          icon="pi pi-check-square"
          title="Sin tareas"
          [description]="canCreate() ? 'Crea tareas para tu equipo y dales seguimiento aquí.' : 'No tienes tareas asignadas por el momento.'"
        >
          @if (canCreate()) {
            <p-button label="Crear la primera" icon="pi pi-plus" (onClick)="openNew()" />
          }
        </app-empty-state>
      } @else {
        <app-section-card
          title="Pipeline de tareas"
          description="Ordenadas por fecha de vencimiento más próxima."
        >
          <p-table [value]="tasks()" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
              <tr>
                <th>Tarea</th>
                <th>Asignada a</th>
                <th>Estado</th>
                <th>Vence</th>
                <th class="actions-col"></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-t>
              <tr [class.overdue]="isOverdue(t)">
                <td>
                  <div><strong>{{ t.title }}</strong></div>
                  @if (t.description) {
                    <div class="text-muted text-xs mt-1">{{ t.description }}</div>
                  }
                </td>
                <td class="text-sm">{{ sellerName(t.assignedToId) }}</td>
                <td>
                  <p-tag
                    [value]="statusLabel(t.status)"
                    [severity]="
                      t.status === 'COMPLETADA'
                        ? 'success'
                        : t.status === 'EN_PROGRESO'
                          ? 'info'
                          : isOverdue(t) ? 'danger' : 'warn'
                    "
                  />
                </td>
                <td class="text-sm">
                  {{ t.dueDate ? (t.dueDate | date: 'short') : '—' }}
                </td>
                <td class="actions-col">
                  @if (t.status === 'PENDIENTE') {
                    <div class="action-btns">
                      <p-button
                        label="Iniciar"
                        size="small"
                        severity="info"
                        [text]="true"
                        icon="pi pi-play"
                        (onClick)="setStatus(t, 'EN_PROGRESO')"
                      />
                      <p-button
                        label="Completar"
                        size="small"
                        severity="secondary"
                        icon="pi pi-check"
                        (onClick)="setStatus(t, 'COMPLETADA')"
                      />
                    </div>
                  } @else if (t.status === 'EN_PROGRESO') {
                    <p-button
                      label="Completar"
                      size="small"
                      severity="success"
                      icon="pi pi-check"
                      (onClick)="setStatus(t, 'COMPLETADA')"
                    />
                  }
                </td>
              </tr>
            </ng-template>
          </p-table>
        </app-section-card>
      }
    </div>

    <p-dialog
      header="Nueva tarea"
      [(visible)]="dialog"
      [modal]="true"
      [style]="{ width: '460px' }"
    >
      <div class="sf-stack">
        <div class="sf-field">
          <label>Título <span class="req">*</span></label>
          <input pInputText [(ngModel)]="form.title" />
        </div>
        <div class="sf-field">
          <label>Descripción <span class="text-muted">(opcional)</span></label>
          <textarea
            pTextarea
            rows="3"
            [(ngModel)]="form.description"
            placeholder="Detalla qué hay que hacer..."
          ></textarea>
        </div>
        <div class="sf-field">
          <label>Asignar a <span class="req">*</span></label>
          <select class="sf-select" [(ngModel)]="form.assignedToId">
            <option value="">— Selecciona —</option>
            @for (s of sellers(); track s.id) {
              <option [value]="s.id">{{ s.name }}</option>
            }
          </select>
        </div>
        <div class="sf-field">
          <label>Vence <span class="text-muted">(opcional)</span></label>
          <input pInputText type="date" [(ngModel)]="dueDate" />
        </div>
      </div>
      <div class="dialog-actions">
        <p-button label="Cancelar" severity="secondary" (onClick)="dialog = false" />
        <p-button label="Crear tarea" [loading]="saving()" (onClick)="save()" />
      </div>
    </p-dialog>
  `,
  styles: [
    `
      .filters-bar {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.25rem;
        flex-wrap: wrap;
      }
      .filters-bar .sf-field { min-width: 150px; }
      .actions-col { text-align: right; white-space: nowrap; }
      .action-btns { display: flex; gap: 0.4rem; justify-content: flex-end; }
      tr.overdue td { background: rgba(239, 68, 68, 0.04); }
      .req { color: var(--sf-danger, #ef4444); }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.25rem;
      }
      .mt-1 { margin-top: 0.25rem; }
    `,
  ],
})
export class TasksComponent implements OnInit {
  private readonly service = inject(TasksService);
  private readonly usersService = inject(UsersService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  readonly canCreate = computed(() => {
    const r = this.auth.role();
    return r === Role.ADMIN || r === Role.COORDINADOR;
  });

  tasks = signal<Task[]>([]);
  sellers = signal<ManagedUser[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  saving = signal(false);
  dialog = false;
  statusFilter = '';

  form: CreateTask = { title: '', assignedToId: '' };
  dueDate = '';

  private names: Record<string, string> = {};

  ngOnInit(): void {
    this.load();
    this.loadSellers();
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll(this.statusFilter || undefined).subscribe({
      next: (res) => {
        this.tasks.set(res.items);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'Error al cargar tareas');
        this.loading.set(false);
      },
    });
  }

  private loadSellers(): void {
    const role = this.auth.role();
    const userId = this.auth.user()?.id;
    if (role === Role.VENDEDOR) return;
    if (role === Role.COORDINADOR && userId) {
      this.usersService.getAssignedSellers(userId).subscribe({
        next: (list) => this.setSellers(list),
        error: () => this.setSellers([]),
      });
    } else {
      this.usersService.getAll().subscribe({
        next: (res) =>
          this.setSellers(res.items.filter((u) => u.role === Role.VENDEDOR)),
        error: () => this.setSellers([]),
      });
    }
  }

  private setSellers(list: ManagedUser[]): void {
    this.sellers.set(list);
    this.names = Object.fromEntries(list.map((u) => [u.id, u.name]));
  }

  sellerName(id: string): string {
    return this.names[id] ?? '—';
  }

  statusLabel(status: string): string {
    return TASK_STATUS_LABELS[status] ?? status;
  }

  isOverdue(t: Task): boolean {
    if (t.status === 'COMPLETADA' || !t.dueDate) return false;
    return new Date(t.dueDate).getTime() < Date.now();
  }

  openNew(): void {
    this.form = { title: '', assignedToId: '' };
    this.dueDate = '';
    this.dialog = true;
  }

  save(): void {
    if (!this.form.title || !this.form.assignedToId) {
      this.toast.error('Completa título y vendedor');
      return;
    }
    const dto: CreateTask = { ...this.form };
    if (this.dueDate) dto.dueDate = new Date(this.dueDate).toISOString();
    this.saving.set(true);
    this.service.create(dto).subscribe({
      next: () => {
        this.toast.success('Tarea creada');
        this.saving.set(false);
        this.dialog = false;
        this.load();
      },
      error: (e: ApiError) => {
        this.saving.set(false);
        this.toast.error(e.userMessage ?? 'No se pudo crear la tarea');
      },
    });
  }

  setStatus(task: Task, status: string): void {
    this.service.update(task.id, { status }).subscribe({
      next: () => {
        const label = status === 'COMPLETADA' ? 'completada' : 'iniciada';
        this.toast.success(`Tarea ${label}`);
        this.load();
      },
      error: (e: ApiError) =>
        this.toast.error(e.userMessage ?? 'No se pudo actualizar'),
    });
  }
}
