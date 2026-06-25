/**
 * Defaults profesionales para una tienda de celulares. Se usan:
 *   - al hacer lazy-create de la página `home` cuando una empresa entra
 *     por primera vez al editor (mezclados con WebsiteConfig si lo tiene);
 *   - al agregar una sección nueva sin `data`, para no presentar campos
 *     vacíos al ADMIN.
 */
import { WebsiteSectionType } from '@prisma/client';

export const DEFAULT_SECTION_DATA: Record<
  WebsiteSectionType,
  Record<string, unknown>
> = {
  NAVBAR: {
    variant: 'simple',
    showLogo: true,
    links: [
      { label: 'Inicio', href: '#inicio' },
      { label: 'Catálogo', href: '#productos' },
      { label: 'Servicios', href: '#servicios' },
      { label: 'Contacto', href: '#contacto' },
    ],
    ctaLabel: 'Cotizar ahora',
  },
  HERO: {
    eyebrow: 'Celulares, accesorios y servicio técnico',
    title: 'Encuentra tu próximo celular con asesoría personalizada',
    subtitle:
      'Compra celulares nuevos, usados, accesorios y recibe soporte técnico con atención rápida por WhatsApp.',
    ctaPrimary: { label: 'Ver catálogo' },
    ctaSecondary: { label: 'Cotizar ahora' },
  },
  FEATURED_PRODUCTS: {
    eyebrow: 'Productos destacados',
    title: 'Lo que más están preguntando',
    limit: 6,
  },
  SERVICES: {
    eyebrow: 'Servicios',
    title: 'Todo lo que necesitas en un solo lugar',
    items: [
      { title: 'Celulares nuevos', description: 'Marcas top con garantía oficial.', icon: 'pi-mobile' },
      { title: 'Usados y reacondicionados', description: 'Equipos revisados y certificados.', icon: 'pi-replay' },
      { title: 'Accesorios y protección', description: 'Vidrios, estuches, cargadores y más.', icon: 'pi-shield' },
      { title: 'Reparación técnica', description: 'Pantalla, batería y software.', icon: 'pi-cog' },
      { title: 'Asesoría personalizada', description: 'Te ayudamos a elegir según tu presupuesto.', icon: 'pi-user' },
      { title: 'Atención por WhatsApp', description: 'Respuesta rápida durante horario laboral.', icon: 'pi-whatsapp' },
    ],
  },
  BENEFITS: {
    eyebrow: 'Por qué elegirnos',
    title: 'Confianza, asesoría y atención cercana',
    items: [
      { title: 'Atención rápida por WhatsApp', description: 'Respondemos en minutos durante horario laboral.', icon: 'pi-comments' },
      { title: 'Productos disponibles en oficina', description: 'Revisa antes de comprar. Sin esperas largas.', icon: 'pi-map-marker' },
      { title: 'Garantía según equipo', description: 'Todos los celulares incluyen garantía según su condición.', icon: 'pi-shield' },
      { title: 'Asesoría según presupuesto', description: 'Te recomendamos lo mejor según lo que quieres invertir.', icon: 'pi-user' },
      { title: 'Opciones nuevas y usadas', description: 'Trabajamos con varias marcas y condiciones.', icon: 'pi-refresh' },
      { title: 'Soporte postventa', description: 'Después de la compra seguimos disponibles para ti.', icon: 'pi-headphones' },
    ],
  },
  OFFICES: {
    eyebrow: 'Oficinas',
    title: 'Visítanos o llámanos',
    subtitle: 'Atención presencial en nuestras sedes activas.',
  },
  FAQ: {
    eyebrow: 'Preguntas frecuentes',
    title: 'Lo que más nos preguntan',
    items: [
      { question: '¿Los celulares tienen garantía?', answer: 'Sí. Cada equipo incluye garantía según su condición (nuevo, usado o reacondicionado).' },
      { question: '¿Tienen celulares usados?', answer: 'Sí, manejamos equipos usados revisados y reacondicionados certificados con garantía.' },
      { question: '¿Puedo separar un equipo?', answer: 'Puedes separar tu equipo con un abono inicial. Pregunta a un asesor las condiciones.' },
      { question: '¿Puedo cotizar por WhatsApp?', answer: 'Sí, escríbenos por WhatsApp y un asesor te responde en minutos.' },
      { question: '¿Reciben celulares como parte de pago?', answer: 'Recibimos tu celular usado como parte de pago según el estado y el modelo.' },
      { question: '¿Dónde están ubicados?', answer: 'Tenemos atención presencial en nuestras oficinas. Revisa la sección Oficinas o consulta con un asesor.' },
    ],
  },
  CTA: {
    title: '¿No sabes qué celular elegir?',
    subtitle:
      'Dinos tu presupuesto y te ayudamos a encontrar la mejor opción disponible.',
    ctaPrimary: { label: 'Solicitar cotización' },
    ctaSecondary: { label: 'Escribir por WhatsApp' },
  },
  CONTACT: {
    title: 'Contáctanos',
    useCompanyContact: true,
  },
  FOOTER: {
    description:
      'Venta de celulares, accesorios y servicio técnico con asesoría rápida por WhatsApp.',
  },
};

/** Orden y selección de secciones para el "primer arranque" del editor. */
export const DEFAULT_SECTION_ORDER: WebsiteSectionType[] = [
  'NAVBAR' as WebsiteSectionType,
  'HERO' as WebsiteSectionType,
  'FEATURED_PRODUCTS' as WebsiteSectionType,
  'SERVICES' as WebsiteSectionType,
  'BENEFITS' as WebsiteSectionType,
  'OFFICES' as WebsiteSectionType,
  'FAQ' as WebsiteSectionType,
  'CTA' as WebsiteSectionType,
  'CONTACT' as WebsiteSectionType,
];
