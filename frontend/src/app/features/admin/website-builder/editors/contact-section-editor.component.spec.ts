import { TestBed } from '@angular/core/testing';
import { ContactSectionEditorComponent } from './contact-section-editor.component';

describe('ContactSectionEditorComponent', () => {
  it('emite dataChange al modificar campos principales', async () => {
    await TestBed.configureTestingModule({
      imports: [ContactSectionEditorComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ContactSectionEditorComponent);
    const component = fixture.componentInstance;
    const emitSpy = jest.spyOn(component.dataChange, 'emit');
    component.data = { title: 'Contáctanos' };
    fixture.detectChanges();

    const title: HTMLInputElement | null = fixture.nativeElement.querySelector('input');
    if (title) {
      title.value = 'Escríbenos hoy';
      title.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    expect(emitSpy).toHaveBeenCalled();
  });
});
