import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { OfficesService } from '@core/services/offices.service';
import { ToastService } from '@core/services/toast.service';
import { AdminOfficesComponent } from './offices.component';

describe('AdminOfficesComponent', () => {
  let officesService: {
    getAll: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  const toast = {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [AdminOfficesComponent],
      providers: [
        provideNoopAnimations(),
        { provide: OfficesService, useValue: officesService },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminOfficesComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    officesService = {
      getAll: jest.fn().mockReturnValue(
        of({
          items: [
            {
              id: 'office-1',
              companyId: 'c-1',
              name: 'Sede Centro',
              address: 'Cra 10 # 1-20',
              city: 'Bogotá',
              phone: '3001234567',
              isActive: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
          total: 1,
        }),
      ),
      create: jest.fn().mockReturnValue(
        of({
          id: 'office-2',
          companyId: 'c-1',
          name: 'Sede Norte',
          address: 'Calle 80 # 10-20',
          city: 'Bogotá',
          phone: '3001112233',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      ),
      update: jest.fn().mockReturnValue(
        of({
          id: 'office-1',
          companyId: 'c-1',
          name: 'Sede Norte',
          address: 'Cra 10 # 1-20',
          city: 'Bogotá',
          phone: '3001234567',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      ),
    };
  });

  it('abre el modal de edición con datos actuales de la oficina', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    const editBtn: HTMLButtonElement | undefined = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((btn) => (btn as HTMLButtonElement).textContent?.includes('Editar')) as HTMLButtonElement | undefined;
    editBtn?.click();
    fixture.detectChanges();

    expect(component.dialog).toBe(true);
    expect(component.form.name).toBe('Sede Centro');
    expect(component.form.city).toBe('Bogotá');
    expect(component.form.address).toBe('Cra 10 # 1-20');
    expect(component.form.phone).toBe('3001234567');
  });

  it('envía PATCH con campos modificados y actualiza lista local sin recargar', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    const editBtn: HTMLButtonElement | undefined = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((btn) => (btn as HTMLButtonElement).textContent?.includes('Editar')) as HTMLButtonElement | undefined;
    editBtn?.click();
    fixture.detectChanges();

    const nameInput = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    nameInput.value = 'Sede Norte';
    nameInput.dispatchEvent(new Event('input'));

    const saveBtn: HTMLButtonElement | undefined = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ).find((btn) => (btn as HTMLButtonElement).textContent?.includes('Guardar')) as HTMLButtonElement | undefined;
    saveBtn?.click();
    fixture.detectChanges();

    expect(officesService.update).toHaveBeenCalledWith(
      'office-1',
      {
        name: 'Sede Norte',
      },
    );
    expect(officesService.getAll).toHaveBeenCalledTimes(1);
    expect(component.offices()[0].name).toBe('Sede Norte');
  });
});
