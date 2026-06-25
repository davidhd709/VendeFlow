export type AlertType = 'STALE_LEAD' | 'OVERDUE_TASK';

export interface AlertItem {
  type: AlertType;
  title: string;
  description: string;
  leadId?: string;
  taskId?: string;
  leadName?: string;
  daysStale?: number;
}
