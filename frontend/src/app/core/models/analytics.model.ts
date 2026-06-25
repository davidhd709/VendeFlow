export interface StatusCount {
  status: string;
  count: number;
}

export interface CompanyMetrics {
  period: { year: number; month: number };
  revenueThisMonth: number;
  goalThisMonth: number;
  goalProgress: number | null;
  newLeadsThisMonth: number;
  totalLeads: number;
  soldLeads: number;
  conversionRate: number;
  leadStatusDistribution: StatusCount[];
  revenueByOffice: { officeId: string; officeName: string; revenue: number }[];
  revenueBySeller: { sellerId: string; sellerName: string; revenue: number }[];
  topProducts: { productId: string; name: string; requests: number }[];
}

export interface SellerMetrics {
  period: { year: number; month: number };
  sellerId: string;
  name?: string;
  revenueThisMonth: number;
  personalGoal: number;
  goalProgress: number | null;
  totalLeads: number;
  soldLeads: number;
  conversionRate: number;
  leadsByStatus: StatusCount[];
  leadsToContact?: number;
}

export interface StaleLead {
  id: string;
  name: string;
  phone: string;
  status: string;
  lastContactedAt: string | null;
  sellerId: string | null;
}

export interface CoordinatorMetrics {
  sellers: SellerMetrics[];
  staleLeads: StaleLead[];
  overdueTasks: number;
}
