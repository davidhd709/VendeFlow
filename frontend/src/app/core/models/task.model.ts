export interface Task {
  id: string;
  companyId: string;
  assignedToId: string;
  createdById: string;
  leadId: string | null;
  title: string;
  description: string | null;
  status: string;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTask {
  title: string;
  description?: string;
  assignedToId: string;
  leadId?: string;
  dueDate?: string;
}

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  EN_PROGRESO: 'En progreso',
  COMPLETADA: 'Completada',
  VENCIDA: 'Vencida',
};
