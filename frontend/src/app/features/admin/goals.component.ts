import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { AuthService } from '@core/auth/auth.service';
import { Role } from '@core/constants/roles';
import { ApiError } from '@core/models/api-error.model';
import { CreateGoal, Goal } from '@core/models/goal.model';
import { ManagedUser } from '@core/models/user.model';
import { GoalsService } from '@core/services/goals.service';
import { UsersService } from '@core/services/users.service';
import { ToastService } from '@core/services/toast.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

@Component({
  selector: 'app-admin-goals',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    MessageModule,
    TableModule,
    EmptyStateComponent,
    LoadingComponent,
    PageHeaderComponent,
  ],
  template: `
    <div class="sf-page">
      <app-page-header
        title="Metas mensuales"
        subtitle="Define objetivos por empresa o por vendedor y monitorea el avance real."
      >
        @if (isAdmin()) {
          <p-button label="Nueva meta" icon="pi pi-plus" (onClick)="openNew()" />
        }
      </app-page-header>

      <!-- Filtro de periodo -->
      <div class="period-bar">
        <div class="sf-field">
          <label>Año</label>
          <select class="sf-select" [(ngModel)]="filterYear" (ngModelChange)="load()">
            @for (y of years; track y) {
              <option [ngValue]="y">{{ y }}</option>
            }
          </select>
        </div>
        <div class="sf-field">
          <label>Mes</label>
          <select class="sf-select" [(ngModel)]="filterMonth" (ngModelChange)="load()">
            <option [ngValue]="null">Todos</option>
            @for (m of months; let i = $index; track i) {
              <option [ngValue]="i + 1">{{ m }}</option>
            }
          </select>
        </div>
      </div>

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <p-message severity="error" [text]="error()!" />
      } @else if (goals().length === 0) {
        <app-empty-state
          icon="pi pi-flag"
          title="Sin metas para este periodo"
          description="Define una meta para que el dashboard muestre el avance del mes."
        >
          @if (isAdmin()) {
            <p-button label="Crear la primera" icon="pi pi-plus" (onClick)="openNew()" />
          }
        </app-empty-state>
      } @else {
        <div class="goals-grid">
          @for (g of goals(); track g.id) {
            <div class="goal-card">
              <div class="goal-head">
                <div>
                  <div class="goal-scope">{{ scopeLabel(g) }}</div>
                  <div class="goal-period">{{ periodLabel(g) }}</div>
                </div>
                @if (isAdmin()) {
                  <button class="edit-btn" (click)="openEdit(g)" title="Editar meta">
                    <i class="pi pi-pencil"></i>
                  </button>
                }
              </div>

              <div class="goal-amounts">
                <span class="actual">
                  {{ g.actualAmount ?? 0 | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
                </span>
                <span class="separator">/</span>
                <span class="target">
                  {{ +g.targetAmount | currency: 'COP' : 'symbol-narrow' : '1.0-0' }}
                </span>
              </div>

              <div class="goal-track">
                <div class="goal-fill"
                  [style.width.%]="safePercent(g.progress)"
                  [class.overgoal]="(g.progress ?? 0) >= 100"
                ></div>
              </div>

              <div class="goal-footer">
                <span class="goal-pct" [class.done]="(g.progress ?? 0) >= 100">
                  {{ safePercent(g.progress) }}% completado
                </span>
                @if (g.targetSales) {
                  <span class="goal-sales text-muted text-xs">
                    {{ g.actualSales ?? 0 }} / {{ g.targetSales }} ventas
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal nueva meta -->
    <p-dialog
      header="Nueva meta"
      [(visible)]="createDialog"
      [modal]="true"
      [style]="{ width: '420px' }"
    >
      <div class="sf-stack">
        <div class="sf-field">
          <label>Alcance</label>
          <select class="sf-select" [(ngModel)]="scope">
            <option value="EMPRESA">Empresa (toda la operación)</option>
            <option value="VENDEDOR">Vendedor específico</option>
          </select>
        </div>
        @if (scope === 'VENDEDOR') {
          <div class="sf-field">
            <label>Vendedor</label>
            <select class="sf-select" [(ngModel)]="userId">
              <option value="">— Selecciona —</option>
              @for (u of sellers(); track u.id) {
                <option [value]="u.id">{{ u.name }}</option>
              }
            </select>
          </div>
        }
        <div class="grid-2">
          <div class="sf-field">
            <label>Año</label>
            <input pInputText type="number" [(ngModel)]="newYear" min="2020" max="2100" />
          </div>
          <div class="sf-field">
            <label>Mes</label>
            <select class="sf-select" [(ngModel)]="newMonth">
              @for (m of months; let i = $index; track i) {
                <option [ngValue]="i + 1">{{ m }}</option>
              }
            </select>
          </div>
        </div>
        <div class="sf-field">
          <label>Meta de ingresos (COP)</label>
          <input pInputText type="number" [(ngModel)]="targetAmount" min="0" />
        </div>
        <div class="sf-field">
          <label>Número de ventas objetivo <span class="text-muted">(opcional)</span></label>
          <input pInputText type="number" [(ngModel)]="targetSales" min="0" placeholder="Ej: 10" />
        </div>
      </div>
      <div class="dialog-actions">
        <p-button label="Cancelar" severity="secondary" (onClick)="createDialog = false" />
        <p-button label="Guardar meta" [loading]="saving()" (onClick)="saveNew()" />
      </div>
    </p-dialog>

    <!-- Modal editar meta -->
    <p-dialog
      header="Editar meta"
      [(visible)]="editDialog"
      [modal]="true"
      [style]="{ width: '380px' }"
    >
      <div class="sf-stack">
        <p class="text-muted text-sm">
          <strong>{{ scopeLabel(editGoal) }}</strong> — {{ periodLabel(editGoal) }}
        </p>
        <div class="sf-field">
          <label>Meta de ingresos (COP)</label>
          <input pInputText type="number" [(ngModel)]="editAmount" min="0" />
        </div>
        <div class="sf-field">
          <label>Número de ventas objetivo <span class="text-muted">(opcional)</span></label>
          <input pInputText type="number" [(ngModel)]="editSales" min="0" />
        </div>
      </div>
      <div class="dialog-actions">
        <p-button label="Cancelar" severity="secondary" (onClick)="editDialog = false" />
        <p-button label="Actualizar" [loading]="saving()" (onClick)="saveEdit()" />
      </div>
    </p-dialog>
  `,
  styles: [
    `
      .period-bar {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
        flex-wrap: wrap;
      }
      .period-bar .sf-field { min-width: 120px; }

      .goals-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
      }

      .goal-card {
        border: 1px solid var(--sf-border);
        border-radius: 14px;
        background: #fff;
        padding: 1rem 1.1rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .goal-head {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
      }
      .goal-scope { font-weight: 700; font-size: 0.95rem; }
      .goal-period { font-size: 0.78rem; color: var(--sf-text-muted); margin-top: 0.1rem; }

      .edit-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: var(--sf-text-muted);
        padding: 0.2rem;
        border-radius: 6px;
        transition: color 0.15s, background 0.15s;
      }
      .edit-btn:hover { color: var(--sf-primary); background: var(--sf-primary-soft); }

      .goal-amounts {
        display: flex;
        align-items: baseline;
        gap: 0.4rem;
        margin-top: 0.2rem;
      }
      .actual { font-size: 1.25rem; font-weight: 700; color: var(--sf-primary); font-variant-numeric: tabular-nums; }
      .separator { color: var(--sf-text-muted); }
      .target { font-size: 0.9rem; color: var(--sf-text-muted); font-variant-numeric: tabular-nums; }

      .goal-track {
        height: 8px;
        background: var(--sf-surface-2);
        border-radius: 999px;
        overflow: hidden;
      }
      .goal-fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, #2563eb, #10b981);
        transition: width 0.4s ease;
      }
      .goal-fill.overgoal {
        background: linear-gradient(90deg, #10b981, #059669);
      }

      .goal-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .goal-pct { font-size: 0.78rem; color: var(--sf-text-muted); font-weight: 600; }
      .goal-pct.done { color: #059669; }
      .goal-sales { font-size: 0.75rem; }

      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
      .dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.25rem; }
    `,
  ],
})
export class AdminGoalsComponent implements OnInit {
  private readonly service   = inject(GoalsService);
  private readonly usersSvc  = inject(UsersService);
  private readonly toast     = inject(ToastService);
  private readonly auth      = inject(AuthService);

