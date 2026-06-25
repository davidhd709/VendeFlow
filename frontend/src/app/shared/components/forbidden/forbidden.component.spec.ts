import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ForbiddenComponent } from './forbidden.component';

describe('ForbiddenComponent', () => {
  const setup = async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(ForbiddenComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('muestra el código 403', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('403');
  });

  it('muestra el texto de acceso denegado', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('No tienes permiso');
  });

  it('contiene un enlace para volver al inicio', async () => {
    const fixture = await setup();
    const link = fixture.nativeElement.querySelector('a');
    expect(link).toBeTruthy();
    expect(link.textContent.trim()).toBe('Volver al inicio');
  });
});
