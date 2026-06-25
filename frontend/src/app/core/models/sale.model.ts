export interface Sale {
  id: string;
  companyId: string;
  officeId: string;
  leadId: string;
  sellerId: string;
  productId: string | null;
  amount: string; // Prisma Decimal serializa a string
  notes: string | null;
  saleDate: string;
  createdAt: string;
  updatedAt: string;
  lead?: { name: string; phone: string };
  seller?: { name: string } | null;
  office?: { name: string } | null;
}

export interface CreateSale {
  leadId: string;
  productId?: string;
  amount: number;
  notes?: string;
  saleDate?: string;
}

export interface SaleFilters {
  dateFrom?: string;
  dateTo?: string;
  sellerId?: string;
  officeId?: string;
  page?: number;
  limit?: number;
}
