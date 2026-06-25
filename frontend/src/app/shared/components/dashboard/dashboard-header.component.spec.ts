import { TestBed } from '@angular/core/testing';
import { DashboardHeaderComponent } from './dashboard-header.component';

describe('DashboardHeaderComponent', () => {
  const setup = async (inputs: Partial<InstanceType<typeof DashboardHeaderComponent>> = {}) => {
    await TestBed.configureTestingModule({
      imports: [DashboardHeaderComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(DashboardHeaderComponent);
    Object.assign(fixture.componentInstance, inputs);
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza eyebrow y título', async () => {
    const fixture = await setup({ eyebrow: 'Panel', title: 'Bienvenido, Carlos' });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Panel');
    expect(text).toContain('Bienvenido, Carlos');
  });

  it('renderiza subtitle cuando está presente', async () => {
    const fixture = await setup({ subtitle: 'Resumen del mes' });
    expect(fixture.nativeElement.textContent).toContain('Resumen del mes');
  });

  it('no renderiza subtitle cuando está vacío', async () => {
    const fixture = await setup({ subtitle: '' });
    expect(fixture.nativeElement.querySelector('.subtitle')).toBeFalsy();
  });

  it('renderiza periodLabel cuando está presente', async () => {
    const fixture = await setup({ periodLabel: 'Junio 2026' });
    expect(fixture.nativeElement.textContent).toContain('Junio 2026');
  });

  it('no renderiza period-pill cuando periodLabel está vacío', async () => {
    const fixture = await setup({ periodLabel: '' });
    expect(fixture.nativeElement.querySelector('.period-pill')).toBeFalsy();
  });

  it('renderiza los items del summary', async () => {
    const fixture = await setup({
      summary: [
        { label: 'Ventas', value: '12', tone: 'success' },
        { label: 'Leads', value: '34' },
      ],
    });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ventas');
    expect(text).toContain('12');
    expect(text).toContain('Leads');
  });
});
