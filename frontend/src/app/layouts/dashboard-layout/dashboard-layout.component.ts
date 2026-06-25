import { Component, computed, inject, OnInit, signal } from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@core/auth/auth.service';
import { Role, ROLE_LABELS } from '@core/constants/roles';
import { AlertItem } from '@core/models/alert.model';
import { AlertsService } from '@core/services/alerts.service';
import { AppNotification, NotificationsService } from '@core/services/notifications.service';
import { UsersService } from '@core/services/users.service';

interface NavItem {
  label: string;
  icon: string;
  path: string;
  group?: 'main' | 'team' | 'content' | 'commerce';
}

const NAV: Record<Role, NavItem[]> = {
  [Role.SUPERADMIN]: [
    { label: 'Dashboard', icon: 'pi pi-th-large', path: '/superadmin/dashboard' },
    { label: 'Empresas',  icon: 'pi pi-building', path: '/superadmin/empresas' },
    { label: 'Auditoría', icon: 'pi pi-list',     path: '/superadmin/auditoria' },
  ],
  [Role.ADMIN]: [
    { label: 'Dashboard', icon: 'pi pi-th-large', path: '/admin/dashboard', group: 'main' },
    { label: 'Leads', icon: 'pi pi-users', path: '/admin/leads', group: 'commerce' },
    { label: 'Ventas', icon: 'pi pi-dollar', path: '/admin/ventas', group: 'commerce' },
    { label: 'Campañas', icon: 'pi pi-whatsapp', path: '/admin/campanas', group: 'commerce' },
    { label: 'Metas', icon: 'pi pi-flag', path: '/admin/metas', group: 'commerce' },
    { label: 'Productos', icon: 'pi pi-mobile', path: '/admin/productos', group: 'content' },
    { label: 'Editor web', icon: 'pi pi-pencil-ruler', path: '/admin/editor-web', group: 'content' },
    { label: 'Config. sitio', icon: 'pi pi-globe', path: '/admin/sitio-web', group: 'content' },
    { label: 'Plantillas', icon: 'pi pi-comment', path: '/admin/plantillas', group: 'content' },
    { label: 'Usuarios', icon: 'pi pi-id-card', path: '/admin/usuarios', group: 'team' },
    { label: 'Equipo', icon: 'pi pi-sitemap', path: '/admin/equipo', group: 'team' },
    { label: 'Tareas', icon: 'pi pi-check-square', path: '/admin/tareas', group: 'team' },
    { label: 'Oficinas', icon: 'pi pi-map-marker', path: '/admin/oficinas', group: 'team' },
    { label: 'Auditoría', icon: 'pi pi-list', path: '/admin/auditoria', group: 'team' },
  ],
  [Role.COORDINADOR]: [
    { label: 'Panel', icon: 'pi pi-th-large', path: '/coordinador/dashboard' },
    { label: 'Leads', icon: 'pi pi-users', path: '/coordinador/leads' },
    { label: 'Ventas', icon: 'pi pi-dollar', path: '/coordinador/ventas' },
    { label: 'Metas', icon: 'pi pi-flag', path: '/coordinador/metas' },
    { label: 'Tareas', icon: 'pi pi-check-square', path: '/coordinador/tareas' },
  ],
  [Role.VENDEDOR]: [
    { label: 'Mi panel', icon: 'pi pi-th-large', path: '/vendedor/dashboard' },
    { label: 'Mis leads', icon: 'pi pi-users', path: '/vendedor/leads' },
    { label: 'Mis ventas', icon: 'pi pi-dollar', path: '/vendedor/ventas' },
    { label: 'Mis tareas', icon: 'pi pi-check-square', path: '/vendedor/tareas' },
    { label: 'Campañas', icon: 'pi pi-whatsapp', path: '/vendedor/campanas' },
  ],
};

