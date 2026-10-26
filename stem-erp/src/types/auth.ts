import type { AuthEventType, DeliveryGroup, UserRole } from "@prisma/client";

export interface TeamDTO {
  id: string;
  name: string;
  slug: string;
  schoolOrOrg: string | null;
  isActive: boolean;
  membersCount: number;
  resourcesCount: number;
  transactionsCount: number;
  createdAt: string;
}

export interface AuthenticatedUserDTO {
  id: string;
  sessionId: string;
  name: string;
  email: string;
  role: UserRole;
  teamId: string | null;
  teamName: string | null;
  deliveryGroup: DeliveryGroup | null;
  jobTitle: string | null;
}

export interface TeamMemberDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teamId: string | null;
  teamName: string | null;
  deliveryGroup: DeliveryGroup | null;
  jobTitle: string | null;
  isActive: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  isLocked: boolean;
  lastLoginAt: string | null;
  activeSessionsCount: number;
  createdAt: string;
}

export interface AuthAuditLogDTO {
  id: string;
  userId: string | null;
  userName: string | null;
  emailAttempt: string;
  event: AuthEventType;
  ipAddress: string | null;
  details: string | null;
  createdAt: string;
}

export interface TeamManagementMetricsDTO {
  teams: TeamDTO[];
  members: TeamMemberDTO[];
  auditLogs: AuthAuditLogDTO[];
  stats: {
    totalTeams: number;
    totalMembers: number;
    activeMembers: number;
    activeSessions: number;
    blockedInvasionAttempts: number;
  };
}
