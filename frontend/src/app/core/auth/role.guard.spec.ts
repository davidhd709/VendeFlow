import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { Role } from '../constants/roles';
import { roleGuard } from './role.guard';
import { AuthService } from './auth.service';

describe('roleGuard', () => {
  const run = (allowed: Role[]): boolean | unknown =>
    TestBed.runInInjectionContext(() =>
      roleGuard(allowed)(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );

  it('redirige a /403 cuando no hay rol autenticado', () => {
    const navigate = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { role: () => null } },
        { provide: Router, useValue: { navigate } },
      ],
    });

    expect(run([Role.ADMIN])).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/403']);
  });

  it('bloquea cuando el rol no está permitido', () => {
    const navigate = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { role: () => Role.VENDEDOR } },
        { provide: Router, useValue: { navigate } },
      ],
    });

    expect(run([Role.ADMIN, Role.COORDINADOR])).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/403']);
  });

  it('permite acceso cuando el rol está permitido', () => {
    const navigate = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { role: () => Role.ADMIN } },
        { provide: Router, useValue: { navigate } },
      ],
    });

    expect(run([Role.ADMIN])).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