const MOBILE_NAV: Record<Role, NavItem[]> = {
  [Role.SUPERADMIN]: NAV[Role.SUPERADMIN],
  [Role.ADMIN]: [
    { label: 'Inicio',  icon: 'pi pi-th-large', path: '/admin/dashboard' },
    { label: 'Leads',   icon: 'pi pi-users',    path: '/admin/leads' },
    { label: 'Ventas',  icon: 'pi pi-dollar',   path: '/admin/ventas' },
    { label: 'Tareas',  icon: 'pi pi-check-square', path: '/admin/tareas' },
  ],
  [Role.COORDINADOR]: NAV[Role.COORDINADOR],
  [Role.VENDEDOR]: NAV[Role.VENDEDOR],
};

const GROUP_TITLES: Record<NonNullable<NavItem['group']>, string> = {
  main: 'General',
  commerce: 'Comercial',
  content: 'Contenido',
  team: 'Equipo',
};

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, ButtonModule, DialogModule, InputTextModule, MessageModule],
  template: `
    <div class="shell" [class.collapsed]="collapsed()">
      <aside class="sidebar" aria-label="Navegación principal">
        <div class="brand">
          <span class="brand-mark">SF</span>
          <span class="brand-name">SalesFlow</span>
        </div>

        <nav class="nav">
          @for (g of groupedNav(); track g.title) {
            @if (g.title) {
              <div class="nav-group-title">{{ g.title }}</div>
            }
            @for (item of g.items; track item.path) {
              <a
                [routerLink]="item.path"
                routerLinkActive="active"
                class="nav-link"
              >
                <i [class]="item.icon" aria-hidden="true"></i>
                <span>{{ item.label }}</span>
              </a>
            }
          }
        </nav>

        <div class="user-chip">
          <div class="avatar">{{ initials() }}</div>
          <div class="user-meta">
            <div class="user-name">{{ auth.user()?.name }}</div>
            <div class="user-role">{{ roleLabel() }}</div>
          </div>
          <button
            class="logout"
            type="button"
            (click)="openPwDialog()"
            aria-label="Cambiar contraseña"
            title="Cambiar contraseña"
          >
            <i class="pi pi-key"></i>
          </button>
          <button
            class="logout"
            type="button"
            (click)="logout()"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <i class="pi pi-sign-out"></i>
          </button>
        </div>
      </aside>

      <div class="main-area">
        <header class="topbar">
          <button
            class="hamb"
            type="button"
            (click)="toggle()"
            aria-label="Mostrar menú"
          >
            <i class="pi pi-bars"></i>
          </button>
          <div class="topbar-title">{{ currentTitle() }}</div>
          <div class="topbar-right">
            @if (auth.role() !== 'SUPERADMIN') {
              <div class="bell-wrap">
                <button
                  class="bell-btn"
                  type="button"
                  (click)="toggleAlerts()"
                  [class.has-alerts]="alertCount() > 0"
                  aria-label="Notificaciones"
                >
                  <i class="pi pi-bell"></i>
                  @if (alertCount() > 0) {
                    <span class="bell-badge">{{ alertCount() > 9 ? '9+' : alertCount() }}</span>
                  }
                </button>

                @if (alertsOpen()) {
                  <div class="alerts-backdrop" (click)="alertsOpen.set(false)"></div>
                  <div class="alerts-panel">
                    <div class="alerts-header">
                      <strong>Notificaciones</strong>
                      <div class="alerts-header-actions">
                        @if (alertCount() > 0) {
                          <span class="alerts-count">{{ alertCount() }}</span>
                        }
                      </div>
                    </div>

                    @if (notifs().length === 0 && alerts().length === 0) {
                      <div class="alerts-empty">
                        <i class="pi pi-check-circle"></i>
                        <span>Todo al día — sin notificaciones</span>
                      </div>
                    } @else {
                      <ul class="alerts-list">
                        <!-- Notificaciones de equipo (persistidas en BD) -->
                        @for (n of notifs(); track n.id) {
                          <li class="alert-item notif" [class.notif--unread]="freshIds().has(n.id)">
                            <div class="alert-icon">
                              <i [class]="n.type === 'COMMENT_ADDED' ? 'pi pi-comment' : n.type === 'FOLLOWUP_ADDED' ? 'pi pi-phone' : 'pi pi-user-plus'"></i>
                            </div>
                            <div class="alert-body">
                              <div class="alert-title">
                                {{ n.title }}
                                @if (freshIds().has(n.id)) {
                                  <span class="notif-new-dot"></span>
                                }
                              </div>
                              <div class="alert-desc">{{ n.body }}</div>
                              @if (n.leadId) {
                                <a
                                  [routerLink]="notifLeadPath(n)"
                                  class="alert-link"
                                  (click)="dismissNotif(n); alertsOpen.set(false)"
                                >Ver lead →</a>
                              }
                            </div>
                            <button class="dismiss-btn" (click)="dismissNotif(n)" title="Quitar">
                              <i class="pi pi-times"></i>
                            </button>
                          </li>
                        }
                        <!-- Alertas computadas (leads sin seguimiento, tareas vencidas) -->
                        @for (a of alerts(); track $index) {
                          <li class="alert-item" [class.stale]="a.type === 'STALE_LEAD'" [class.overdue]="a.type === 'OVERDUE_TASK'">
                            <div class="alert-icon">
                              <i [class]="a.type === 'STALE_LEAD' ? 'pi pi-clock' : 'pi pi-calendar-times'"></i>
                            </div>
                            <div class="alert-body">
                              <div class="alert-title">{{ a.title }}</div>
                              <div class="alert-desc">{{ a.description }}</div>
                              @if (a.leadId) {
                                <a
                                  [routerLink]="alertLeadPath(a)"
                                  class="alert-link"
                                  (click)="dismissAlert(a); alertsOpen.set(false)"
                                >Ver cliente →</a>
                              }
                            </div>
                            <button class="dismiss-btn" (click)="dismissAlert(a)" title="Descartar">
                              <i class="pi pi-times"></i>
                            </button>
                          </li>
                        }
                      </ul>
                    }
                  </div>
                }
              </div>
            }
            <span class="company-chip" title="Empresa">
              <i class="pi pi-building"></i>
              {{ auth.companyName() ?? (auth.companyId() ? 'Empresa' : 'Plataforma') }}
            </span>
          </div>
        </header>

        <main class="content"><router-outlet /></main>
      </div>

      <!-- Backdrop mobile cuando el sidebar está abierto -->
      @if (!collapsed()) {
        <div class="mobile-backdrop" (click)="toggle()"></div>
      }

      <!-- Bottom navigation (solo mobile) -->
      <nav class="bottom-nav" aria-label="Navegación principal">
        @for (item of mobileNavItems(); track item.path) {
          <a [routerLink]="item.path" routerLinkActive="active" class="bottom-nav-item">
            <i [class]="item.icon"></i>
            <span>{{ item.label }}</span>
          </a>
        }
        @if (hasMobileMore()) {
          <button class="bottom-nav-item" type="button" (click)="toggle()" [class.active]="!collapsed()">
            <i class="pi pi-grid"></i>
            <span>Más</span>
          </button>
        }
        @if (auth.role() !== 'SUPERADMIN') {
          <button class="bottom-nav-item" type="button" (click)="toggleAlerts()" [class.has-alerts]="alertCount() > 0">
            <span class="bottom-bell-wrap">
              <i class="pi pi-bell"></i>
              @if (alertCount() > 0) {
                <span class="bottom-bell-badge">{{ alertCount() > 9 ? '9+' : alertCount() }}</span>
              }
            </span>
            <span>Alertas</span>
          </button>
        }
      </nav>
    </div>

    <p-dialog
      header="Cambiar contraseña"
      [(visible)]="pwDialog"
      [modal]="true"
      [style]="{ width: '380px' }"
    >
      <div class="sf-stack">
        @if (pwError()) {
          <p-message severity="error" [text]="pwError()!" />
        }
        <div class="sf-field">
          <label>Contraseña actual</label>
          <input pInputText type="password" [(ngModel)]="pwCurrent" autocomplete="current-password" />
        </div>
        <div class="sf-field">
          <label>Nueva contraseña</label>
          <input pInputText type="password" [(ngModel)]="pwNew" autocomplete="new-password" />
        </div>
        <div class="sf-field">
          <label>Confirmar nueva contraseña</label>
          <input pInputText type="password" [(ngModel)]="pwConfirm" autocomplete="new-password" />
        </div>
      </div>
      <div class="pw-actions">
        <p-button label="Cancelar" severity="secondary" (onClick)="pwDialog = false" />
        <p-button label="Guardar" [loading]="pwSaving()" (onClick)="savePassword()" />
      </div>
    </p-dialog>
  `,
  styles: [
    `
      :host {
        display: block;
      }
      .pw-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 1.25rem;
      }
      .shell {
        display: grid;
        grid-template-columns: 248px 1fr;
        min-height: 100vh;
        background: var(--sf-bg);
      }
      .sidebar {
        position: sticky;
        top: 0;
        height: 100vh;
        background: var(--sf-sidebar-bg);
        color: var(--sf-sidebar-fg);
        display: flex;
        flex-direction: column;
        padding: 1.25rem 0.85rem 1rem;
        background-image: radial-gradient(
            1000px 400px at -20% -10%,
            rgba(37, 99, 235, 0.18),
            transparent 60%
          ),
          radial-gradient(
            600px 300px at 120% 100%,
            rgba(16, 185, 129, 0.1),
            transparent 60%
          );
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.25rem 0.5rem 1.25rem;
      }
      .brand-mark {
        width: 32px;
        height: 32px;
        border-radius: 9px;
        background: linear-gradient(135deg, var(--sf-primary), #4f46e5);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.85rem;
        letter-spacing: -0.02em;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
      }
      .brand-name {
        color: #fff;
        font-weight: 700;
        font-size: 1.05rem;
        letter-spacing: -0.01em;
      }
      .nav {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        padding-right: 0.25rem;
      }
      .nav::-webkit-scrollbar { width: 6px; }
      .nav::-webkit-scrollbar-thumb { background: #334155; border-radius: 999px; }
      .nav-group-title {
        color: #64748b;
        font-size: 0.65rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        padding: 0.85rem 0.6rem 0.35rem;
      }
      .nav-link {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.55rem 0.75rem;
        margin: 0 0.1rem;
        border-radius: 10px;
        color: var(--sf-sidebar-fg);
        text-decoration: none;
        font-size: 0.9rem;
        font-weight: 500;
        transition: background 0.15s var(--sf-ease), color 0.15s var(--sf-ease);
      }
      .nav-link i { width: 18px; font-size: 0.95rem; opacity: 0.85; }
      .nav-link:hover {
        background: rgba(148, 163, 184, 0.1);
        color: #fff;
      }
      .nav-link.active {
        background: rgba(37, 99, 235, 0.18);
        color: #fff;
      }
      .nav-link.active::before {
        content: '';
        position: absolute;
        left: -0.85rem;
        top: 25%;
        bottom: 25%;
        width: 3px;
        background: var(--sf-primary);
        border-radius: 0 4px 4px 0;
      }
      .nav-link.active i { opacity: 1; color: #93c5fd; }

      .user-chip {
        margin-top: 1rem;
        padding: 0.75rem 0.85rem;
        display: flex;
        align-items: center;
        gap: 0.65rem;
        background: rgba(148, 163, 184, 0.08);
        border: 1px solid rgba(148, 163, 184, 0.18);
        border-radius: var(--sf-radius-sm);
      }
      .avatar {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: linear-gradient(135deg, #2563eb, #7c3aed);
        color: #fff;
        font-weight: 700;
        font-size: 0.78rem;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 34px;
      }
      .user-meta { flex: 1; min-width: 0; }
      .user-name {
        color: #fff;
        font-size: 0.85rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .user-role {
        color: #94a3b8;
        font-size: 0.72rem;
      }
      .logout {
        background: transparent;
        border: 1px solid transparent;
        color: #cbd5e1;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s var(--sf-ease);
      }
      .logout:hover {
        background: rgba(239, 68, 68, 0.15);
        color: #fca5a5;
        border-color: rgba(239, 68, 68, 0.25);
      }

      .main-area {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .topbar {
        position: sticky;
        top: 0;
        z-index: 5;
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.85rem 1.5rem;
        background: rgba(248, 250, 252, 0.85);
        backdrop-filter: saturate(140%) blur(10px);
        border-bottom: 1px solid var(--sf-border);
      }
      .hamb {
        display: none;
        background: transparent;
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        width: 38px;
        height: 38px;
        cursor: pointer;
        color: var(--sf-text);
      }
      .topbar-title {
        font-weight: 700;
        font-size: 1rem;
        color: var(--sf-text);
        letter-spacing: -0.01em;
      }
      .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 0.75rem; }

      /* ── Bell / Notificaciones ── */
      .bell-wrap { position: relative; }
      .bell-btn {
        position: relative;
        background: transparent;
        border: 1px solid var(--sf-border);
        border-radius: 10px;
        width: 38px;
        height: 38px;
        cursor: pointer;
        color: var(--sf-text-muted);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        transition: background 0.15s, color 0.15s;
      }
      .bell-btn:hover { background: var(--sf-surface-2); color: var(--sf-text); }
      .bell-btn.has-alerts { color: #dc2626; border-color: rgba(220,38,38,.3); }
      .bell-badge {
        position: absolute;
        top: -5px; right: -5px;
        background: #dc2626;
        color: #fff;
        font-size: 0.6rem;
        font-weight: 700;
        min-width: 16px;
        height: 16px;
        padding: 0 3px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 2px solid #fff;
      }

      .alerts-backdrop {
        position: fixed;
        inset: 0;
        z-index: 49;
      }
      .alerts-panel {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        width: 340px;
        max-height: 480px;
        overflow-y: auto;
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 14px;
        box-shadow: 0 8px 32px rgba(0,0,0,.12);
        z-index: 50;
      }
      .alerts-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.9rem 1rem 0.65rem;
        border-bottom: 1px solid var(--sf-border);
        font-size: 0.9rem;
      }
      .alerts-count {
        background: #dc2626;
        color: #fff;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.1rem 0.45rem;
        border-radius: 999px;
      }
      .alerts-empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 2rem 1rem;
        color: var(--sf-text-muted);
        font-size: 0.85rem;
      }
      .alerts-empty i { font-size: 1.8rem; color: #10b981; }

      .alerts-list { list-style: none; margin: 0; padding: 0.4rem 0; }
      .alert-item {
        display: flex;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--sf-border);
        transition: background 0.12s;
      }
      .alert-item:last-child { border-bottom: none; }
      .alert-item:hover { background: var(--sf-surface-2); }
      .alert-icon {
        flex-shrink: 0;
        width: 32px;
        height: 32px;
        border-radius: 9px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 0.9rem;
      }
      .alert-item.stale   .alert-icon { background: #fff7ed; color: #ea580c; }
      .alert-item.overdue .alert-icon { background: #fef2f2; color: #dc2626; }
      .alert-item.notif   .alert-icon { background: #eff6ff; color: #2563eb; }
      .alert-item.notif--unread {
        background: #eff6ff;
        border-left: 3px solid #2563eb;
      }
      .alert-item.notif--unread .alert-title { color: #1e40af; }
      .alert-item.notif--unread:hover { background: #dbeafe; }
      .notif-new-dot {
        display: inline-block;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #2563eb;
        margin-left: 5px;
        vertical-align: middle;
        flex-shrink: 0;
      }
      .alert-body { flex: 1; min-width: 0; }
      .alert-title { font-weight: 600; font-size: 0.82rem; }
      .alert-desc  { color: var(--sf-text-muted); font-size: 0.78rem; margin-top: 0.15rem; line-height: 1.4; }
      .alert-link  {
        display: inline-block;
        margin-top: 0.3rem;
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--sf-primary);
        text-decoration: none;
      }
      .alert-link:hover { text-decoration: underline; }
      .dismiss-btn {
        all: unset;
        cursor: pointer;
        flex-shrink: 0;
        width: 22px;
        height: 22px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 6px;
        color: var(--sf-text-muted);
        font-size: 0.7rem;
        margin-top: 0.1rem;
        transition: background 0.12s, color 0.12s;
      }
      .dismiss-btn:hover { background: var(--sf-surface); color: var(--sf-danger); }
      .alerts-header-actions { display: flex; align-items: center; gap: 0.5rem; }
      .mark-read-btn {
        all: unset;
        cursor: pointer;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--sf-primary);
      }
      .mark-read-btn:hover { text-decoration: underline; }

      .company-chip {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        background: var(--sf-surface);
        border: 1px solid var(--sf-border);
        color: var(--sf-text-muted);
        padding: 0.4rem 0.75rem;
        border-radius: 999px;
        font-size: 0.78rem;
        font-weight: 500;
      }

      .content {
        flex: 1;
      }

      /* ── Bottom nav (siempre oculto en desktop) ── */
      .bottom-nav { display: none; }

      /* Responsive: collapse sidebar to off-canvas */
      @media (max-width: 920px) {
        .shell { grid-template-columns: 1fr; }
        .hamb { display: inline-flex; }
        .sidebar {
          position: fixed;
          left: 0;
          top: 0;
          height: 100vh;
          width: 260px;
          z-index: 50;
          transform: translateX(-105%);
          transition: transform 0.25s var(--sf-ease);
          box-shadow: var(--sf-shadow-lg);
        }
        .shell:not(.collapsed) .sidebar { transform: translateX(0); }
      }

      /* ── Mobile: bottom navigation app-style ── */
      @media (max-width: 768px) {
        /* Ocultar hamburguesa — la nav está abajo */
        .hamb { display: none; }

        /* El contenido no queda tapado por el bottom nav */
        .content {
          padding-bottom: calc(64px + env(safe-area-inset-bottom, 0px));
        }

        /* Backdrop oscuro cuando el sidebar-drawer está abierto */
        .mobile-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          z-index: 40;
          backdrop-filter: blur(2px);
        }

        /* Bottom nav bar */
        .bottom-nav {
          display: flex;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: calc(60px + env(safe-area-inset-bottom, 0px));
          padding-bottom: env(safe-area-inset-bottom, 0px);
          background: rgba(15, 23, 42, 0.96);
          backdrop-filter: saturate(160%) blur(12px);
          border-top: 1px solid rgba(148, 163, 184, 0.12);
          z-index: 30;
          align-items: stretch;
        }

        .bottom-nav-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 6px 4px 4px;
          color: #64748b;
          text-decoration: none;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: inherit;
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          transition: color 0.15s var(--sf-ease);
          -webkit-tap-highlight-color: transparent;
          min-width: 0;
        }

        .bottom-nav-item i {
          font-size: 1.25rem;
          line-height: 1;
          transition: transform 0.15s var(--sf-ease);
        }

        .bottom-nav-item span {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .bottom-nav-item:active i {
          transform: scale(0.88);
        }

        .bottom-nav-item.active {
          color: #60a5fa;
        }

        .bottom-nav-item.active i {
          color: #3b82f6;
          filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.5));
        }

        .bottom-nav-item.has-alerts {
          color: #f87171;
        }

        /* Badge en el botón de alertas del bottom nav */
        .bottom-bell-wrap {
          position: relative;
          display: inline-flex;
        }

        .bottom-bell-badge {
          position: absolute;
          top: -5px;
          right: -7px;
          background: #dc2626;
          color: #fff;
          font-size: 0.55rem;
          font-weight: 700;
          min-width: 15px;
          height: 15px;
          padding: 0 2px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid rgba(15, 23, 42, 0.96);
        }

        /* Panel de alertas: en mobile ocupa todo el ancho */
        .alerts-panel {
          position: fixed;
          bottom: calc(64px + env(safe-area-inset-bottom, 0px));
          left: 8px;
          right: 8px;
          width: auto;
          max-height: 60vh;
          border-radius: 16px 16px 12px 12px;
        }

        /* Topbar en mobile: más compacto */
        .topbar {
          padding: 0.6rem 1rem;
        }

        /* Ocultar bell del topbar en mobile (está en bottom nav) */
        .bell-wrap { display: none; }

        /* Company chip más compacto */
        .company-chip {
          font-size: 0.72rem;
          padding: 0.3rem 0.6rem;
        }
      }
    `,
  ],
})
export class DashboardLayoutComponent implements OnInit {
  readonly auth          = inject(AuthService);
  private readonly router        = inject(Router);
  private readonly alertsService = inject(AlertsService);
  private readonly notifService  = inject(NotificationsService);
  private readonly usersService  = inject(UsersService);

