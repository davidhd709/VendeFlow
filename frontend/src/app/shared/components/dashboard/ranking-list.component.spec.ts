import { TestBed } from '@angular/core/testing';
import { RankingListComponent, RankingItem } from './ranking-list.component';

describe('RankingListComponent', () => {
  const setup = async (items: RankingItem[] = []) => {
    await TestBed.configureTestingModule({
      imports: [RankingListComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(RankingListComponent);
    fixture.componentInstance.items = items;
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza cada item con posición, label y value', async () => {
    const fixture = await setup([
      { label: 'Carlos', value: '12 ventas' },
      { label: 'Ana', value: '9 ventas' },
    ]);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Carlos');
    expect(text).toContain('12 ventas');
    expect(text).toContain('Ana');
    expect(text).toContain('9 ventas');
  });

  it('muestra números de posición correctos (1, 2, 3…)', async () => {
    const fixture = await setup([
      { label: 'A', value: '10' },
      { label: 'B', value: '8' },
      { label: 'C', value: '5' },
    ]);
    const positions = Array.from(fixture.nativeElement.querySelectorAll('.pos')).map(
      (el) => (el as HTMLElement).textContent?.trim(),
    );
    expect(positions).toEqual(['1', '2', '3']);
  });

  it('renderiza detail cuando está presente', async () => {
    const fixture = await setup([{ label: 'Carlos', value: '12', detail: 'Bogotá' }]);
    expect(fixture.nativeElement.textContent).toContain('Bogotá');
  });

  it('no renderiza detail cuando está ausente', async () => {
    const fixture = await setup([{ label: 'Carlos', value: '12' }]);
    expect(fixture.nativeElement.querySelector('small')).toBeFalsy();
  });

  it('renderiza una lista vacía sin errores', async () => {
    const fixture = await setup([]);
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(0);
  });
});
