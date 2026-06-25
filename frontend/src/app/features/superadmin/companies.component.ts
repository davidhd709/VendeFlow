import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { Tag } from 'primeng/tag';
import { ApiError } from '@core/models/api-error.model';
import { Company } from '@core/models/company.model';
import { CompaniesService } from '@core/services/companies.service';
import { ToastService } from '@core/services/toast.service';
import { EmptyStateComponent } from '@shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { PageHeaderComponent } from '@shared/components/page-header/page-header.component';
import { SectionCardComponent } from '@shared/components/section-card/section-card.component';

@Component({
  selector: 'app-superadmin-companies',
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
        title="Empresas"
        subtitle="Plataforma SalesFlow — gestión multiempresa."
      >
        <p-button label="Nueva empresa" icon="pi pi-plus" (onClick)="openNew()" />
      </app-page-header>

      @if (loading()) {
        <app-loading />
      } @else if (error()) {
        <p-message severity="error" [text]="error()!" />
      } @else if (companies().length === 0) {
        <app-empty-state
          icon="pi pi-building"
          title="Sin empresas en la plataforma"
          description="Registra la primera empresa y su administrador inicial."
        >
          <p-button label="Registrar la primera" icon="pi pi-plus" (onClick)="openNew()" />
        </app-empty-state>
      } @else {
        <app-section-card
          title="Empresas registradas"
          description="Cada empresa tiene su propio subdominio y panel aislado."
        >
          <p-table [value]="companies()" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
              <tr>
                <th>Empresa</th>
                <th>Subdominio</th>
                <th>Slug</th>
                <th>Estado</th>
                <th class="actions-col"></th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-c>
              <tr>
                <td><strong>{{ c.name }}</strong></td>
                <td class="mono text-sm">{{ c.subdomain }}</td>
                <td class="mono text-sm text-muted">{{ c.slug }}</td>
                <td>
                  <p-tag
                    [value]="statusLabel(c.status)"
                    [severity]="
                      c.status === 'ACTIVE' ? 'success'
                      : c.status === 'SUSPENDED' ? 'danger' : 'warn'
                    "
                  />
                </td>
                <td class="actions-col">
                  <p-button
                    icon="pi pi-pencil"
                    size="small"
                    severity="secondary"
                    [text]="true"
                    title="Editar empresa"
                    (onClick)="openEdit(c)"
                  />
                  <p-button
                    icon="pi pi-key"
                    size="small"
                    severity="secondary"
                    [text]="true"
                    title="Restablecer contraseña del admin"
                    (onClick)="resetAdminPassword(c)"
                  />
                  <p-button
                    [icon]="c.status === 'ACTIVE' ? 'pi pi-ban' : 'pi pi-check-circle'"
                    size="small"
                    [severity]="c.status === 'ACTIVE' ? 'danger' : 'success'"
                    [text]="true"
                    [title]="c.status === 'ACTIVE' ? 'Suspender' : 'Activar'"
                    (onClick)="toggleStatus(c)"
                  />
                </td>
              </tr>
            </ng-template>
          </p-table>
        </app-section-card>
      }
    </div>

    <!-- ── Modal: nueva empresa ────────────────────────────── -->
    <p-dialog
      header="Nueva empresa"
      [(visible)]="dialog"
      [modal]="true"
      [style]="{ width: '480px' }"
    >
      <div class="sf-stack">
        <div class="sf-field">
          <label>Nombre comercial <span class="req">*</span></label>
          <input pInputText [(ngModel)]="name" placeholder="MotoCelular Montería" />
        </div>
        <div class="grid-2">
          <div class="sf-field">
            <label>Slug <span class="req">*</span></label>
            <input pInputText [(ngModel)]="slug" placeholder="motocel" />
          </div>
          <div class="sf-field">
            <label>Subdominio <span class="req">*</span></label>
            <input pInputText [(ngModel)]="subdomain" placeholder="motocel" />
          </div>
        </div>

        <div class="section-title">Administrador inicial</div>
        <div class="grid-2">
          <div class="sf-field">
            <label>Usuario <span class="req">*</span></label>
            <input pInputText [(ngModel)]="adminUsername" />
          </div>
          <div class="sf-field">
            <label>Nombre <span class="req">*</span></label>
            <input pInputText [(ngModel)]="adminName" />
          </div>
        </div>
        <p-message
          severity="info"
          text="El sistema generará una contraseña temporal que deberás entregar al administrador. Al ingresar, se le pedirá cambiarla."
          styleClass="w-full"
        />
      </div>
      <div class="dialog-actions">
        <p-button label="Cancelar" severity="secondary" (onClick)="dialog = false" />
        <p-button label="Registrar empresa" [loading]="saving()" (onClick)="save()" />
      </div>
    </p-dialog>

    <!-- ── Modal: editar empresa ──────────────────────────── -->
    <p-dialog
      header="Editar empresa"
      [(visible)]="editDialog"
      [modal]="true"
      [style]="{ width: '420px' }"
    >
      <div class="sf-stack">
        <div class="sf-field">
          <label>Nombre comercial</label>
          <input pInputText [(ngModel)]="editName" />
        </div>
        <div class="grid-2">
          <div class="sf-field">
            <label>Slug</label>
            <input pInputText [(ngModel)]="editSlug" placeholder="mi-empresa" />
          </div>
          <div class="sf-field">
            <label>Subdominio</label>
            <input pInputText [(ngModel)]="editSubdomain" placeholder="mi-empresa" />
          </div>
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
          text="Esta contraseña solo se muestra una vez. Cópiala y entrégala al administrador."
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
          El administrador deberá cambiar esta contraseña al ingresar por primera vez.
        </p>
      </div>
      <div class="dialog-actions">
        <p-button label="Entendido" (onClick)="tempPwDialog = false" />
      </div>
    </p-dialog>
  `,
  styles: [
    `
      .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
      @media (max-width: 600px) { .grid-2 { grid-template-columns: 1fr; } }
      .section-title {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--sf-text-muted);
        margin-top: 0.25rem;
      }
      .mono { font-family: 'JetBrains Mono', ui-monospace, monospace; }
      .actions-col { text-align: right; white-space: nowrap; }
      .dialog-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.25rem;
      }
      .req { color: #dc2626; }
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
      .w-full { width: 100%; }
    `,
  ],
})
export class SuperadminCompaniesComponent implements OnInit {
  private readonly service = inject(CompaniesService);
  private readonly toast = inject(ToastService);

  companies = signal<Company[]>([]);
  loading   = signal(false);
  error     = signal<string | null>(null);
  saving    = signal(false);

  // Modal nueva empresa
  dialog        = false;
  name          = '';
  slug          = '';
  subdomain     = '';
  adminUsername = '';
  adminName     = '';

  // Modal editar empresa
  editDialog    = false;
  editTarget    = signal<Company | null>(null);
  editName      = '';
  editSlug      = '';
  editSubdomain = '';

  // Modal contraseña temporal
  tempPwDialog  = false;
  tempPassword  = signal('');
  tempPwTitle   = signal('Contraseña temporal generada');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (res) => {
        this.companies.set(res.items);
        this.loading.set(false);
      },
      error: (e: ApiError) => {
        this.error.set(e.userMessage ?? 'Error al cargar empresas');
        this.loading.set(false);
      },
    });
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      ACTIVE: 'Activa', SUSPENDED: 'Suspendida', TRIAL: 'Trial',
    };
    return map[status] ?? status;
  }

  openNew(): void {
    this.name = this.slug = this.subdomain = '';
    this.adminUsername = this.adminName = '';
    this.dialog = true;
  }

  save(): void {
    if (!this.name || !this.slug || !this.subdomain || !this.adminUsername || !this.adminName) {
      this.toast.error('Completa todos los campos requeridos');
      return;
    }
    this.saving.set(true);
    this.service
      .create({
        name: this.name,
        slug: this.slug,
        subdomain: this.subdomain,
        admin: {
          username: this.adminUsername,
          name: this.adminName,
        },
      })
      .subscribe({
        next: (res) => {
          this.saving.set(false);
          this.dialog = false;
          this.load();
          // Muestra la contraseña temporal al SUPERADMIN
          this.tempPwTitle.set(`Contraseña temporal — Admin de ${this.name || res.company.name}`);
          this.tempPassword.set(res.tempPassword);
          this.tempPwDialog = true;
        },
        error: (e: ApiError) => {
          this.saving.set(false);
          this.toast.error(e.userMessage ?? 'No se pudo crear la empresa');
        },
      });
  }

  resetAdminPassword(company: Company): void {
    this.service.resetAdminPassword(company.id).subscribe({
      next: (res) => {
        this.tempPwTitle.set(`Nueva contraseña temporal — Admin de ${company.name}`);
        this.tempPassword.set(res.tempPassword);
        this.tempPwDialog = true;
      },
      error: (e: ApiError) =>
        this.toast.error(e.userMessage ?? 'No se pudo restablecer la contraseña'),
    });
  }

  copyTempPw(): void {
    navigator.clipboard.writeText(this.tempPassword()).then(
      () => this.toast.success('Contraseña copiada'),
      () => this.toast.error('No se pudo copiar'),
    );
  }

  openEdit(company: Company): void {
    this.editTarget.set(company);
    this.editName      = company.name;
    this.editSlug      = company.slug;
    this.editSubdomain = company.subdomain;
    this.editDialog    = true;
  }

  saveEdit(): void {
    const target = this.editTarget();
    if (!target) return;
    if (!this.editName || !this.editSlug || !this.editSubdomain) {
      this.toast.error('Todos los campos son requeridos');
      return;
    }
    this.saving.set(true);
    this.service.update(target.id, {
      name: this.editName,
      slug: this.editSlug,
      subdomain: this.editSubdomain,
    }).subscribe({
      next: () => {
        this.toast.success('Empresa actualizada');
        this.saving.set(false);
        this.editDialog = false;
        this.load();
      },
      error: (e: ApiError) => {
        this.saving.set(false);
        this.toast.error(e.userMessage ?? 'No se pudo actualizar la empresa');
      },
    });
  }

  toggleStatus(company: Company): void {
    const next = company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    this.service.updateStatus(company.id, next).subscribe({
      next: () => {
        this.toast.success(next === 'ACTIVE' ? 'Empresa activada' : 'Empresa suspendida');
        this.load();
      },
      error: (e: ApiError) =>
        this.toast.error(e.userMessage ?? 'No se pudo cambiar el estado'),
    });
  }
}
