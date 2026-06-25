import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AlertCardComponent } from './alert-card.component';

describe('AlertCardComponent', () => {
  const setup = async (inputs: Partial<InstanceType<typeof AlertCardComponent>> = {}) => {
    await TestBed.configureTestingModule({
      imports: [AlertCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(AlertCardComponent);
    Object.assign(fixture.componentInstance, inputs);
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza título y descripción', async () => {
    const fixture = await setup({ title: 'Lead sin seguimiento', description: 'Carlos lleva 3 días sin contacto.' });
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Lead sin seguimiento');
    expect(text).toContain('Carlos lleva 3 días sin contacto.');
  });

  it('muestra el enlace de acción cuando actionLabel y actionLink están presentes', async () => {
    const fixture = await setup({ actionLabel: 'Ver lead', actionLink: '/leads/123' });
    const link = fixture.nativeElement.querySelector('a.cta');
    expect(link).toBeTruthy();
    expect(link.textContent.trim()).toBe('Ver lead');
  });

  it('no muestra el enlace cuando actionLabel está vacío', async () => {
    const fixture = await setup({ actionLabel: '', actionLink: '/leads/123' });
    expect(fixture.nativeElement.querySelector('a.cta')).toBeFalsy();
  });

  it('no muestra el enlace cuando actionLink está vacío', async () => {
    const fixture = await setup({ actionLabel: 'Ver lead', actionLink: '' });
    expect(fixture.nativeElement.querySelector('a.cta')).toBeFalsy();
  });

  it('aplica el atributo data-tone al artículo', async () => {
    const fixture = await setup({ tone: 'danger' });
    const article = fixture.nativeElement.querySelector('article.alert');
    expect(article.getAttribute('data-tone')).toBe('danger');
  });

  it('usa tone "info" por defecto', async () => {
    const fixture = await setup();
    const article = fixture.nativeElement.querySelector('article.alert');
    expect(article.getAttribute('data-tone')).toBe('info');
  });
});
