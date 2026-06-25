export interface Goal {
  id: string;
  companyId: string;
  officeId: string | null;
  userId: string | null;
  year: number;
  month: number;
  targetAmount: string;
  targetSales: number | null;
  createdAt: string;
  updatedAt: string;
  // Campos enriquecidos del backend
  actualAmount?: number;
  actualSales?: number;
  progress?: number | null;
  userName?: string | null;
  officeName?: string | null;
}

export interface CreateGoal {
  officeId?: string;
  userId?: string;
  year: number;
  month: number;
  targetAmount: number;
  targetSales?: number;
}

export interface FollowUp {
  id: string;
  leadId: string;
  sellerId: string;
  channel: string;
  notes: string;
  nextActionAt: string | null;
  createdAt: string;
}

export interface CreateFollowUp {
  channel?: string;
  notes: string;
  nextActionAt?: string;
}
