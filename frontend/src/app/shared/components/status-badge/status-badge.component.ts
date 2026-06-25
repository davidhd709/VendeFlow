import { Component, computed, input } from '@angular/core';
import { Tag } from 'primeng/tag';
import {
  LEAD_STATUS_LABELS,
  LEAD_STATUS_SEVERITY,
  LeadStatus,
} from '@core/constants/lead-statuses';

type Severity =
  | 'success'
  | 'info'
  | 'warn'
  | 'danger'
  | 'secondary'
  | 'contrast';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [Tag],
  template: `<p-tag [value]="label()" [severity]="severity()" />`,
})
export class StatusBadgeComponent {
  status = input.required<LeadStatus>();
  label = computed(() => LEAD_STATUS_LABELS[this.status()]);
  severity = computed(() => LEAD_STATUS_SEVERITY[this.status()] as Severity);
}
