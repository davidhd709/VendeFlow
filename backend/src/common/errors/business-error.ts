/**
 * Error de regla de negocio. El GlobalExceptionFilter lo serializa al
 * contrato de error estándar de la plataforma.
 */
export class BusinessError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly error = 'BUSINESS_RULE_VIOLATION',
    public readonly field?: string,
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}
