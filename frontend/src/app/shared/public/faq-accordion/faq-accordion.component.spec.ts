import { TestBed } from '@angular/core/testing';
import { FaqAccordionComponent } from './faq-accordion.component';

describe('FaqAccordionComponent', () => {
  const setup = async (items = [{ question: '', answer: '' }]) => {
    await TestBed.configureTestingModule({
      imports: [FaqAccordionComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(FaqAccordionComponent);
    fixture.componentInstance.items = items;
    fixture.detectChanges();
    return fixture;
  };

  it('renderiza cada pregunta y respuesta', async () => {
    const fixture = await setup([
      { question: '¿Tienen garantía?', answer: 'Sí, 12 meses.' },
      { question: '¿Hacen envíos?', answer: 'A todo el país.' },
    ]);
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('¿Tienen garantía?');
    expect(text).toContain('Sí, 12 meses.');
    expect(text).toContain('¿Hacen envíos?');
  });

  it('renderiza N elementos details según el arreglo', async () => {
    const fixture = await setup([
      { question: 'P1', answer: 'R1' },
      { question: 'P2', answer: 'R2' },
      { question: 'P3', answer: 'R3' },
    ]);
    expect(fixture.nativeElement.querySelectorAll('details')).toHaveLength(3);
  });

  it('no falla con un arreglo vacío', async () => {
    const fixture = await setup([]);
    expect(fixture.nativeElement.querySelectorAll('details')).toHaveLength(0);
  });
});
