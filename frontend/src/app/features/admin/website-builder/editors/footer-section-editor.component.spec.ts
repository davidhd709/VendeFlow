import { TestBed } from '@angular/core/testing';
import { FooterSectionEditorComponent } from './footer-section-editor.component';

describe('FooterSectionEditorComponent', () => {
  it('emite dataChange al modificar campos principales', async () => {
    await TestBed.configureTestingModule({
      imports: [FooterSectionEditorComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(FooterSectionEditorComponent);
    const component = fixture.componentInstance;
    const emitSpy = jest.spyOn(component.dataChange, 'emit');
    component.data = { description: 'Footer inicial' };
    fixture.detectChanges();

    const textarea: HTMLTextAreaElement | null = fixture.nativeElement.querySelector('textarea');
    if (textarea) {
      textarea.value = 'Nuevo mensaje de cierre';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }

    expect(emitSpy).toHaveBeenCalled();
  });
});
