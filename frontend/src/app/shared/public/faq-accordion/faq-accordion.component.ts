import { Component, Input } from '@angular/core';
import { FaqItem } from '@core/models/website-config.model';

@Component({
  selector: 'app-faq-accordion',
  standalone: true,
  template: `
    <div class="faq">
      @for (item of items; let i = $index; track i) {
        <details>
          <summary>
            <span>{{ item.question }}</span>
            <i class="pi pi-chevron-down chev"></i>
          </summary>
          <p>{{ item.answer }}</p>
        </details>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .faq {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      details {
        background: #fff;
        border: 1px solid var(--sf-border);
        border-radius: 14px;
        overflow: hidden;
        transition: border-color 0.15s var(--sf-ease),
          box-shadow 0.15s var(--sf-ease);
      }
      details[open] {
        border-color: color-mix(in srgb, var(--sf-primary) 40%, var(--sf-border));
        box-shadow: var(--sf-shadow-sm);
      }
      summary {
        list-style: none;
        cursor: pointer;
        padding: 1rem 1.25rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        font-weight: 600;
        color: var(--sf-text);
      }
      summary::-webkit-details-marker { display: none; }
      .chev {
        color: var(--sf-text-muted);
        transition: transform 0.18s var(--sf-ease);
        font-size: 0.85rem;
      }
      details[open] .chev { transform: rotate(180deg); color: var(--sf-primary); }
      p {
        margin: 0;
        padding: 0 1.25rem 1rem;
        color: var(--sf-text-muted);
        line-height: 1.6;
      }
    `,
  ],
})
export class FaqAccordionComponent {
  @Input() items: FaqItem[] = [];
}
