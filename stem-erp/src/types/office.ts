import type { DeliveryGroup, TaskStatus, UserRole } from "@prisma/client";

export type OfficeMemberStatus = "WORKING" | "OVERDUE" | "IDLE";

export type OfficeTaskRole = "A" | "R" | "C" | "I";

export interface OfficeTaskItemDTO {
  id: string;
  title: string;
  description: string | null;
  deliveryGroup: DeliveryGroup;
  startDate: string;
  endDate: string;
  status: TaskStatus;
  role: OfficeTaskRole;
  isOverdue: boolean;
  revision: number;
}

export interface OfficeMemberDTO {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  role: UserRole;
  deliveryGroup: DeliveryGroup | null;
  status: OfficeMemberStatus;
  activeTask: OfficeTaskItemDTO | null;
  activeTasksCount: number;
  todoTasksCount: number;
  doneTasksCount: number;
  overdueTasksCount: number;
  tasks: OfficeTaskItemDTO[];
  lastLoginAt: string | null;
  isCurrentUser: boolean;
}

export interface OfficeSummaryDTO {
  totalMembers: number;
  workingCount: number;
  overdueCount: number;
  idleCount: number;
  totalInProgressTasks: number;
  totalDoneTasks: number;
}

export interface OfficeAttendanceDTO {
  id: string;
  userId: string;
  userName: string;
  deliveryGroup: DeliveryGroup | null;
  jobTitle: string | null;
  date: string; // YYYY-MM-DD
  checkedAt: string; // ISO
  notes: string | null;
}

export interface OfficeSnapshotDTO {
  teamId: string;
  teamName: string;
  currentUserId: string;
  canAccessTasks: boolean;
  canMarkAttendance?: boolean;
  hasMarkedAttendanceToday?: boolean;
  todayIso?: string;
  attendances?: OfficeAttendanceDTO[];
  generatedAt: string;
  members: OfficeMemberDTO[];
  summary: OfficeSummaryDTO;
}