  collapsed        = signal(true);
  currentTitle     = signal('');
  alerts           = signal<AlertItem[]>([]);
  notifs           = signal<AppNotification[]>([]);
  alertsOpen       = signal(false);
  freshIds         = signal<Set<string>>(new Set());
  alertsSeenCount  = signal(0); // cuántas alertas computadas ya se vieron esta sesión

  unreadCount = computed(() => this.notifs().filter((n) => !n.isRead).length);
  // Badge: alertas computadas no vistas + notificaciones BD no leídas
  alertCount = computed(() =>
    Math.max(0, this.alerts().length - this.alertsSeenCount()) + this.unreadCount(),
  );

  // Cambiar contraseña
  pwDialog  = false;
  pwCurrent = '';
  pwNew     = '';
  pwConfirm = '';
  pwSaving  = signal(false);
  pwError   = signal<string | null>(null);

  constructor() {
    // Mantén un título dinámico en la topbar según la ruta activa.
    this.updateTitle(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.updateTitle(e.urlAfterRedirects));
  }

  mobileNavItems = computed(() => {
    const role = this.auth.role();
    return role ? MOBILE_NAV[role] : [];
  });

  hasMobileMore = computed(() => {
    const role = this.auth.role();
    if (!role) return false;
    return NAV[role].length > MOBILE_NAV[role].length;
  });

