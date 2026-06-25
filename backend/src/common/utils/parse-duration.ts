const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Convierte "7d", "15m", "30s" a milisegundos. Default 7 días si no parsea. */
export function parseDuration(value: string): number {
  const match = /^(\d+)\s*([smhd])$/.exec(value.trim());
  if (!match) return 7 * UNIT_MS.d;
  return Number(match[1]) * UNIT_MS[match[2]];
}
