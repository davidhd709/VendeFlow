import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TemplatesService } from '@core/services/templates.service';
import { ToastService } from '@core/services/toast.service';
import { AdminTemplatesComponent } from './templates.component';

const makeTemplate = (id: string, isActive = true) => ({
  id,
  companyId: 'c-a',
  name: `Plantilla ${id}`,
  body: `Hola {nombre}, mensaje ${id}`,
  isActive,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('AdminTemplatesComponent', () => {
  let templatesService: { getAll: jest.Mock; create: jest.Mock };
  let toast: { success: jest.Mock; error: jest.Mock };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [AdminTemplatesComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        MessageService,
        ToastService,
        { provide: TemplatesService, useValue: templatesService },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminTemplatesComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    templatesService = {
      getAll:  jest.fn().mockReturnValue(of([])),
      create:  jest.fn().mockReturnValue(of(makeTemplate('new'))),
    };
    toast = { success: jest.fn(), error: jest.fn() };
  });

  it('muestra estado de carga mientras espera respuesta', async () => {
    const pending$ = new Subject<unknown>();
    templatesService.getAll.mockReturnValue(pending$);
    const fixture = await create();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('muestra empty state cuando no hay plantillas', async () => {
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Aún no tienes plantillas');
  });

  it('muestra error state cuando el servicio falla', async () => {
    templatesService.getAll.mockReturnValue(throwError(() => ({ userMessage: 'Error al cargar plantillas' })));
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Error al cargar plantillas');
  });

  it('renderiza tabla con plantillas y sus etiquetas de estado', async () => {
    templatesService.getAll.mockReturnValue(of([
      makeTemplate('t-1', true),
      makeTemplate('t-2', false),
    ]));
    const fixture = await create();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Plantilla t-1');
    expect(text).toContain('Plantilla t-2');
    expect(text).toContain('Activa');
    expect(text).toContain('Inactiva');
  });

  it('abre modal de nueva plantilla al llamar openNew()', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.openNew();
    fixture.detectChanges();

    expect(component.dialog).toBe(true);
    expect(document.body.textContent).toContain('Nueva plantilla');
  });

  it('insertVar agrega la variable al cuerpo del mensaje', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.form.body = 'Hola ';
    component.insertVar('{nombre}');

    expect(component.form.body).toBe('Hola {nombre}');
  });

  it('no guarda si el nombre o cuerpo están vacíos', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.form = { name: '', body: '' };
    component.save();

    expect(templatesService.create).not.toHaveBeenCalled();
    expect(component.touched).toBe(true);
  });

  it('guarda la plantilla y recarga la lista al tener datos válidos', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.form = { name: 'Promo iPhone', body: 'Hola {nombre}, mira esta oferta.' };
    component.save();

    expect(templatesService.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Promo iPhone' }),
    );
    expect(toast.success).toHaveBeenCalledWith('Plantilla creada');
  });

  it('length() devuelve 0 con el formulario vacío inicial', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;
    component.openNew();
    expect(component.length()).toBe(0);
  });
});
