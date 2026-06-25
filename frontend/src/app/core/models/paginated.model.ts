/** Respuesta paginada estándar de los listados de la API. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
