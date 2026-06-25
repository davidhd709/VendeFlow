import { TestBed } from '@angular/core/testing';
import { ProgressToGoalComponent } from './progress-to-goal.component';

describe('ProgressToGoalComponent', () => {
  const setup = async (percent: number | null = 0) => {
    await TestBed.configureTestingModule({
      imports: [ProgressToGoalComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProgressToGoalComponent);
    fixture.componentInstance.percent = percent;
    fixture.detectChanges();
    return fixture;
  };

  it('safePercent() clampea valores mayores a 100 en 100', async () => {
    const fixture = await setup(150);
    expect(fixture.componentInstance.safePercent()).toBe(100);
  });

  it('safePercent() clampea valores negativos en 0', async () => {
    const fixture = await setup(-10);
    expect(fixture.componentInstance.safePercent()).toBe(0);
  });

  it('safePercent() devuelve 0 cuando percent es null', async () => {
    const fixture = await setup(null);
    expect(fixture.componentInstance.safePercent()).toBe(0);
  });

  it('safePercent() devuelve 0 para valores no finitos (Infinity)', async () => {
    const fixture = await setup(Infinity);
    expect(fixture.componentInstance.safePercent()).toBe(0);
  });

  it('safePercent() redondea valores con decimales', async () => {
    const fixture = await setup(67.8);
    expect(fixture.componentInstance.safePercent()).toBe(68);
  });

  it('safePercent() devuelve el valor exacto cuando está en rango', async () => {
    const fixture = await setup(50);
    expect(fixture.componentInstance.safePercent()).toBe(50);
  });

  it('renderiza el porcentaje y el título', async () => {
    const fixture = await setup(75);
    fixture.componentInstance.title = 'Meta mensual';
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('75%');
    expect(text).toContain('Meta mensual');
  });
});