  groupedNav = computed(() => {
    const role = this.auth.role();
    const items = role ? NAV[role] : [];
    const groupsMap = new Map<string, NavItem[]>();
    items.forEach((it) => {
      const key = it.group ?? '__plain__';
      if (!groupsMap.has(key)) groupsMap.set(key, []);
      groupsMap.get(key)!.push(it);
    });
    return Array.from(groupsMap.entries()).map(([key, list]) => ({
      title:
        key === '__plain__'
          ? ''
          : GROUP_TITLES[key as keyof typeof GROUP_TITLES] ?? '',
      items: list,
    }));
  });

  roleLabel = computed(() => {
    const r = this.auth.role();
    return r ? ROLE_LABELS[r] : '';
  });

  initials = computed(() => {
    const name = this.auth.user()?.name ?? '';
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  });

  ngOnInit(): void {
    const role = this.auth.role();
    if (role && role !== Role.SUPERADMIN) {
      this.loadAlerts();
    }
  }

  loadAlerts(): void {
    // Carga inicial (ngOnInit): solo actualiza datos, no marca como vistos
    this.alertsService.getAll().subscribe({ next: (a) => this.alerts.set(a), error: () => {} });
    this.notifService.getAll().subscribe({ next: (n) => this.notifs.set(n), error: () => {} });
  }

