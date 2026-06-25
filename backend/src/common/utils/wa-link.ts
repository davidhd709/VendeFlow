/** Genera un enlace wa.me con el mensaje prellenado. */
export function buildWaLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/** Reemplaza {nombre} en la plantilla por el nombre del cliente. */
export function personalizeMessage(message: string, name: string): string {
  return message.replace(/\{nombre\}/gi, name);
}
