import { TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  const setup = async (inputs: Partial<InstanceType<typeof StatCardComponent>> = {}) => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(StatCardComponent);
    Object.assign(fixture.componentInstance, { label: 'Total', value: '0', ...inputs });
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza label y value', async () => {
    const fixture = await setup({ label: 'Ventas del mes', value: 47 });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Ventas del mes');
    expect(text).toContain('47');
  });

  it('renderiza hint cuando está presente', async () => {
    const fixture = await setup({ hint: '+12% vs mes anterior' });
    expect(fixture.nativeElement.textContent).toContain('+12% vs mes anterior');
  });

  it('no renderiza hint cuando está vacío', async () => {
    const fixture = await setup({ hint: '' });
    expect(fixture.nativeElement.querySelector('.stat-hint')).toBeFalsy();
  });

  it('aplica data-tone al artículo', async () => {
    const fixture = await setup({ tone: 'danger' });
    expect(fixture.nativeElement.querySelector('.stat').getAttribute('data-tone')).toBe('danger');
  });
});
