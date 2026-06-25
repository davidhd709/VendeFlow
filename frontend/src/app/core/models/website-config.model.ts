export interface BannerItem {
  imageUrl: string;
  link?: string;
  alt?: string;
}

export interface ServiceItem {
  title: string;
  description?: string;
  icon?: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface WebsiteConfig {
  id: string;
  companyId: string;
  heroTitle: string | null;
  heroSubtitle: string | null;
  primaryColor: string | null;
  logoUrl: string | null;
  banners: BannerItem[] | null;
  services: ServiceItem[] | null;
  faq: FaqItem[] | null;
  contactPhone: string | null;
  contactEmail: string | null;
  address: string | null;
  updatedAt: string;
}

export interface UpdateWebsiteConfig {
  heroTitle?: string;
  heroSubtitle?: string;
  primaryColor?: string;
  logoUrl?: string;
  banners?: BannerItem[];
  services?: ServiceItem[];
  faq?: FaqItem[];
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
}

export interface UploadedImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
  bytes: number;
}
