import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { MessageService } from 'primeng/api';
import { WebsiteConfigService } from '@core/services/website-config.service';
import { FilesService } from '@core/services/files.service';
import { ToastService } from '@core/services/toast.service';
import { AdminWebsiteConfigComponent } from './website-config.component';

const makeConfig = (overrides: Record<string, unknown> = {}) => ({
  id: 'cfg-1',
  companyId: 'c-a',
  heroTitle: 'Bienvenidos',
  heroSubtitle: 'Celulares premium',
  primaryColor: '#2563eb',
  logoUrl: null,
  banners: [],
  services: [],
  faq: [],
  contactPhone: '+573001112233',
  contactEmail: 'hola@empresa.com',
  address: 'Calle 123, Ciudad',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('AdminWebsiteConfigComponent', () => {
  let configService: { getMine: jest.Mock; upsert: jest.Mock };
  let filesService: { upload: jest.Mock };
  let toast: { success: jest.Mock; error: jest.Mock };

  const create = async () => {
    await TestBed.configureTestingModule({
      imports: [AdminWebsiteConfigComponent],
      providers: [
        provideHttpClient(),
        provideNoopAnimations(),
        provideRouter([]),
        MessageService,
        ToastService,
        { provide: WebsiteConfigService, useValue: configService },
        { provide: FilesService, useValue: filesService },
        { provide: ToastService, useValue: toast },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminWebsiteConfigComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    configService = {
      getMine:  jest.fn().mockReturnValue(of(null)),
      upsert:   jest.fn().mockReturnValue(of(makeConfig())),
    };
    filesService = { upload: jest.fn().mockReturnValue(of({ url: 'https://cdn.test/logo.png' })) };
    toast = { success: jest.fn(), error: jest.fn() };
  });

  it('muestra estado de carga mientras obtiene la configuración', async () => {
    configService.getMine.mockReturnValue(new Subject());
    const fixture = await create();
    expect(fixture.nativeElement.querySelector('app-loading')).toBeTruthy();
  });

  it('carga valores de configuración existentes al iniciar', async () => {
    configService.getMine.mockReturnValue(of(makeConfig({
      primaryColor: '#ff0000',
      contactPhone: '+573009999',
    })));
    const fixture = await create();
    const component = fixture.componentInstance;

    expect(component.cfg.primaryColor).toBe('#ff0000');
    expect(component.cfg.contactPhone).toBe('+573009999');
  });

  it('usa valores por defecto cuando no hay configuración previa', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    expect(component.cfg.primaryColor).toBe('#2563eb');
    expect(component.cfg.contactPhone).toBe('');
  });

  it('llama upsert al hacer clic en Guardar', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.cfg.primaryColor = '#123456';
    component.save();

    expect(configService.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ primaryColor: '#123456' }),
    );
  });

  it('muestra toast.success al guardar correctamente', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    component.save();

    expect(toast.success).toHaveBeenCalledWith('Configuración guardada');
  });

  it('muestra toast.error cuando upsert falla', async () => {
    configService.upsert.mockReturnValue(throwError(() => ({ userMessage: 'Error al guardar' })));
    const fixture = await create();
    const component = fixture.componentInstance;

    component.save();

    expect(toast.error).toHaveBeenCalledWith('Error al guardar');
  });

  it('actualiza logoUrl al subir un logo exitosamente', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    const file = new File(['img'], 'logo.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;
    component.uploadLogo(event);

    expect(filesService.upload).toHaveBeenCalledWith(file);
    expect(component.cfg.logoUrl).toBe('https://cdn.test/logo.png');
    expect(toast.success).toHaveBeenCalledWith('Logo subido');
  });

  it('no llama upload si no se seleccionó ningún archivo', async () => {
    const fixture = await create();
    const component = fixture.componentInstance;

    const event = { target: { files: [] } } as unknown as Event;
    component.uploadLogo(event);

    expect(filesService.upload).not.toHaveBeenCalled();
  });
});
