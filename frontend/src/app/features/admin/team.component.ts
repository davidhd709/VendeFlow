import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { Role } from '@core/constants/roles';
import { ApiError } from '@core/models/api-error.model';
import { ManagedUser } from '@core/models/user.model';
import { UsersService } from '@core/services/users.service';
import { ToastService } from '@core/services/toast.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

@Component({
  selector: 'app-admin-team',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    MessageModule,
    EmptyStateComponent,
    LoadingComponent,
    PageHeaderComponent,
    SectionCardComponent,
  ],
  template: `
    <div class="sf-page">
      <app-page-header
        title="Equipo"
        subtitle="Asigna vendedores a cada coordinador para definir su alcance."
      />

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <p-message severity="error" [text]="error()!" />
      } @else if (coordinators().length === 0) {
        <app-empty-state
          icon="pi pi-sitemap"
          title="Sin coordinadores"
          description="Crea coordinadores desde la sección Usuarios."
        />
      } @else {
        <app-section-card
          title="Selecciona un coordinador"
          description="Sus vendedores asignados determinan los leads y tareas que verá."
        >
          <div class="sf-field" style="max-width:360px">
            <label>Coordinador</label>
            <select
              class="sf-select"
              [(ngModel)]="coordinatorId"
              (ngModelChange)="loadAssigned()"
            >
              <option value="">— Selecciona —</option>
              @for (c of coordinators(); track c.id) {
                <option [value]="c.id">{{ c.name }}</option>
              }
            </select>
          </div>
        </app-section-card>

        @if (coordinatorId) {
          <div class="cols mt-2">
            <app-section-card
              title="Vendedores asignados"
              description="Atendidos por este coordinador."
            >
              @if (assigned().length === 0) {
                <p class="text-muted">Ninguno todavía.</p>
              } @else {
                <ul class="team-list">
                  @for (s of assigned(); track s.id) {
                    <li>
                      <div class="avatar">{{ initials(s.name) }}</div>
                      <div class="meta">
                        <div class="name">{{ s.name }}</div>
                        <div class="text-muted text-xs mono">{{ s.username }}</div>
                      </div>
                      <p-button
                        label="Quitar"
                        size="small"
                        severity="danger"
                        [text]="true"
                        icon="pi pi-times"
                        (onClick)="unassign(s.id)"
                      />
                    </li>
                  }
                </ul>
              }
            </app-section-card>

            <app-section-card
              title="Disponibles"
              description="Vendedores aún sin coordinador asignado o asignados a otro."
            >
              @if (available().length === 0) {
                <p class="text-muted">No hay vendedores disponibles.</p>
              } @else {
                <ul class="team-list">
                  @for (s of available(); track s.id) {
                    <li>
                      <div class="avatar">{{ initials(s.name) }}</div>
                      <div class="meta">
                        <div class="name">{{ s.name }}</div>
                        <div class="text-muted text-xs mono">{{ s.username }}</div>
                      </div>
                      <p-button
                        label="Asignar"
                        size="small"
                        icon="pi pi-plus"
                        (onClick)="assign(s.id)"
                      />
                    </li>
                  }
                </ul>
              }
            </app-section-card>
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      .cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.25rem;
      }
      @media (max-width: 820px) { .cols { grid-template-columns: 1fr; } }
      .team-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      .team-list li {
        display: grid;
        grid-template-columns: 36px 1fr auto;
        gap: 0.75rem;
        align-items: center;
        padding: 0.6rem 0.75rem;
        background: var(--sf-surface-2);
        border-radius: var(--sf-radius-sm);
      }
      .avatar {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        color: #fff;
        font-weight: 700;
        font-size: 0.78rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .name { font-weight: 600; }
      .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
    `,
  ],
})
export class AdminTeamComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly toast = inject(ToastService);

  private allUsers = signal<ManagedUser[]>([]);
  assigned = signal<ManagedUser[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  coordinatorId = '';

  coordinators = computed(() =>
    this.allUsers().filter((u) => u.role === Role.COORDINADOR),
  );

  private sellers = computed(() =>
    this.allUsers().filter((u) => u.role === Role.VENDEDOR),
  );

  available = computed(() => {
    const assignedIds = new Set(this.assigned().map((s) => s.id));
    return this.sellers().filter((s) => !assignedIds.has(s.id));
  });

  initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  ngOnInit(): void {
    this.loading.set(true);
    this.usersService.getAll(1, 100).subscribe({
      next: (res) => {
        this.allUsers.set(res.items);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(this.friendlyLoadError(e));
        this.loading.set(false);
      },
    });
  }

  loadAssigned(): void {
    if (!this.coordinatorId) {
      this.assigned.set([]);
      return;
    }
    this.usersService.getAssignedSellers(this.coordinatorId).subscribe({
      next: (list) => this.assigned.set(list),
      error: () => this.assigned.set([]),
    });
  }

  assign(sellerId: string): void {
    this.usersService.assignSeller(this.coordinatorId, sellerId).subscribe({
      next: () => {
        this.toast.success('Vendedor asignado');
        this.loadAssigned();
      },
      error: (e: ApiError) =>
        this.toast.error(e.userMessage ?? 'No se pudo asignar'),
    });
  }

  unassign(sellerId: string): void {
    this.usersService.unassignSeller(this.coordinatorId, sellerId).subscribe({
      next: () => {
        this.toast.success('Vendedor quitado');
        this.loadAssigned();
      },
      error: (e: ApiError) =>
        this.toast.error(e.userMessage ?? 'No se pudo quitar'),
    });
  }

  private friendlyLoadError(error: ApiError): string {
    const raw = `${error?.userMessage ?? error?.message ?? ''}`.toLowerCase();
    if (raw.includes('limit') || raw.includes('greater than 100')) {
      return 'No se pudo cargar el equipo en este momento. Intenta de nuevo en unos segundos.';
    }
    return error?.userMessage ?? 'Error al cargar el equipo';
  }
}
