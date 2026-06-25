import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@core/auth/auth.service';
import { ROLE_HOME } from '@core/constants/roles';
import { ApiError } from '@core/models/api-error.model';
import { UsersService } from '@core/services/users.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [FormsModule, ButtonModule, InputTextModule, MessageModule],
  template: `
    <div class="cp-shell">
      <div class="cp-card">
        <div class="cp-brand">
          <span class="brand-mark">SF</span>
          <span class="brand-name">SalesFlow</span>
        </div>

        <div class="cp-icon">
          <i class="pi pi-lock"></i>
        </div>

        <h1 class="cp-title">Crea tu contraseña</h1>
        <p class="cp-sub">
          Tu cuenta fue creada con una contraseña temporal. Define una nueva
          contraseña segura para continuar.
        </p>

        @if (error()) {
          <p-message severity="error" [text]="error()!" styleClass="w-full" />
        }

        <div class="sf-field">
          <label for="newPw">Nueva contraseña <span class="req">*</span></label>
          <input
            id="newPw"
            pInputText
            type="password"
            [(ngModel)]="newPassword"
            placeholder="Mínimo 6 caracteres"
            autocomplete="new-password"
          />
        </div>

        <div class="sf-field">
          <label for="confirmPw">Confirmar contraseña <span class="req">*</span></label>
          <input
            id="confirmPw"
            pInputText
            type="password"
            [(ngModel)]="confirmPassword"
            placeholder="Repite la contraseña"
            autocomplete="new-password"
          />
          @if (newPassword && confirmPassword && newPassword !== confirmPassword) {
            <small class="sf-field-error">Las contraseñas no coinciden.</small>
          }
        </div>

        <p-button
          label="Guardar y continuar"
          [loading]="saving()"
          [disabled]="!canSubmit()"
          styleClass="w-full"
          (onClick)="submit()"
        />
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .cp-shell {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background:
        radial-gradient(800px 500px at 80% 0%, rgba(37,99,235,.18), transparent 60%),
        radial-gradient(700px 400px at 0% 100%, rgba(16,185,129,.12), transparent 60%),
        var(--sf-bg);
    }

    .cp-card {
      width: 100%;
      max-width: 420px;
      background: var(--sf-surface);
      border: 1px solid var(--sf-border);
      border-radius: var(--sf-radius);
      box-shadow: var(--sf-shadow);
      padding: 2.25rem 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .cp-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.25rem;
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
      font-size: 0.78rem;
      letter-spacing: -0.02em;
    }

    .brand-name { font-weight: 700; font-size: 1rem; color: var(--sf-text); }

    .cp-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: color-mix(in srgb, var(--sf-primary) 10%, transparent);
      color: var(--sf-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      margin: 0.25rem 0;
    }

    .cp-title { margin: 0; font-size: 1.4rem; }
    .cp-sub { margin: 0; color: var(--sf-text-muted); font-size: 0.9rem; line-height: 1.55; }

    .req { color: #dc2626; }
    .sf-field-error { color: #dc2626; font-size: 0.78rem; margin-top: 0.25rem; display: block; }
    .w-full { width: 100%; }
  `],
})
export class ChangePasswordComponent {
  private readonly users  = inject(UsersService);
  private readonly auth   = inject(AuthService);
  private readonly router = inject(Router);

  newPassword     = '';
  confirmPassword = '';
  saving          = signal(false);
  error           = signal<string | null>(null);

  canSubmit(): boolean {
    return (
      this.newPassword.length >= 6 &&
      this.newPassword === this.confirmPassword
    );
  }

  submit(): void {
    if (!this.canSubmit()) return;
    this.saving.set(true);
    this.error.set(null);

    this.users.forceChangePassword(this.newPassword).subscribe({
      next: () => {
        // Recarga el perfil para que mustChangePassword quede en false
        this.auth.me().subscribe({
          next: (user) => {
            this.saving.set(false);
            this.router.navigateByUrl(ROLE_HOME[user.role]);
          },
          error: () => {
            this.saving.set(false);
            this.router.navigateByUrl('/auth/login');
          },
        });
      },
      error: (e: ApiError) => {
        this.saving.set(false);
        this.error.set(e.userMessage ?? 'No se pudo cambiar la contraseña');
      },
    });
  }
}