  readonly isAdmin = computed(() => this.auth.user()?.role === Role.ADMIN);

  goals   = signal<Goal[]>([]);
  sellers = signal<ManagedUser[]>([]);
  loading = signal(false);
  error   = signal<string | null>(null);
  saving  = signal(false);

  createDialog = false;
  editDialog   = false;
  editGoal: Goal = {} as Goal;

  readonly months = MONTHS;
  readonly years  = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - 1 + i);

  filterYear:  number      = new Date().getFullYear();
  filterMonth: number|null = new Date().getMonth() + 1;

  // Form nueva meta
  scope:        'EMPRESA' | 'VENDEDOR' = 'EMPRESA';
  userId        = '';
  newYear       = new Date().getFullYear();
  newMonth      = new Date().getMonth() + 1;
  targetAmount  = 0;
  targetSales   = 0;

  // Form editar meta
  editAmount = 0;
  editSales  = 0;

  ngOnInit(): void {
    this.load();
    this.usersSvc.getSellers().subscribe({
      next: (res) => this.sellers.set(res.items),
      error: () => this.sellers.set([]),
    });
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll(
      this.filterYear,
      this.filterMonth ?? undefined,
    ).subscribe({
      next: (goals) => { this.goals.set(goals); this.loading.set(false); },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'Error al cargar metas');
        this.loading.set(false);
      },
    });
  }

  scopeLabel(g: Goal): string {
    if (g.userName)   return g.userName;
    if (g.officeName) return `Oficina: ${g.officeName}`;
    return 'Empresa';
  }

  periodLabel(g: Goal): string {
    if (!g?.month || !g?.year) return '';
    return `${MONTHS[(g.month ?? 1) - 1]} ${g.year}`;
  }

  safePercent(pct: number | null | undefined): number {
    const p = pct ?? 0;
    return Math.max(0, Math.min(100, Math.round(Number.isFinite(p) ? p : 0)));
  }

  openNew(): void {
    this.scope = 'EMPRESA';
    this.userId = '';
    this.newYear = new Date().getFullYear();
    this.newMonth = new Date().getMonth() + 1;
    this.targetAmount = 0;
    this.targetSales = 0;
    this.createDialog = true;
  }

  openEdit(g: Goal): void {
    this.editGoal = g;
    this.editAmount = Number(g.targetAmount);
    this.editSales = g.targetSales ?? 0;
    this.editDialog = true;
  }

  saveNew(): void {
    if (!this.targetAmount || this.targetAmount <= 0) {
      this.toast.error('Ingresa un monto mayor a cero');
      return;
    }
    const dto: CreateGoal = {
      year: Number(this.newYear),
      month: Number(this.newMonth),
      targetAmount: Number(this.targetAmount),
      targetSales: this.targetSales > 0 ? Number(this.targetSales) : undefined,
    };
    if (this.scope === 'VENDEDOR') {
      if (!this.userId) { this.toast.error('Selecciona un vendedor'); return; }
      dto.userId = this.userId;
    }
    this.saving.set(true);
    this.service.create(dto).subscribe({
      next: () => {
        this.toast.success('Meta creada');
        this.saving.set(false);
        this.createDialog = false;
        this.load();
      },
      error: (e: ApiError) => {
        this.saving.set(false);
        this.toast.error(e.userMessage ?? 'No se pudo crear la meta');
      },
    });
  }

  saveEdit(): void {
    if (!this.editAmount || this.editAmount <= 0) {
      this.toast.error('Ingresa un monto mayor a cero');
      return;
    }
    this.saving.set(true);
    this.service.update(this.editGoal.id, {
      targetAmount: Number(this.editAmount),
      targetSales: this.editSales > 0 ? Number(this.editSales) : undefined,
    }).subscribe({
      next: () => {
        this.toast.success('Meta actualizada');
        this.saving.set(false);
        this.editDialog = false;
        this.load();
      },
      error: (e: ApiError) => {
        this.saving.set(false);
        this.toast.error(e.userMessage ?? 'No se pudo actualizar');
      },
    });
  }
}
