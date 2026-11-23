import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AuthenticatedUserDTO } from "@/types/auth";
import type {
  OfficeMemberDTO,
  OfficeMemberStatus,
  OfficeSnapshotDTO,
  OfficeTaskItemDTO,
  OfficeTaskRole,
} from "@/types/office";

const ROLE_PRIORITY: Record<OfficeTaskRole, number> = {
  R: 0,
  A: 1,
  C: 2,
  I: 3,
};

const STATUS_PRIORITY: Record<TaskStatus, number> = {
  IN_PROGRESS: 0,
  TODO: 1,
  DONE: 2,
  CANCELLED: 3,
};

function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function deriveMemberStatus(
  tasks: OfficeTaskItemDTO[]
): OfficeMemberStatus {
  const inProgressTasks = tasks.filter(
    (task) => task.status === TaskStatus.IN_PROGRESS
  );
  if (inProgressTasks.some((task) => task.isOverdue)) {
    return "OVERDUE";
  }
  if (inProgressTasks.length > 0) {
    return "WORKING";
  }
  return "IDLE";
}

export function pickPrimaryActiveTask(
  tasks: OfficeTaskItemDTO[]
): OfficeTaskItemDTO | null {
  const inProgress = tasks.filter(
    (task) => task.status === TaskStatus.IN_PROGRESS
  );
  if (inProgress.length === 0) return null;

  const sorted = [...inProgress].sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
    if (ROLE_PRIORITY[a.role] !== ROLE_PRIORITY[b.role]) {
      return ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
    }
    return a.endDate.localeCompare(b.endDate);
  });

  return sorted[0] ?? null;
}

export async function getOfficeSnapshotService(
  user: AuthenticatedUserDTO,
  teamId: string,
  teamName: string
): Promise<OfficeSnapshotDTO> {
  const todayIso = getTodayIsoDate();

  const [users, tasks] = await prisma.$transaction([
    prisma.user.findMany({
      where: { teamId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        role: true,
        deliveryGroup: true,
        lastLoginAt: true,
      },
      orderBy: [{ deliveryGroup: "asc" }, { name: "asc" }],
    }),
    prisma.task.findMany({
      where: {
        teamId,
        status: { not: TaskStatus.CANCELLED },
      },
      select: {
        id: true,
        title: true,
        description: true,
        deliveryGroup: true,
        startDate: true,
        endDate: true,
        status: true,
        revision: true,
        creatorUserId: true,
        creatorKey: true,
        assignments: {
          select: {
            userId: true,
            memberKey: true,
            role: true,
          },
        },
      },
      orderBy: [{ sortOrder: "asc" }, { endDate: "asc" }, { title: "asc" }],
    }),
  ]);

  const tasksByMemberId = new Map<string, Map<string, OfficeTaskItemDTO>>();
  for (const member of users) {
    tasksByMemberId.set(member.id, new Map());
  }

  for (const task of tasks) {
    const startDate = task.startDate.toISOString().slice(0, 10);
    const endDate = task.endDate.toISOString().slice(0, 10);
    const isOverdue =
      (task.status === TaskStatus.IN_PROGRESS ||
        task.status === TaskStatus.TODO) &&
      endDate < todayIso;

    const addTaskForMember = (memberId: string, role: OfficeTaskRole) => {
      const bucket = tasksByMemberId.get(memberId);
      if (!bucket) return;
      const existing = bucket.get(task.id);
      if (existing && ROLE_PRIORITY[existing.role] <= ROLE_PRIORITY[role]) {
        return;
      }
      bucket.set(task.id, {
        id: task.id,
        title: task.title,
        description: task.description,
        deliveryGroup: task.deliveryGroup,
        startDate,
        endDate,
        status: task.status,
        role,
        isOverdue,
        revision: task.revision,
      });
    };

    for (const assignment of task.assignments) {
      const targetId = assignment.userId ?? assignment.memberKey;
      if (targetId) {
        addTaskForMember(targetId, assignment.role);
      }
    }

    const authorId = task.creatorUserId ?? task.creatorKey;
    if (authorId) {
      addTaskForMember(authorId, "A");
    }
  }

  const members: OfficeMemberDTO[] = users.map((member) => {
    const rawTasks = Array.from(tasksByMemberId.get(member.id)?.values() ?? []);
    const sortedTasks = rawTasks.sort((a, b) => {
      if (STATUS_PRIORITY[a.status] !== STATUS_PRIORITY[b.status]) {
        return STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
      }
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      if (ROLE_PRIORITY[a.role] !== ROLE_PRIORITY[b.role]) {
        return ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
      }
      return a.endDate.localeCompare(b.endDate);
    });

    const activeTasksCount = sortedTasks.filter(
      (task) => task.status === TaskStatus.IN_PROGRESS
    ).length;
    const todoTasksCount = sortedTasks.filter(
      (task) => task.status === TaskStatus.TODO
    ).length;
    const doneTasksCount = sortedTasks.filter(
      (task) => task.status === TaskStatus.DONE
    ).length;
    const overdueTasksCount = sortedTasks.filter(
      (task) => task.isOverdue
    ).length;

    return {
      id: member.id,
      name: member.name,
      email: member.email,
      jobTitle: member.jobTitle,
      role: member.role,
      deliveryGroup: member.deliveryGroup,
      status: deriveMemberStatus(sortedTasks),
      activeTask: pickPrimaryActiveTask(sortedTasks),
      activeTasksCount,
      todoTasksCount,
      doneTasksCount,
      overdueTasksCount,
      tasks: sortedTasks,
      lastLoginAt: member.lastLoginAt ? member.lastLoginAt.toISOString() : null,
      isCurrentUser: member.id === user.id,
    };
  });

  const workingCount = members.filter(
    (member) => member.status === "WORKING"
  ).length;
  const overdueCount = members.filter(
    (member) => member.status === "OVERDUE"
  ).length;
  const idleCount = members.filter((member) => member.status === "IDLE").length;

  const totalInProgressTasks = tasks.filter(
    (task) => task.status === TaskStatus.IN_PROGRESS
  ).length;
  const totalDoneTasks = tasks.filter(
    (task) => task.status === TaskStatus.DONE
  ).length;

  return {
    teamId,
    teamName,
    currentUserId: user.id,
    canAccessTasks: Boolean(user.permissions.tasks),
    generatedAt: new Date().toISOString(),
    members,
    summary: {
      totalMembers: members.length,
      workingCount,
      overdueCount,
      idleCount,
      totalInProgressTasks,
      totalDoneTasks,
    },
  };
}
