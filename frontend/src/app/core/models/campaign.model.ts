export interface MessageTemplate {
  id: string;
  name: string;
  body: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateTemplate {
  name: string;
  body: string;
  isActive?: boolean;
}

export interface CampaignRecipient {
  id: string;
  name: string;
  phone: string;
  waLink: string;
}

export interface Campaign {
  id: string;
  name: string;
  message: string;
  status: string;
  sentAt: string | null;
  createdAt: string;
  recipientCount?: number;
  recipients?: CampaignRecipient[];
}

export interface CreateCampaign {
  name: string;
  templateId?: string;
  message?: string;
  recipientLeadIds: string[];
}

export type ReactivationType =
  | 'PLAN_RENEWAL'
  | 'EQUIPMENT_UPGRADE'
  | 'ANNIVERSARY'
  | 'DORMANT_BUYER';

export interface ReactivationSuggestion {
  leadId: string;
  name: string;
  phone: string;
  context: string;
}

export interface ReactivationResult {
  type: ReactivationType;
  suggestedMessage: string;
  leads: ReactivationSuggestion[];
}
