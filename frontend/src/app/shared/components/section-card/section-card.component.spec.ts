import { TestBed } from '@angular/core/testing';
import { SectionCardComponent } from './section-card.component';

describe('SectionCardComponent', () => {
  const setup = async (inputs: Partial<InstanceType<typeof SectionCardComponent>> = {}) => {
    await TestBed.configureTestingModule({
      imports: [SectionCardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(SectionCardComponent);
    Object.assign(fixture.componentInstance, inputs);
    fixture.detectChanges();
    return fixture;
  };

  it('muestra el header cuando title está presente', async () => {
    const fixture = await setup({ title: 'Información general' });
    expect(fixture.nativeElement.querySelector('header.sc-head')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('h3').textContent.trim()).toBe('Información general');
  });

  it('muestra el header cuando description está presente', async () => {
    const fixture = await setup({ description: 'Datos de la empresa' });
    expect(fixture.nativeElement.querySelector('header.sc-head')).toBeTruthy();
  });

  it('oculta el header cuando title y description están vacíos', async () => {
    const fixture = await setup({ title: '', description: '' });
    expect(fixture.nativeElement.querySelector('header.sc-head')).toBeFalsy();
  });

  it('muestra description dentro del header', async () => {
    const fixture = await setup({ title: 'Equipo', description: 'Gestión del equipo' });
    expect(fixture.nativeElement.querySelector('p.text-muted').textContent).toContain('Gestión del equipo');
  });

  it('no renderiza p cuando description está vacío aunque haya title', async () => {
    const fixture = await setup({ title: 'Equipo', description: '' });
    expect(fixture.nativeElement.querySelector('p.text-muted')).toBeFalsy();
  });

  it('siempre renderiza .sc-body', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('.sc-body')).toBeTruthy();
  });
});
