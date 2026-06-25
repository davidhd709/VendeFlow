import { TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  const setup = async (inputs: Partial<InstanceType<typeof EmptyStateComponent>> = {}) => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmptyStateComponent);
    Object.assign(fixture.componentInstance, inputs);
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza icon y title por defecto', async () => {
    const fixture = await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Sin datos');
    expect(fixture.nativeElement.querySelector('i.pi.pi-inbox')).toBeTruthy();
  });

  it('renderiza title personalizado', async () => {
    const fixture = await setup({ title: 'No hay leads' });
    expect(fixture.nativeElement.querySelector('h3').textContent.trim()).toBe('No hay leads');
  });

  it('muestra description cuando está presente', async () => {
    const fixture = await setup({ description: 'Agrega tu primer lead.' });
    expect(fixture.nativeElement.querySelector('p').textContent).toContain('Agrega tu primer lead.');
  });

  it('no renderiza p cuando description está vacío', async () => {
    const fixture = await setup({ description: '' });
    expect(fixture.nativeElement.querySelector('p')).toBeFalsy();
  });
});
