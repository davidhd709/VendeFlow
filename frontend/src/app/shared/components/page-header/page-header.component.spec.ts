import { TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  const setup = async (inputs: Partial<InstanceType<typeof PageHeaderComponent>> = {}) => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(PageHeaderComponent);
    Object.assign(fixture.componentInstance, inputs);
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza el title en h1', async () => {
    const fixture = await setup({ title: 'Usuarios' });
    expect(fixture.nativeElement.querySelector('h1').textContent.trim()).toBe('Usuarios');
  });

  it('muestra subtitle cuando está presente', async () => {
    const fixture = await setup({ title: 'Leads', subtitle: 'Gestión de prospectos' });
    expect(fixture.nativeElement.querySelector('p.text-muted').textContent).toContain('Gestión de prospectos');
  });

  it('no renderiza p cuando subtitle está vacío', async () => {
    const fixture = await setup({ title: 'Leads', subtitle: '' });
    expect(fixture.nativeElement.querySelector('p.text-muted')).toBeFalsy();
  });

  it('contiene .ph-actions para ng-content', async () => {
    const fixture = await setup();
    expect(fixture.nativeElement.querySelector('.ph-actions')).toBeTruthy();
  });
});
