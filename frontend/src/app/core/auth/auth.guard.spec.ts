import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  const run = (): boolean | unknown =>
    TestBed.runInInjectionContext(() =>
      authGuard(
        {} as ActivatedRouteSnapshot,
        {} as RouterStateSnapshot,
      ),
    );

  it('redirige a /auth/login cuando no hay sesión', () => {
    const navigate = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => false } },
        { provide: Router, useValue: { navigate } },
      ],
    });

    expect(run()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/auth/login']);
  });

  it('permite el acceso cuando hay sesión', () => {
    const navigate = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => true } },
        { provide: Router, useValue: { navigate } },
      ],
    });

    expect(run()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });
});
