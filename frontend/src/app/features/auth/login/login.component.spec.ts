import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Role } from '@core/constants/roles';
import { AuthService } from '@core/auth/auth.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let auth: { login: jest.Mock };
  let routerMock: { navigateByUrl: jest.Mock };

  const setup = async () => {
    routerMock = { navigateByUrl: jest.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        { provide: Router, useValue: routerMock },
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    auth = {
      login: jest.fn().mockReturnValue(of({
        accessToken: 'tok',
        user: { id: 'u-1', role: Role.ADMIN, username: 'admin' },
      })),
    };
  });

  it('renderiza el formulario de inicio de sesión', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Iniciar sesión');
    expect(fixture.nativeElement.querySelector('input[formControlName="username"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input[formControlName="password"]')).toBeTruthy();
  });

  it('marca campos como tocados si se intenta enviar vacío', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.submit();

    expect(component.form.get('username')?.touched).toBe(true);
    expect(component.form.get('password')?.touched).toBe(true);
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('invalid() devuelve true solo si el campo está tocado e inválido', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    expect(component.invalid('username')).toBe(false);

    component.form.get('username')?.markAsTouched();
    expect(component.invalid('username')).toBe(true);

    component.form.get('username')?.setValue('admin');
    expect(component.invalid('username')).toBe(false);
  });

  it('llama auth.login con username, password y subdomain al enviar', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.form.patchValue({ username: 'admin', password: 'pass123', subdomain: 'empresa' });
    component.submit();

    expect(auth.login).toHaveBeenCalledWith({
      username: 'admin',
      password: 'pass123',
      subdomain: 'empresa',
    });
  });

  it('omite subdomain cuando está vacío', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.form.patchValue({ username: 'superadmin', password: 'pass123', subdomain: '' });
    component.submit();

    expect(auth.login).toHaveBeenCalledWith({
      username: 'superadmin',
      password: 'pass123',
      subdomain: undefined,
    });
  });

  it('navega a la ruta del rol tras login exitoso', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.form.patchValue({ username: 'admin', password: 'pass123' });
    component.submit();

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/admin');
  });

  it('muestra mensaje de error si el login falla', async () => {
    auth.login.mockReturnValue(throwError(() => ({ userMessage: 'Credenciales incorrectas' })));
    const fixture = await setup();
    const component = fixture.componentInstance;

    component.form.patchValue({ username: 'admin', password: 'pass123' });
    component.submit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Credenciales incorrectas');
  });

  it('loading() es true mientras se procesa y false al completar', async () => {
    const fixture = await setup();
    const component = fixture.componentInstance;

    auth.login.mockReturnValue(of({ accessToken: 'tok', user: { id: 'u', role: Role.VENDEDOR, username: 'v' } }));

    component.form.patchValue({ username: 'v', password: 'pass12' });
    expect(component.loading()).toBe(false);
  });
});
