/** Contrato de error de la plataforma (ver salesflow-domain). */
export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
  field?: string;
  /** Mensaje amigable agregado por el error.interceptor para mostrar en UI. */
  userMessage?: string;
}
