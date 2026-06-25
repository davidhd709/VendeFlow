/** Construye un link wa.me a partir de un teléfono y un texto opcional. */
export function buildWa(phone: string | null | undefined, text?: string): string {
  if (!phone) return 'https://wa.me/';
  const digits = phone.replace(/\D/g, '');
  const qs = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${digits}${qs}`;
}
