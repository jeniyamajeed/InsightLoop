export interface AuthUser {
  id: number;
  email: string;
  roles: string[];
  permissions: string[];
}
export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}
export interface Commitment {
  id: number;
  customerName: string;
  commitmentType: string;
  description: string;
  ownerUserId?: number;
  dueAt: string;
  status: string;
  createdAt: string;
  validationSentAt?: string;
  validationRespondedAt?: string;
  customerResolvedResponse?: boolean;
  customerResponseComment?: string;
  linkedEscalationId?: number;
}
export interface AuditEvent { id: number; commitmentId: number; event: string; detail: string; at: string; }
export interface Interaction {
  id: number;
  customerName: string;
  channel: string;
  summary: string;
  agentUserId?: number;
  csatScore?: number;
  csatComment?: string;
  createdAt: string;
  feedbackAt?: string;
}
export interface Escalation {
  id: number;
  commitmentId: number;
  customerName: string;
  summary: string;
  priority: string;
  slaHours: number;
  status: string;
  assigneeUserId?: number;
  createdAt: string;
  closedAt?: string;
}
export interface DashboardSummary {
  csatImmediate: number;
  actualResolutionConfirmed: number;
  resolutionGap: number;
  commitmentsDueToday: number;
  overdueCommitments: number;
  openEscalations: number;
}
