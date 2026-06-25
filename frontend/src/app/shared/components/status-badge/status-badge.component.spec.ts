import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { LeadStatus } from '@core/constants/lead-statuses';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  const setup = async (status: LeadStatus) => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    const fixture = TestBed.createComponent(StatusBadgeComponent);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture;
  };

  it('label() traduce NUEVO al español', async () => {
    const fixture = await setup(LeadStatus.NUEVO);
    expect(fixture.componentInstance.label()).toBe('Nuevo');
  });

  it('label() traduce VENDIDO al español', async () => {
    const fixture = await setup(LeadStatus.VENDIDO);
    expect(fixture.componentInstance.label()).toBe('Vendido');
  });

  it('label() traduce EN_SEGUIMIENTO al español', async () => {
    const fixture = await setup(LeadStatus.EN_SEGUIMIENTO);
    expect(fixture.componentInstance.label()).toBe('En seguimiento');
  });

  it('severity() devuelve success para VENDIDO', async () => {
    const fixture = await setup(LeadStatus.VENDIDO);
    expect(fixture.componentInstance.severity()).toBe('success');
  });

  it('severity() devuelve danger para PERDIDO', async () => {
    const fixture = await setup(LeadStatus.PERDIDO);
    expect(fixture.componentInstance.severity()).toBe('danger');
  });

  it('severity() devuelve secondary para SIN_RESPUESTA', async () => {
    const fixture = await setup(LeadStatus.SIN_RESPUESTA);
    expect(fixture.componentInstance.severity()).toBe('secondary');
  });

  it('severity() devuelve warn para INTERESADO', async () => {
    const fixture = await setup(LeadStatus.INTERESADO);
    expect(fixture.componentInstance.severity()).toBe('warn');
  });
});
