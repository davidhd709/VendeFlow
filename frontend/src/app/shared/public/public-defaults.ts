import {
  FaqItem,
  ServiceItem,
} from '@core/models/website-config.model';

/** Servicios por defecto cuando la empresa aún no configuró los suyos. */
export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    title: 'Celulares nuevos',
    description: 'Marcas top con garantía oficial.',
    icon: 'pi-mobile',
  },
  {
    title: 'Usados y reacondicionados',
    description: 'Equipos revisados y certificados.',
    icon: 'pi-replay',
  },
  {
    title: 'Accesorios y protección',
    description: 'Vidrios, estuches, cargadores y más.',
    icon: 'pi-shield',
  },
  {
    title: 'Reparación técnica',
    description: 'Pantalla, batería y software.',
    icon: 'pi-cog',
  },
  {
    title: 'Asesoría personalizada',
    description: 'Te ayudamos a elegir según tu presupuesto.',
    icon: 'pi-user',
  },
  {
    title: 'Atención por WhatsApp',
    description: 'Respuesta rápida durante horario laboral.',
    icon: 'pi-whatsapp',
  },
];

/** Preguntas frecuentes por defecto. */
export const DEFAULT_FAQ: FaqItem[] = [
  {
    question: '¿Los celulares tienen garantía?',
    answer:
      'Sí. Cada equipo incluye garantía según su condición (nuevo, usado o reacondicionado). Pídela al cerrar la compra.',
  },
  {
    question: '¿Tienen celulares usados?',
    answer:
      'Sí, manejamos equipos usados revisados y reacondicionados certificados con garantía.',
  },
  {
    question: '¿Puedo separar un equipo?',
    answer:
      'Puedes separar tu equipo con un abono inicial. Pregunta a un asesor las condiciones.',
  },
  {
    question: '¿Puedo cotizar por WhatsApp?',
    answer:
      'Sí, escríbenos por WhatsApp y un asesor te responde en minutos durante el horario de atención.',
  },
  {
    question: '¿Reciben celulares como parte de pago?',
    answer:
      'Recibimos tu celular usado como parte de pago según el estado y el modelo. Llévalo a la oficina para una valoración.',
  },
  {
    question: '¿Dónde están ubicados?',
    answer:
      'Tenemos atención presencial en nuestras oficinas. Revisa la sección Oficinas o consúltale a un asesor.',
  },
];

/** Beneficios "por qué elegirnos". */
export interface Benefit {
  icon: string;
  title: string;
  description: string;
}

export const DEFAULT_BENEFITS: Benefit[] = [
  {
    icon: 'pi-comments',
    title: 'Atención rápida por WhatsApp',
    description: 'Respondemos en minutos durante horario laboral.',
  },
  {
    icon: 'pi-map-marker',
    title: 'Productos disponibles en oficina',
    description: 'Revisa antes de comprar. Sin esperas largas.',
  },
  {
    icon: 'pi-shield',
    title: 'Garantía según equipo',
    description: 'Todos los celulares incluyen garantía según su condición.',
  },
  {
    icon: 'pi-user',
    title: 'Asesoría según presupuesto',
    description: 'Te recomendamos lo mejor según lo que quieres invertir.',
  },
  {
    icon: 'pi-refresh',
    title: 'Opciones nuevas y usadas',
    description: 'Trabajamos con varias marcas y condiciones.',
  },
  {
    icon: 'pi-headphones',
    title: 'Soporte postventa',
    description: 'Después de la compra seguimos disponibles para ti.',
  },
];

/** Bloques de confianza para el hero. */
export const HERO_TRUST = [
  { icon: 'pi-shield', label: 'Garantía' },
  { icon: 'pi-map-marker', label: 'Atención en oficina' },
  { icon: 'pi-bolt', label: 'Cotización rápida' },
  { icon: 'pi-user', label: 'Asesoría personalizada' },
];

/** Lo que muestra una condición de producto. */
export const CONDITION_LABEL: Record<string, string> = {
  NUEVO: 'Nuevo',
  USADO: 'Usado',
  REACONDICIONADO: 'Reacondicionado',
};
