import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { CompaniesService } from '@core/services/companies.service';
import { ToastService } from '@core/services/toast.service';
import { SuperadminCompaniesComponent } from './companies.component';

const makeCompany = (id: string, status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' = 'ACTIVE') => ({
  id,
  name: `Empresa ${id}`,
  slug: `empresa-${id}`,
  subdomain: `empresa-${id}`,
  status,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe('SuperadminCompaniesComponent', () => {
  let companiesService: { getAll: jest.Mock; create: jest.Mock; update: jest.Mock; updateStatus: jest.Mock };
  let toast: { success: jest.Mock; error: jest.Mock };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [SuperadminCompaniesComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        MessageService,
        ToastService,
        { provide: CompaniesService, useValue: companiesService },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SuperadminCompaniesComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    companiesService = {
      getAll:       jest.fn().mockReturnValue(of({ items: [], total: 0 })),
      create:       jest.fn().mockReturnValue(of(makeCompany('new'))),
      update:       jest.fn().mockReturnValue(of(makeCompany('c-1'))),
      updateStatus: jest.fn().mockReturnValue(of(makeCompany('c-1', 'SUSPENDED'))),
    };
    toast = { success: jest.fn(), error: jest.fn() };
  });

  it('muestra estado de carga mientras espera respuesta', async () => {
    const pending$ = new Subject<unknown>();
    companiesService.getAll.mockReturnValue(pending$);
    const fixture = await create();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('muestra empty state cuando no hay empresas', async () => {
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Sin empresas en la plataforma');
  });

  it('muestra error state cuando el servicio falla', async () => {
    companiesService.getAll.mockReturnValue(throwError(() => ({ userMessage: 'Error al cargar empresas' })));
    const fixture = await create();
    expect(fixture.nativeElement.textContent).toContain('Error al cargar empresas');
  });

  it('renderiza tabla con empresas cargadas', async () => {
    companiesService.getAll.mockReturnValue(of({
      items: [makeCompany('c-1', 'ACTIVE'), makeCompany('c-2', 'SUSPENDED')],
      total: 2,
    }));
    const fixture = await create();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Empresa c-1');
    expect(text).toContain('Empresa c-2');
    expect(text).toContain('Activa');
    expect(text).toContain('Suspendida');
  });

  it('abre modal "Nueva empresa" al hacer clic en el botón', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.openNew();
    fixture.detectChanges();

    expect(component.dialog).toBe(true);
    expect(document.body.textContent).toContain('Nueva empresa');
  });

  it('valida que todos los campos sean requeridos al crear', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.dialog = true;
    component.name = '';
    component.save();

    expect(toast.error).toHaveBeenCalledWith('Completa todos los campos requeridos');
    expect(companiesService.create).not.toHaveBeenCalled();
  });

  it('abre modal de edición con datos de la empresa', async () => {
    companiesService.getAll.mockReturnValue(of({ items: [makeCompany('c-1')], total: 1 }));
    const fixture = await create();
    const component = fixture.componentInstance;

    const company = makeCompany('c-1');
    component.openEdit(company);
    fixture.detectChanges();

    expect(component.editDialog).toBe(true);
    expect(component.editName).toBe('Empresa c-1');
    expect(component.editSlug).toBe('empresa-c-1');
  });

  it('llama updateStatus al suspender una empresa activa', async () => {
    companiesService.getAll.mockReturnValue(of({ items: [makeCompany('c-1', 'ACTIVE')], total: 1 }));
    const fixture = await create();
    const component = fixture.componentInstance;

    component.toggleStatus(makeCompany('c-1', 'ACTIVE'));

    expect(companiesService.updateStatus).toHaveBeenCalledWith('c-1', 'SUSPENDED');
  });

  it('llama updateStatus con ACTIVE al reactivar una empresa suspendida', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.toggleStatus(makeCompany('c-2', 'SUSPENDED'));

    expect(companiesService.updateStatus).toHaveBeenCalledWith('c-2', 'ACTIVE');
  });
});
