import { HttpParams } from '@angular/common/http';

/** Construye HttpParams omitiendo valores null, undefined o cadena vacía. */
export function buildParams(obj: Record<string, unknown>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined && value !== '') {
      params = params.set(key, String(value));
    }
  }
  return params;
}
