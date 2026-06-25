export interface Company {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompany {
  name: string;
  slug: string;
  subdomain: string;
  status?: string;
  admin: {
    username: string;
    name: string;
    email?: string;
  };
}

/** Respuesta al crear empresa: incluye contraseña temporal del admin (única vez). */
export interface CreateCompanyResponse {
  company: Company;
  tempPassword: string;
}

/** Respuesta al restablecer contraseña del admin de una empresa. */
export interface ResetAdminPasswordResponse {
  tempPassword: string;
}

export interface GlobalMetrics {
  totalCompanies: number;
  activeCompanies: number;
  suspendedCompanies: number;
  leadsLast30Days: number;
  totalSalesAmount: number;
  topCompanies: { id: string; name: string; subdomain: string; leadsLast30Days: number }[];
  inactiveCompanies: { id: string; name: string; subdomain: string; daysSinceLastActivity: number }[];
}

export interface SetupStatus {
  hasOffice: boolean;
  hasProduct: boolean;
  hasSeller: boolean;
  hasWebsiteConfig: boolean;
}

export interface CompanyUser {
  id: string;
  username: string;
  name: string;
  role: string;
  email: string | null;
  createdAt: string;
}
