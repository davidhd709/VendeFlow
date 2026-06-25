import { LeadStatus } from '../constants/lead-statuses';

export const DOCUMENT_TYPES = ['CC', 'CE', 'NIT', 'Pasaporte', 'TI', 'Otro'] as const;

export interface Lead {
  id: string;
  companyId: string;
  officeId: string;
  sellerId: string | null;
  name: string;
  phone: string;
  email: string | null;
  status: LeadStatus;
  source: string | null;
  notes: string | null;
  documentType: string | null;
  documentNumber: string | null;
  activationDate: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
  office?: { name: string };
  seller?: { name: string } | null;
}

export interface CreateLead {
  name: string;
  phone: string;
  email?: string;
  officeId?: string;
  sellerId?: string;
  notes?: string;
  source?: string;
  documentType?: string;
  documentNumber?: string;
  activationDate?: string;
  productIds?: string[];
}

export interface ImportLeadRow {
  name: string;
  phone: string;
  documentType?: string;
  documentNumber?: string;
  officeName?: string;
  activationDate?: string;
  /** Nombre del vendedor en el Excel; el backend lo resuelve a sellerId. */
  sellerName?: string;
  /** 'planes' | 'reposiciones' | 'excel' */
  source?: string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export interface LeadFilters {
  status?: LeadStatus | null;
  officeId?: string | null;
  sellerId?: string | null;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface LeadComment {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string };
}

export interface LeadStatusHistoryEntry {
  id: string;
  fromState: string | null;
  toState: string;
  changedBy: string;
  changedByName: string | null;
  createdAt: string;
}
