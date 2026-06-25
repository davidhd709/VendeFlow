import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { AuthService } from '@core/auth/auth.service';
import { ROLE_HOME } from '@core/constants/roles';
import { ApiError } from '@core/models/api-error.model';

function extractSubdomain(): string {
  const host = window.location.hostname;
  // IP → sin subdominio
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) return '';
  const parts = host.split('.');
  // "localhost" solo → sin subdominio
  if (parts.length === 1) return '';
  // "wincell.localhost" → subdominio "wincell" (dev local con subdominios)
  if (parts.length === 2 && parts[1] === 'localhost') return parts[0];
  // "wincell.salesflow.com" o "wincell.salesflow.co" → subdominio "wincell"
  return parts.length >= 3 ? parts[0] : '';
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule, MessageModule],
  template: `
    <div class="auth-shell">
      <aside class="auth-aside" aria-hidden="true">
        <div class="aside-inner">
          <div class="brand">
            <span class="brand-mark">SF</span>
            <span class="brand-name">SalesFlow</span>
          </div>
          <h2 class="aside-title">El CRM que mide lo que tu tienda vende.</h2>
          <ul class="aside-points">
            <li><i class="pi pi-check"></i> Captura leads desde tu web pública</li>
            <li><i class="pi pi-check"></i> Da seguimiento por WhatsApp</li>
            <li><i class="pi pi-check"></i> Mide conversión por vendedor</li>
          </ul>
          <div class="aside-footer">© SalesFlow · Multiempresa</div>
        </div>
      </aside>

      <main class="auth-main">
        <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
          <div class="form-brand">
            <span class="brand-mark">SF</span>
            <span class="brand-name">SalesFlow</span>
          </div>

          <h1 class="form-title">Iniciar sesión</h1>
          <p class="form-sub text-muted">
            Accede al panel de tu empresa. Si eres administrador de la
            plataforma, deja el subdominio vacío.
          </p>

          @if (error()) {
            <p-message
              severity="error"
              [text]="error()!"
              styleClass="w-full mb-2"
            />
          }

          @if (!detectedSubdomain) {
            <div class="sf-field">
              <label for="subdomain">Empresa <span class="text-muted">· subdominio</span></label>
              <input
                id="subdomain"
                pInputText
                formControlName="subdomain"
                placeholder="mi-empresa"
                autocomplete="organization"
              />
              <small class="sf-field-help">
                Vacío si entras como SUPERADMIN de la plataforma.
              </small>
            </div>
          } @else {
            <div class="sf-field subdomain-badge">
              <span class="badge-label">Empresa</span>
              <span class="badge-value">{{ detectedSubdomain }}</span>
            </div>
          }

          <div class="sf-field">
            <label for="username">Usuario</label>
            <input
              id="username"
              pInputText
              formControlName="username"
              autocomplete="username"
            />
            @if (invalid('username')) {
              <small class="sf-field-error">El usuario es obligatorio.</small>
            }
          </div>

          <div class="sf-field">
            <label for="password">Contraseña</label>
            <input
              id="password"
              pInputText
              type="password"
              formControlName="password"
              autocomplete="current-password"
            />
            @if (invalid('password')) {
              <small class="sf-field-error">Mínimo 6 caracteres.</small>
            }
          </div>

          <p-button
            type="submit"
            label="Entrar"
            [loading]="loading()"
            styleClass="w-full mt-2"
          />

          <div class="form-foot text-muted text-sm">
            ¿No tienes cuenta? Pídela a tu administrador.
          </div>
        </form>
      </main>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .auth-shell {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 1fr 1fr;
        background: var(--sf-bg);
      }
      .auth-aside {
        position: relative;
        background:
          radial-gradient(800px 500px at 80% 0%, rgba(37, 99, 235, 0.35), transparent 60%),
          radial-gradient(700px 400px at 0% 100%, rgba(16, 185, 129, 0.22), transparent 60%),
          linear-gradient(160deg, #0f172a 0%, #111c34 100%);
        color: #e2e8f0;
        overflow: hidden;
      }
      .auth-aside::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image:
          linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
        background-size: 40px 40px;
        mask: radial-gradient(600px 400px at 30% 30%, #000, transparent 70%);
      }
      .aside-inner {
        position: relative;
        z-index: 1;
        max-width: 460px;
        padding: 4rem 3rem;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        height: 100%;
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 0.6rem;
      }
      .brand-mark {
        width: 34px;
        height: 34px;
        border-radius: 10px;
        background: linear-gradient(135deg, var(--sf-primary), #4f46e5);
        color: #fff;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        letter-spacing: -0.02em;
        box-shadow: 0 4px 14px rgba(37, 99, 235, 0.5);
      }
      .brand-name {
        color: #fff;
        font-weight: 700;
        font-size: 1.05rem;
      }
      .aside-title {
        color: #fff;
        font-size: 2rem;
        line-height: 1.1;
        margin: auto 0 0.5rem;
        letter-spacing: -0.02em;
      }
      .aside-points {
        list-style: none;
        padding: 0;
        margin: 0 0 auto;
        display: grid;
        gap: 0.5rem;
        color: #cbd5e1;
        font-size: 0.95rem;
      }
      .aside-points li { display: flex; align-items: center; gap: 0.5rem; }
      .aside-points i { color: #34d399; }
      .aside-footer { color: #64748b; font-size: 0.8rem; }

      .auth-main {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem 1.25rem;
      }
      .auth-card {
        width: 100%;
        max-width: 420px;
        background: var(--sf-surface);
        border: 1px solid var(--sf-border);
        border-radius: var(--sf-radius);
        box-shadow: var(--sf-shadow);
        padding: 2rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .form-brand {
        display: none;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.5rem;
      }
      .form-title {
        margin: 0.25rem 0 0;
        font-size: 1.5rem;
      }
      .form-sub { margin: 0 0 0.5rem; font-size: 0.9rem; }
      .form-foot {
        text-align: center;
        margin-top: 0.75rem;
        font-size: 0.78rem;
      }
      .mb-2 { margin-bottom: 1rem; }
      .w-full { width: 100%; }
      .subdomain-badge {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 0.75rem;
        background: color-mix(in srgb, var(--sf-primary) 8%, transparent);
        border: 1px solid color-mix(in srgb, var(--sf-primary) 25%, transparent);
        border-radius: var(--sf-radius-sm, 6px);
      }
      .badge-label { font-size: 0.8rem; color: var(--sf-text-muted); }
      .badge-value { font-weight: 600; color: var(--sf-primary); font-size: 0.9rem; }

      @media (max-width: 880px) {
        .auth-shell { grid-template-columns: 1fr; }
        .auth-aside { display: none; }
        .form-brand { display: inline-flex; }
      }
    `,
  ],
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal(false);
  error = signal<string | null>(null);

  readonly detectedSubdomain = extractSubdomain();

  form = this.fb.nonNullable.group({
    subdomain: [this.detectedSubdomain],
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  invalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && c.touched;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    const { subdomain, username, password } = this.form.getRawValue();
    this.auth
      .login({ subdomain: subdomain || undefined, username, password })
      .subscribe({
        next: (res) => {
          const dest = res.user.mustChangePassword
            ? '/auth/change-password'
            : ROLE_HOME[res.user.role];
          this.router.navigateByUrl(dest);
        },
        error: (e: ApiError) => {
          this.error.set(e.userMessage ?? 'No se pudo iniciar sesión');
          this.loading.set(false);
        },
      });
  }
}
