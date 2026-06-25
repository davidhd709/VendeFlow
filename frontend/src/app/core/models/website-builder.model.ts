/** Espejo del enum del backend. */
export type WebsiteSectionType =
  | 'NAVBAR'
  | 'HERO'
  | 'FEATURED_PRODUCTS'
  | 'SERVICES'
  | 'BENEFITS'
  | 'OFFICES'
  | 'FAQ'
  | 'CTA'
  | 'CONTACT'
  | 'FOOTER';

export type WebsitePageStatus = 'DRAFT' | 'PUBLISHED';
export type WebsitePageTheme = 'commercial' | 'premium' | 'vibrant';

export const SECTION_TYPE_LABELS: Record<WebsiteSectionType, string> = {
  NAVBAR: 'Menú / Header',
  HERO: 'Hero principal',
  FEATURED_PRODUCTS: 'Productos destacados',
  SERVICES: 'Servicios',
  BENEFITS: 'Beneficios',
  OFFICES: 'Oficinas',
  FAQ: 'Preguntas frecuentes',
  CTA: 'Llamado a la acción',
  CONTACT: 'Contacto',
  FOOTER: 'Pie de página',
};

export const SECTION_TYPE_ICONS: Record<WebsiteSectionType, string> = {
  NAVBAR: 'pi-bars',
  HERO: 'pi-image',
  FEATURED_PRODUCTS: 'pi-mobile',
  SERVICES: 'pi-th-large',
  BENEFITS: 'pi-star',
  OFFICES: 'pi-map-marker',
  FAQ: 'pi-question-circle',
  CTA: 'pi-bolt',
  CONTACT: 'pi-envelope',
  FOOTER: 'pi-align-justify',
};

export interface TextStyle {
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  letterSpacing?: string;
  lineHeight?: string;
}

export type BorderRadiusToken = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ShadowToken = 'none' | 'sm' | 'md' | 'lg';
export type PaddingYToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonStyle {
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: BorderRadiusToken;
}

export interface CardStyle {
  bgColor?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: BorderRadiusToken;
  shadow?: ShadowToken;
}

export interface ImageStyle {
  borderRadius?: BorderRadiusToken;
  aspectRatio?: '1/1' | '4/3' | '3/2' | '16/9' | 'auto';
}

export interface SectionStyle {
  bgColor?: string;
  fontFamily?: 'sans' | 'serif' | 'display';
  paddingY?: PaddingYToken;
  title?: TextStyle;
  subtitle?: TextStyle;
  eyebrow?: TextStyle;
  body?: TextStyle;
  primaryBtn?: ButtonStyle;
  secondaryBtn?: ButtonStyle;
  card?: CardStyle;
  image?: ImageStyle;
}

// Tipos de data por tipo de sección.
export interface NavLink {
  label: string;
  href?: string;
}

export interface NavbarData {
  variant?: 'simple' | 'centered' | 'split';
  links?: NavLink[];
  ctaLabel?: string;
  ctaHref?: string;
  showLogo?: boolean;
  /** Color de fondo de la barra de navegación */
  navBgColor?: string;
  /** Color del texto de los links */
  navTextColor?: string;
  /** Color de fondo del botón CTA */
  ctaBgColor?: string;
  /** Color del texto del botón CTA */
  ctaTextColor?: string;
  /** Forma del botón CTA */
  ctaBorderRadius?: BorderRadiusToken;
  /** Estilo del botón: sólido, outline o ghost */
  ctaStyle?: 'solid' | 'outline' | 'ghost';
  style?: SectionStyle;
}

export interface CtaButton {
  label: string;
  href?: string;
}

export interface HeroData {
  variant?: 'classic' | 'centered' | 'promo' | 'fullbleed' | 'magazine';
  theme?: WebsitePageTheme;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaPrimary?: CtaButton;
  ctaSecondary?: CtaButton;
  /** Posición de la imagen en variante classic */
  imagePosition?: 'right' | 'left';
  /** Altura mínima del hero */
  heroHeight?: 'auto' | 'medium' | 'large' | 'screen';
  /** Alineación del texto */
  textAlign?: 'left' | 'center' | 'right';
  style?: SectionStyle;
}

export interface ContentItem {
  title: string;
  description?: string;
  icon?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ServicesData {
  variant?: 'grid' | 'list' | 'featured' | 'numbered' | 'horizontal';
  eyebrow?: string;
  title?: string;
  items?: ContentItem[];
  /** Columnas en variante grid (default 3) */
  columns?: 2 | 3 | 4;
  /** Layout interno de cada card */
  cardLayout?: 'icon-top' | 'icon-left';
  /** Color de fondo de las cards */
  cardBgColor?: string;
  /** Color del texto de las cards */
  cardTextColor?: string;
  /** Color de acento (icono, borde superior) */
  cardAccentColor?: string;
  /** Color del borde de las cards */
  cardBorderColor?: string;
  /** Forma del borde de las cards */
  cardBorderRadius?: BorderRadiusToken;
  /** Sombra de las cards */
  cardShadow?: ShadowToken;
  style?: SectionStyle;
}

export type BenefitsData = ServicesData;

export interface FaqData {
  variant?: 'accordion' | 'list' | 'twoColumns';
  eyebrow?: string;
  title?: string;
  items?: FaqItem[];
  style?: SectionStyle;
}

export interface FeaturedProductsData {
  variant?: 'grid' | 'highlight' | 'compact';
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  limit?: number;
  ctaLabel?: string;
  showCta?: boolean;
  emptyMessage?: string;
  productIds?: string[];
  style?: SectionStyle;
}

export interface CtaData {
  variant?: 'centered' | 'split' | 'banner';
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  ctaPrimary?: CtaButton;
  ctaSecondary?: CtaButton;
  primaryAction?: 'QUOTE' | 'WHATSAPP' | 'CATALOG';
  secondaryAction?: 'QUOTE' | 'WHATSAPP' | 'CATALOG';
  imageUrl?: string;
  styleVariant?: 'DARK' | 'LIGHT';
  style?: SectionStyle;
}

export interface ContactData {
  variant?: 'card' | 'split' | 'channels';
  title?: string;
  description?: string;
  useCompanyContact?: boolean;
  whatsapp?: string;
  whatsappButtonLabel?: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  style?: SectionStyle;
}

export interface FooterData {
  variant?: 'simple' | 'columns' | 'compact';
  description?: string;
  showPoweredBySalesflow?: boolean;
  copyrightText?: string;
  showContact?: boolean;
  quickLinks?: Array<{ label: string; href: string }>;
  whatsapp?: string;
  email?: string;
  style?: SectionStyle;
}

export interface OfficesData {
  variant?: 'cards' | 'compact' | 'contact';
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  emptyMessage?: string;
  showContactData?: boolean;
  style?: SectionStyle;
}

export interface WebsiteSection {
  id: string;
  companyId: string;
  pageId: string;
  type: WebsiteSectionType;
  order: number;
  visible: boolean;
  data: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WebsitePage {
  id: string;
  companyId: string;
  slug: string;
  title: string;
  status: WebsitePageStatus;
  publishedAt: string | null;
  publishedSnapshot: PublishedSection[] | null;
  createdAt: string;
  updatedAt: string;
  sections?: WebsiteSection[];
}

export interface PublishedSection {
  type: WebsiteSectionType;
  visible: boolean;
  data: Record<string, unknown>;
}
