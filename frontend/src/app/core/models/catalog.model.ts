export interface Product {
  id: string;
  companyId: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  model: string | null;
  ram: string | null;
  storage: string | null;
  color: string | null;
  condition: string;
  warranty: string | null;
  price: string; // Prisma Decimal serializa a string
  imageUrl: string | null;
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProduct {
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  model?: string;
  ram?: string;
  storage?: string;
  color?: string;
  condition?: string;
  warranty?: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  isActive?: boolean;
}

export interface Office {
  id: string;
  companyId: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOffice {
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  isActive?: boolean;
}

export interface PublicOffice {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
}