  toggleAlerts(): void {
    const wasOpen = this.alertsOpen();
    this.alertsOpen.update((v) => !v);
    if (!wasOpen) {
      // Alertas computadas (leads sin seguimiento, tareas vencidas)
      this.alertsSeenCount.set(0); // reset antes de cargar
      this.alertsService.getAll().subscribe({
        next: (a) => {
          this.alerts.set(a);
          // Marca todas como "vistas" → badge baja a 0 para estas alertas
          this.alertsSeenCount.set(a.length);
        },
        error: () => {},
      });
      // Notificaciones persistidas en BD
      this.notifService.getAll().subscribe({
        next: (notifs) => {
          // Snapshot de las no leídas para mostrar el punto azul
          this.freshIds.set(new Set(notifs.filter((n) => !n.isRead).map((n) => n.id)));
          this.notifs.set(notifs);
          // Auto-marca todas como leídas → badge de notifs baja a 0
          if (notifs.some((n) => !n.isRead)) {
            this.notifService.markAllRead().subscribe();
            this.notifs.update((list) => list.map((n) => ({ ...n, isRead: true })));
          }
        },
        error: () => {},
      });
    }
  }

  dismissAlert(a: AlertItem): void {
    this.alerts.update((list) => list.filter((x) => x !== a));
    // Ajusta el contador para que no quede desincronizado
    this.alertsSeenCount.update((n) => Math.max(0, n - 1));
  }

