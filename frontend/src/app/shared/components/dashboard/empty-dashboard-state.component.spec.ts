import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EmptyDashboardStateComponent } from './empty-dashboard-state.component';

describe('EmptyDashboardStateComponent', () => {
  const setup = async (inputs: Partial<InstanceType<typeof EmptyDashboardStateComponent>> = {}) => {
    await TestBed.configureTestingModule({
      imports: [EmptyDashboardStateComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmptyDashboardStateComponent);
    Object.assign(fixture.componentInstance, inputs);
    fixture.detectChanges();
    return fixture;
  };

  it('muestra el enlace de acción cuando ambos campos están presentes', async () => {
    const fixture = await setup({ actionLabel: 'Crear lead', actionLink: '/leads/nuevo' });
    const link = fixture.nativeElement.querySelector('a.action');
    expect(link).toBeTruthy();
    expect(link.textContent.trim()).toBe('Crear lead');
  });

  it('no muestra el enlace cuando actionLabel está vacío', async () => {
    const fixture = await setup({ actionLabel: '', actionLink: '/leads/nuevo' });
    expect(fixture.nativeElement.querySelector('a.action')).toBeFalsy();
  });

  it('no muestra el enlace cuando actionLink está vacío', async () => {
    const fixture = await setup({ actionLabel: 'Crear lead', actionLink: '' });
    expect(fixture.nativeElement.querySelector('a.action')).toBeFalsy();
  });

  it('renderiza el componente sin errores con valores por defecto', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('app-empty-state')).toBeTruthy();
  });
});
