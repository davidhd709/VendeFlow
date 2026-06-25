import { TestBed } from '@angular/core/testing';
import { StatusBreakdownComponent, StatusBreakdownItem } from './status-breakdown.component';

describe('StatusBreakdownComponent', () => {
  const setup = async (items: StatusBreakdownItem[] = []) => {
    await TestBed.configureTestingModule({
      imports: [StatusBreakdownComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(StatusBreakdownComponent);
    fixture.componentInstance.items = items;
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza cada estado con su label y conteo', async () => {
    const fixture = await setup([
      { label: 'Nuevo', count: 5 },
      { label: 'Vendido', count: 3 },
    ]);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Nuevo');
    expect(text).toContain('5');
    expect(text).toContain('Vendido');
    expect(text).toContain('3');
  });

  it('renderiza N artículos según el arreglo de items', async () => {
    const fixture = await setup([
      { label: 'A', count: 1 },
      { label: 'B', count: 2 },
      { label: 'C', count: 3 },
    ]);
    expect(fixture.nativeElement.querySelectorAll('article.status')).toHaveLength(3);
  });

  it('no falla con arreglo vacío', async () => {
    const fixture = await setup([]);
    expect(fixture.nativeElement.querySelectorAll('article.status')).toHaveLength(0);
  });
});