  dismissNotif(n: AppNotification): void {
    this.notifs.update((list) => list.filter((x) => x.id !== n.id));
    this.freshIds.update((s) => { const copy = new Set(s); copy.delete(n.id); return copy; });
  }

  alertLeadPath(a: AlertItem): string {
    const role = this.auth.role()?.toLowerCase() ?? 'vendedor';
    return `/${role}/leads/${a.leadId}`;
  }

  notifLeadPath(n: AppNotification): string {
    const role = this.auth.role()?.toLowerCase() ?? 'vendedor';
    return `/${role}/leads/${n.leadId}`;
  }

  toggle(): void {
    this.collapsed.update((v) => !v);
  }

  openPwDialog(): void {
    this.pwCurrent = '';
    this.pwNew     = '';
    this.pwConfirm = '';
    this.pwError.set(null);
    this.pwDialog = true;
  }

  savePassword(): void {
    if (!this.pwCurrent) { this.pwError.set('Ingresa tu contraseña actual'); return; }
    if (this.pwNew.length < 6) { this.pwError.set('La nueva contraseña debe tener al menos 6 caracteres'); return; }
    if (this.pwNew !== this.pwConfirm) { this.pwError.set('Las contraseñas no coinciden'); return; }
    this.pwSaving.set(true);
    this.pwError.set(null);
    this.usersService.changeMyPassword(this.pwCurrent, this.pwNew).subscribe({
      next: () => {
        this.pwSaving.set(false);
        this.pwDialog = false;
      },
      error: (e: { userMessage?: string }) => {
        this.pwSaving.set(false);
        this.pwError.set(e.userMessage ?? 'No se pudo cambiar la contraseña');
      },
    });
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigateByUrl('/auth/login'),
      error: () => this.router.navigateByUrl('/auth/login'),
    });
  }

  private updateTitle(url: string): void {
    // Toma la última porción del path o un título estático conocido.
    const role = this.auth.role();
    const items = role ? NAV[role] : [];
    const match = items.find((it) => url.startsWith(it.path));
    this.currentTitle.set(match?.label ?? 'SalesFlow');
    this.collapsed.set(true); // cierra el sidebar al navegar (mobile)
  }
}
