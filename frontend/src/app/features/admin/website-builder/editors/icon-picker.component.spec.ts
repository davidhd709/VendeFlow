import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { IconPickerComponent } from './icon-picker.component';

describe('IconPickerComponent', () => {
  const setup = async (value = '') => {
    await TestBed.configureTestingModule({
      imports: [IconPickerComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    const fixture = TestBed.createComponent(IconPickerComponent);
    fixture.componentInstance.value = value;
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza el trigger con "Sin icono" cuando no hay valor', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('Sin icono');
  });

  it('renderiza el trigger con el nombre del icono cuando hay valor', async () => {
    const fixture = await setup('pi-check');
    expect(fixture.nativeElement.textContent).toContain('pi-check');
  });

  it('la grilla de iconos no se muestra por defecto', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('.grid')).toBeFalsy();
  });

  it('pick() emite el icono seleccionado y cierra el picker', async () => {
    const fixture = await setup('pi-check');
    const component = fixture.componentInstance;
    const emitted: string[] = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    component.open = true;
    component.pick('pi-star');

    expect(emitted).toEqual(['pi-star']);
    expect(component.open).toBe(false);
  });

  it('pick("") emite cadena vacía para limpiar el icono', async () => {
    const fixture = await setup('pi-check');
    const component = fixture.componentInstance;
    const emitted: string[] = [];
    component.valueChange.subscribe((v) => emitted.push(v));

    component.pick('');

    expect(emitted).toEqual(['']);
    expect(component.open).toBe(false);
  });

  it('ICONS contiene al menos 50 iconos disponibles', async () => {
    const fixture = await setup();
    expect(fixture.componentInstance.ICONS.length).toBeGreaterThanOrEqual(50);
  });
});
