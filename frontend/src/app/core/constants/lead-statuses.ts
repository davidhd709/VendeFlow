// Espejo del enum LeadStatus del backend (Prisma). Fuente de verdad: salesflow-domain.
export enum LeadStatus {
  NUEVO = 'NUEVO',
  CONTACTADO = 'CONTACTADO',
  EN_SEGUIMIENTO = 'EN_SEGUIMIENTO',
  INTERESADO = 'INTERESADO',
  VENDIDO = 'VENDIDO',
  PERDIDO = 'PERDIDO',
  SIN_RESPUESTA = 'SIN_RESPUESTA',
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  [LeadStatus.NUEVO]: 'Nuevo',
  [LeadStatus.CONTACTADO]: 'Contactado',
  [LeadStatus.EN_SEGUIMIENTO]: 'En seguimiento',
  [LeadStatus.INTERESADO]: 'Interesado',
  [LeadStatus.VENDIDO]: 'Vendido',
  [LeadStatus.PERDIDO]: 'Perdido',
  [LeadStatus.SIN_RESPUESTA]: 'Sin respuesta',
};

/** Severidad de PrimeNG (p-tag) por estado, para los badges de estado. */
export const LEAD_STATUS_SEVERITY: Record<LeadStatus, string> = {
  [LeadStatus.NUEVO]: 'info',
  [LeadStatus.CONTACTADO]: 'info',
  [LeadStatus.EN_SEGUIMIENTO]: 'warn',
  [LeadStatus.INTERESADO]: 'warn',
  [LeadStatus.VENDIDO]: 'success',
  [LeadStatus.PERDIDO]: 'danger',
  [LeadStatus.SIN_RESPUESTA]: 'secondary',
};
