import { TestBed } from '@angular/core/testing';
import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
  const setup = async (inputs: Partial<InstanceType<typeof KpiCardComponent>> = {}) => {
    await TestBed.configureTestingModule({
      imports: [KpiCardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(KpiCardComponent);
    Object.assign(fixture.componentInstance, { label: 'Ventas', value: '42', ...inputs });
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza label y value', async () => {
    const fixture = await setup({ label: 'Leads activos', value: 18 });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Leads activos');
    expect(text).toContain('18');
  });

  it('renderiza context cuando está presente', async () => {
    const fixture = await setup({ context: 'vs mes anterior' });
    expect(fixture.nativeElement.textContent).toContain('vs mes anterior');
  });

  it('no renderiza context cuando está vacío', async () => {
    const fixture = await setup({ context: '' });
    expect(fixture.nativeElement.querySelector('.context')).toBeFalsy();
  });

  it('aplica data-tone al artículo', async () => {
    const fixture = await setup({ tone: 'success' });
    expect(fixture.nativeElement.querySelector('.kpi').getAttribute('data-tone')).toBe('success');
  });
});
