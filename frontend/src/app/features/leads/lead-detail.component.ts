import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@core/auth/auth.service';
import { Role } from '@core/constants/roles';
import {
  LEAD_STATUS_LABELS,
  LeadStatus,
} from '@core/constants/lead-statuses';
import { ApiError } from '@core/models/api-error.model';
import { Lead, LeadComment, LeadStatusHistoryEntry } from '@core/models/lead.model';
import { ManagedUser } from '@core/models/user.model';
import { FollowUp } from '@core/models/goal.model';
import { Task, TASK_STATUS_LABELS } from '@core/models/task.model';
import { LeadsService } from '@core/services/leads.service';
import { SalesService } from '@core/services/sales.service';
import { TasksService } from '@core/services/tasks.service';
import { UsersService } from '@core/services/users.service';
import { ToastService } from '@core/services/toast.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-lead-detail',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    MessageModule,
    LoadingComponent,
    PageHeaderComponent,
    SectionCardComponent,
    StatusBadgeComponent,
  ],
  template: `
    <div class="sf-page">
      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <p-message severity="error" [text]="error()!" />
      } @else if (lead()) {
        @let l = lead()!;

        <app-page-header
          [title]="l.name"
          subtitle="Detalle del lead y seguimiento comercial."
        >
          <a [routerLink]="[basePath()]" class="back-link">
            <i class="pi pi-arrow-left"></i> Volver a leads
          </a>
        </app-page-header>

        <div class="layout">
          <div class="column">
            <app-section-card
              title="Información del cliente"
              description="Datos recibidos del lead."
            >
              <div slot="actions">
                <app-status-badge [status]="l.status" />
              </div>
              <div class="info-grid">
                <div>
                  <div class="info-label">Teléfono</div>
                  <div class="info-value mono">{{ l.phone }}</div>
                </div>
                <div>
                  <div class="info-label">Documento</div>
                  <div class="info-value">
                    {{ l.documentType ? l.documentType + ' ' : '' }}{{ l.documentNumber || '—' }}
                  </div>
                </div>
                <div>
                  <div class="info-label">Fecha activación</div>
                  <div class="info-value">{{ l.activationDate ? (l.activationDate | date:'mediumDate') : '—' }}</div>
                </div>
                <div>
                  <div class="info-label">Origen</div>
                  <div class="info-value">{{ l.source || '—' }}</div>
                </div>
                <div>
                  <div class="info-label">Creado</div>
                  <div class="info-value">{{ l.createdAt | date: 'medium' }}</div>
                </div>
                <div class="info-full">
                  <div class="info-label">Notas</div>
                  <div class="info-value">{{ l.notes || '—' }}</div>
                </div>
              </div>
            </app-section-card>

            @if (canChangeStatus() || canSell()) {
              <app-section-card
                title="Acciones"
                description="Mueve el lead por el pipeline o registra la venta."
              >
                @if (canChangeStatus()) {
                  <div class="action-row">
                    <select class="sf-select" [(ngModel)]="newStatus">
                      @for (s of statuses; track s) {
                        <option [ngValue]="s">{{ labels[s] }}</option>
                      }
                    </select>
                    <p-button
                      label="Actualizar estado"
                      icon="pi pi-sync"
                      (onClick)="changeStatus(l.id)"
                    />
                  </div>
                }
                @if (canSell()) {
                  <div class="action-row mt-2">
                    <p-button
                      label="Registrar venta"
                      icon="pi pi-dollar"
                      (onClick)="saleVisible.set(true)"
                    />
                  </div>
                }
              </app-section-card>
            }

            @if (canAssignSeller()) {
              <app-section-card
                title="Vendedor asignado"
                description="Asigna este lead a uno de tus vendedores."
              >
                <div class="action-row">
                  <select class="sf-select" [(ngModel)]="selectedSellerId">
                    <option [ngValue]="null">— Sin asignar —</option>
                    @for (s of sellers(); track s.id) {
                      <option [ngValue]="s.id">{{ s.name }}</option>
                    }
                  </select>
                  <p-button
                    label="Guardar"
                    icon="pi pi-check"
                    [loading]="savingSeller()"
                    (onClick)="saveAssignSeller(l.id)"
                  />
                </div>
                @if (lead()?.sellerId) {
                  <p class="current-seller text-muted text-sm">
                    <i class="pi pi-user"></i>
                    Asignado actualmente a: <strong>{{ sellerName() }}</strong>
                  </p>
                }
              </app-section-card>
            }

            <app-section-card
              title="Seguimientos"
              description="Cada contacto actualiza la fecha de última gestión."
            >
              <div class="fu-form">
                <select class="sf-select" [(ngModel)]="followUpChannel">
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="LLAMADA">Llamada</option>
                  <option value="PRESENCIAL">Presencial</option>
                  <option value="EMAIL">Email</option>
                  <option value="OTRO">Otro</option>
                </select>
                <input
                  class="sf-input"
                  [(ngModel)]="followUpNotes"
                  placeholder="¿Qué pasó en este contacto?"
                />
                <p-button
                  label="Agregar"
                  icon="pi pi-plus"
                  size="small"
                  (onClick)="addFollowUp(l.id)"
                />
              </div>

              @if (followUps().length === 0) {
                <p class="text-muted text-sm mt-2">Aún no hay seguimientos.</p>
              } @else {
                <ul class="timeline">
                  @for (f of followUps(); track f.id) {
                    <li>
                      <div class="bullet"></div>
                      <div class="t-body">
                        <div class="t-meta">
                          <span class="chip">{{ f.channel }}</span>
                          <span class="text-muted text-xs">
                            {{ f.createdAt | date: 'short' }}
                          </span>
                        </div>
                        <div class="t-text">{{ f.notes }}</div>
                      </div>
                    </li>
                  }
                </ul>
              }
            </app-section-card>
          </div>

          <div class="column">

            @if (statusHistory().length > 0) {
              <app-section-card
                title="Historial de estados"
                description="Cambios de estado registrados en orden cronológico."
              >
                <ul class="timeline">
                  @for (h of statusHistory(); track h.id) {
                    <li>
                      <div class="bullet" [class.bullet-first]="!h.fromState"></div>
                      <div class="t-body">
                        <div class="t-meta">
                          <span class="chip">{{ statusHistoryLabel(h) }}</span>
                          <span class="text-muted text-xs">
                            {{ h.createdAt | date: 'short' }}
                          </span>
                        </div>
                        @if (h.changedByName) {
                          <div class="t-text text-sm">
                            <i class="pi pi-user" style="font-size:0.7rem"></i>
                            {{ h.changedByName }}
                          </div>
                        }
                      </div>
                    </li>
                  }
                </ul>
              </app-section-card>
            }

            @if (canAssignTask()) {
              <app-section-card
                title="Tareas"
                [description]="'Tareas asignadas a este lead. ' + tasks().length + ' en total.'"
              >
                <div slot="actions">
                  <p-button
                    label="Nueva tarea"
                    icon="pi pi-plus"
                    size="small"
                    (onClick)="taskVisible.set(true)"
                  />
                </div>
                @if (tasks().length === 0) {
                  <p class="text-muted text-sm mt-2">Sin tareas asignadas.</p>
                } @else {
                  <ul class="task-list">
                    @for (t of tasks(); track t.id) {
                      <li class="task-item" [class.task-done]="t.status === 'COMPLETADA'">
                        <i class="pi" [class.pi-check-circle]="t.status === 'COMPLETADA'" [class.pi-circle]="t.status !== 'COMPLETADA'" (click)="toggleTask(t)"></i>
                        <div class="task-body">
                          <div class="task-title" [class.task-title-done]="t.status === 'COMPLETADA'">{{ t.title }}</div>
                          <div class="task-meta text-xs text-muted">
                            @if (t.assignedTo) { {{ t.assignedTo.name }} · }
                            @if (t.dueDate) { Vence {{ t.dueDate | date:'dd MMM' }} · }
                            <span [class.text-danger]="t.status === 'VENCIDA'">{{ taskLabels[t.status] }}</span>
                          </div>
                        </div>
                      </li>
                    }
                  </ul>
                }
              </app-section-card>
            }

            <app-section-card
              title="Comentarios internos"
              description="Visibles para el equipo, no para el cliente."
            >
              <div class="fu-form">
                <input
                  class="sf-input"
                  [(ngModel)]="commentBody"
                  placeholder="Comentario para tu equipo"
                />
                <p-button
                  label="Comentar"
                  icon="pi pi-comment"
                  size="small"
                  (onClick)="addComment(l.id)"
                />
              </div>

              @if (comments().length === 0) {
                <p class="text-muted text-sm mt-2">Sin comentarios.</p>
              } @else {
                <ul class="comments">
                  @for (c of comments(); track c.id) {
                    <li>
                      <div class="avatar">{{ initials(c.author.name) }}</div>
                      <div class="c-body">
                        <div class="c-meta">
                          <span class="c-author">{{ c.author.name }}</span>
                          <span class="text-muted text-xs">
                            {{ c.createdAt | date: 'short' }}
                          </span>
                        </div>
                        <div class="c-text">{{ c.body }}</div>
                      </div>
                    </li>
                  }
                </ul>
              }
            </app-section-card>
          </div>
        </div>

        <p-dialog
          header="Registrar venta — {{ l.name }}"
          [(visible)]="saleDialog"
          [modal]="true"
          [style]="{ width: '420px' }"
        >
          <div class="sf-stack">
            <div class="sf-field">
              <label>Monto (COP) <span class="text-danger">*</span></label>
              <input class="sf-input" type="number" min="0" [(ngModel)]="amount" />
            </div>
            <div class="sf-field">
              <label>Fecha de venta</label>
              <input class="sf-input" type="date" [(ngModel)]="saleDate" />
            </div>
            <div class="sf-field">
              <label>Descripción / producto <span class="text-muted">(opcional)</span></label>
              <input
                class="sf-input"
                [(ngModel)]="saleDescription"
                placeholder="Plan, equipo, servicio…"
              />
            </div>
          </div>
          <div class="dialog-actions">
            <p-button
              label="Cancelar"
              severity="secondary"
              (onClick)="saleVisible.set(false)"
            />
            <p-button
              label="Guardar venta"
              icon="pi pi-check"
              [loading]="savingSale()"
              (onClick)="registerSale(l.id)"
            />
          </div>
        </p-dialog>

        <p-dialog
          header="Nueva tarea — {{ l.name }}"
          [(visible)]="taskDialog"
          [modal]="true"
          [style]="{ width: '420px' }"
        >
          <div class="sf-stack">
            <div class="sf-field">
              <label>Título <span class="text-danger">*</span></label>
              <input class="sf-input" [(ngModel)]="taskTitle" placeholder="Ej: Llamar para confirmar interés" />
            </div>
            <div class="sf-field">
              <label>Descripción <span class="text-muted">(opcional)</span></label>
              <input class="sf-input" [(ngModel)]="taskDescription" placeholder="Detalles adicionales…" />
            </div>
            <div class="sf-field">
              <label>Asignar a <span class="text-danger">*</span></label>
              <select class="sf-select" [(ngModel)]="taskAssignedToId">
                <option value="">— Selecciona vendedor —</option>
                @for (s of sellers(); track s.id) {
                  <option [ngValue]="s.id">{{ s.name }}</option>
                }
              </select>
            </div>
            <div class="sf-field">
              <label>Fecha límite <span class="text-muted">(opcional)</span></label>
              <input class="sf-input" type="date" [(ngModel)]="taskDueDate" />
            </div>
          </div>
          <div class="dialog-actions">
            <p-button label="Cancelar" severity="secondary" (onClick)="taskVisible.set(false)" />
            <p-button
              label="Crear tarea"
              icon="pi pi-check"
              [loading]="savingTask()"
              (onClick)="createTask(l.id)"
            />
          </div>
        </p-dialog>
      }
    </div>
  `,
  styles: [
    `
      .layout {
        display: grid;
        grid-template-columns: 1.6fr 1fr;
        gap: 1.25rem;
      }
      @media (max-width: 920px) {
        .layout { grid-template-columns: 1fr; }
      }
      .column {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        color: var(--sf-text-muted);
        font-weight: 500;
      }
      .back-link:hover { color: var(--sf-primary); }
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem 1.25rem;
      }
      .info-full { grid-column: 1 / -1; }
      .info-label {
        color: var(--sf-text-muted);
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin-bottom: 0.2rem;
      }
      .info-value { color: var(--sf-text); }
      .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }

      .action-row {
        display: flex;
        gap: 0.5rem;
        align-items: center;
        flex-wrap: wrap;
      }
      .action-row .sf-select { max-width: 220px; }
      .current-seller { margin-top: 0.5rem; display: flex; align-items: center; gap: 0.35rem; }

      .fu-form {
        display: grid;
        grid-template-columns: 140px 1fr auto;
        gap: 0.5rem;
        align-items: center;
      }
      .fu-form .sf-input { width: 100%; }
      @media (max-width: 640px) {
        .fu-form { grid-template-columns: 1fr; }
      }

      .timeline {
        list-style: none;
        padding: 0;
        margin: 1rem 0 0;
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
      }
      .timeline li {
        display: grid;
        grid-template-columns: 14px 1fr;
        gap: 0.75rem;
      }
      .timeline .bullet {
        width: 12px;
        height: 12px;
        margin-top: 0.35rem;
        border-radius: 999px;
        background: var(--sf-primary);
        box-shadow: 0 0 0 4px var(--sf-primary-soft);
      }
      .timeline .bullet.bullet-first {
        background: var(--sf-success);
        box-shadow: 0 0 0 4px var(--sf-success-soft);
      }
      .t-body {
        background: var(--sf-surface-2);
        border-radius: var(--sf-radius-sm);
        padding: 0.6rem 0.75rem;
      }
      .t-meta { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.25rem; }
      .chip {
        background: var(--sf-surface);
        border: 1px solid var(--sf-border);
        color: var(--sf-text-muted);
        font-size: 0.68rem;
        font-weight: 700;
        padding: 0.1rem 0.4rem;
        border-radius: 999px;
        letter-spacing: 0.04em;
      }
      .t-text { color: var(--sf-text); }

      .comments {
        list-style: none;
        padding: 0;
        margin: 1rem 0 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .comments li {
        display: grid;
        grid-template-columns: 32px 1fr;
        gap: 0.6rem;
      }
      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 10px;
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        color: #fff;
        font-weight: 700;
        font-size: 0.72rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .c-meta { display: flex; gap: 0.5rem; align-items: baseline; }
      .c-author { font-weight: 600; font-size: 0.85rem; }
      .c-text { color: var(--sf-text); margin-top: 0.15rem; }

      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.25rem;
      }
    `,
  ],
})
export class LeadDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly leadsService = inject(LeadsService);
  private readonly salesService = inject(SalesService);
  private readonly usersService = inject(UsersService);
  private readonly tasksService = inject(TasksService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);

  lead          = signal<Lead | null>(null);
  followUps     = signal<FollowUp[]>([]);
  comments      = signal<LeadComment[]>([]);
  statusHistory = signal<LeadStatusHistoryEntry[]>([]);
  tasks         = signal<(Task & { assignedTo: { id: string; name: string } | null })[]>([]);
  sellers       = signal<ManagedUser[]>([]);
  loading       = signal(false);
  savingSeller  = signal(false);
  savingTask    = signal(false);
  error         = signal<string | null>(null);
  saleVisible   = signal(false);
  taskVisible   = signal(false);

  selectedSellerId: string | null = null;

  newStatus: LeadStatus = LeadStatus.CONTACTADO;
  amount = 0;
  saleDate = '';
  saleDescription = '';
  savingSale = signal(false);
  followUpChannel = 'WHATSAPP';
  followUpNotes = '';
  commentBody = '';

  taskTitle = '';
  taskDescription = '';
  taskAssignedToId = '';
  taskDueDate = '';

  statuses   = Object.values(LeadStatus);
  labels     = LEAD_STATUS_LABELS;
  taskLabels = TASK_STATUS_LABELS;

  basePath = computed(() => `/${this.auth.role()?.toLowerCase()}/leads`);

  canAssignSeller = computed(() => {
    const role = this.auth.role();
    return role === Role.ADMIN || role === Role.COORDINADOR;
  });

  canChangeStatus = computed(() => {
    const role = this.auth.role();
    return role === Role.VENDEDOR || role === Role.COORDINADOR;
  });

  canSell = computed(() => {
    const role = this.auth.role();
    const canByRole = role === Role.VENDEDOR || role === Role.ADMIN || role === Role.COORDINADOR;
    return canByRole && this.lead()?.status !== LeadStatus.VENDIDO;
  });

  canAssignTask = computed(() => {
    const role = this.auth.role();
    return role === Role.ADMIN || role === Role.COORDINADOR;
  });

  sellerName = computed(() => {
    const id = this.lead()?.sellerId;
    if (!id) return null;
    return this.sellers().find((s) => s.id === id)?.name ?? 'Vendedor asignado';
  });

  get saleDialog(): boolean { return this.saleVisible(); }
  set saleDialog(value: boolean) { this.saleVisible.set(value); }

  get taskDialog(): boolean { return this.taskVisible(); }
  set taskDialog(value: boolean) { this.taskVisible.set(value); }

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetch(id);
      this.loadFollowUps(id);
      this.loadComments(id);
      this.loadStatusHistory(id);
      if (this.canAssignTask()) this.loadTasks(id);
    }
  }

  private loadTasks(leadId: string): void {
    this.tasksService.getByLead(leadId).subscribe({
      next: (items) => this.tasks.set(items),
      error: () => this.tasks.set([]),
    });
  }

  createTask(leadId: string): void {
    if (!this.taskTitle.trim() || !this.taskAssignedToId) {
      this.toast.error('El título y el vendedor asignado son obligatorios');
      return;
    }
    this.savingTask.set(true);
    this.tasksService.create({
      title: this.taskTitle,
      description: this.taskDescription || undefined,
      assignedToId: this.taskAssignedToId,
      leadId,
      dueDate: this.taskDueDate || undefined,
    }).subscribe({
      next: () => {
        this.toast.success('Tarea creada');
        this.taskVisible.set(false);
        this.taskTitle = '';
        this.taskDescription = '';
        this.taskAssignedToId = '';
        this.taskDueDate = '';
        this.savingTask.set(false);
        this.loadTasks(leadId);
      },
      error: (e: ApiError) => {
        this.savingTask.set(false);
        this.toast.error(e.userMessage ?? 'No se pudo crear la tarea');
      },
    });
  }

  toggleTask(task: Task & { assignedTo: any }): void {
    const newStatus = task.status === 'COMPLETADA' ? 'PENDIENTE' : 'COMPLETADA';
    this.tasksService.update(task.id, { status: newStatus }).subscribe({
      next: (updated) => {
        this.tasks.update((list) =>
          list.map((t) => (t.id === updated.id ? { ...t, status: updated.status } : t))
        );
      },
      error: () => this.toast.error('No se pudo actualizar la tarea'),
    });
  }

  private loadSellers(officeId?: string | null): void {
    // ADMIN puede asignar cualquier vendedor de la empresa; COORDINADOR solo los suyos (endpoint distinto).
    const officeFilter = this.auth.role() === Role.ADMIN ? undefined : officeId ?? undefined;
    this.usersService.getSellers(officeFilter).subscribe({
      next: (res) => this.sellers.set(res.items),
      error: ()    => this.sellers.set([]),
    });
  }

  saveAssignSeller(leadId: string): void {
    this.savingSeller.set(true);
    this.leadsService.assignSeller(leadId, this.selectedSellerId).subscribe({
      next: (updated) => {
        this.lead.set(updated);
        this.savingSeller.set(false);
        this.toast.success(
          this.selectedSellerId ? 'Vendedor asignado' : 'Vendedor removido',
        );
      },
      error: (e: ApiError) => {
        this.savingSeller.set(false);
        this.toast.error(e.userMessage ?? 'No se pudo asignar el vendedor');
      },
    });
  }

  private loadFollowUps(id: string): void {
    this.leadsService.getFollowUps(id).subscribe({
      next: (items) => this.followUps.set(items),
      error: () => this.followUps.set([]),
    });
  }

  private loadComments(id: string): void {
    this.leadsService.getComments(id).subscribe({
      next: (items) => this.comments.set(items),
      error: () => this.comments.set([]),
    });
  }

  private loadStatusHistory(id: string): void {
    this.leadsService.getStatusHistory(id).subscribe({
      next: (items) => this.statusHistory.set(items),
      error: () => this.statusHistory.set([]),
    });
  }

  statusHistoryLabel(entry: LeadStatusHistoryEntry): string {
    const from = entry.fromState ? (this.labels[entry.fromState as LeadStatus] ?? entry.fromState) : 'Creado';
    const to   = this.labels[entry.toState as LeadStatus] ?? entry.toState;
    return entry.fromState ? `${from} → ${to}` : `Ingresado como ${to}`;
  }

  addComment(id: string): void {
    if (!this.commentBody.trim()) {
      this.toast.error('Escribe un comentario');
      return;
    }
    this.leadsService.addComment(id, this.commentBody).subscribe({
      next: () => {
        this.commentBody = '';
        this.toast.success('Comentario agregado');
        this.loadComments(id);
      },
      error: (e: ApiError) =>
        this.toast.error(e.userMessage ?? 'No se pudo comentar'),
    });
  }

  addFollowUp(id: string): void {
    if (!this.followUpNotes.trim()) {
      this.toast.error('Escribe una nota');
      return;
    }
    this.leadsService
      .addFollowUp(id, {
        channel: this.followUpChannel,
        notes: this.followUpNotes,
      })
      .subscribe({
        next: () => {
          this.followUpNotes = '';
          this.toast.success('Seguimiento agregado');
          this.loadFollowUps(id);
        },
        error: (e: ApiError) =>
          this.toast.error(e.userMessage ?? 'No se pudo agregar'),
      });
  }

  private fetch(id: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.leadsService.getById(id).subscribe({
      next: (lead) => {
        this.lead.set(lead);
        this.newStatus = lead.status;
        this.selectedSellerId = lead.sellerId;
        this.loading.set(false);
        if (this.canAssignSeller()) this.loadSellers(lead.officeId ?? undefined);
      },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'No se pudo cargar el lead');
        this.loading.set(false);
      },
    });
  }

  changeStatus(id: string): void {
    this.leadsService.updateStatus(id, this.newStatus).subscribe({
      next: (lead) => {
        this.lead.set(lead);
        this.toast.success('Estado actualizado');
        this.loadStatusHistory(id);
      },
      error: (e: ApiError) =>
        this.toast.error(e.userMessage ?? 'No se pudo actualizar'),
    });
  }

  registerSale(leadId: string): void {
    if (!this.amount || this.amount <= 0) {
      this.toast.error('Ingresa un monto válido');
      return;
    }
    this.savingSale.set(true);
    this.salesService
      .register({
        leadId,
        amount: Number(this.amount),
        notes: this.saleDescription || undefined,
        saleDate: this.saleDate || undefined,
      })
      .subscribe({
        next: () => {
          this.toast.success('Venta registrada');
          this.saleVisible.set(false);
          this.amount = 0;
          this.saleDate = '';
          this.saleDescription = '';
          this.savingSale.set(false);
          this.fetch(leadId);
        },
        error: (e: ApiError) => {
          this.savingSale.set(false);
          this.toast.error(e.userMessage ?? 'No se pudo registrar la venta');
        },
      });
  }
}
