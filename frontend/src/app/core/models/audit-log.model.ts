export interface AuditLog {
  id: string;
  companyId: string | null;
  actorId: string | null;
  actorRole: string | null;
  action: string;
  targetId: string | null;
  targetType: string | null;
  ip: string | null;
  metadata: unknown;
  createdAt: string;
  actor?: { name: string } | null;
  company?: { name: string } | null;
}
