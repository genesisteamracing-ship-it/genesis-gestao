import { TaskStatus, UserRole } from "@prisma/client";
import {
  deriveMemberStatus,
  isTaskOverdueForMember,
  pickPrimaryActiveTask,
} from "@/lib/office-layout";
import { prisma } from "@/lib/prisma";
import type { AuthenticatedUserDTO } from "@/types/auth";
import type {
  OfficeAttendanceDTO,
  OfficeMemberDTO,
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

function toUtcDateOnly(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

export { deriveMemberStatus, isTaskOverdueForMember, pickPrimaryActiveTask };

export async function getOfficeSnapshotService(
  user: AuthenticatedUserDTO,
  teamId: string,
  teamName: string
): Promise<OfficeSnapshotDTO> {
  const todayIso = getTodayIsoDate();

  const [users, tasks, rawAttendances] = await prisma.$transaction([
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
    prisma.trainingAttendance.findMany({
      where: { teamId },
      select: {
        id: true,
        userId: true,
        date: true,
        checkedAt: true,
        notes: true,
        user: {
          select: {
            name: true,
            deliveryGroup: true,
            jobTitle: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { checkedAt: "desc" }],
    }),
  ]);

  const tasksByMemberId = new Map<string, Map<string, OfficeTaskItemDTO>>();
  for (const member of users) {
    tasksByMemberId.set(member.id, new Map());
  }

  for (const task of tasks) {
    const startDate = task.startDate.toISOString().slice(0, 10);
    const endDate = task.endDate.toISOString().slice(0, 10);
    const isTaskPastDue =
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
      // Regra de negócio: "Em atraso" aparece apenas para quem é Responsável (R),
      // nunca para Informados (I), Consultados (C) ou Autor/Aprovador (A).
      const isOverdue = isTaskPastDue && role === "R";

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
      const aOverdue = isTaskOverdueForMember(a);
      const bOverdue = isTaskOverdueForMember(b);
      if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
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
    const overdueTasksCount = sortedTasks.filter((task) =>
      isTaskOverdueForMember(task)
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

  const attendances: OfficeAttendanceDTO[] = rawAttendances.map((item) => ({
    id: item.id,
    userId: item.userId,
    userName: item.user.name,
    deliveryGroup: item.user.deliveryGroup,
    jobTitle: item.user.jobTitle,
    date: item.date.toISOString().slice(0, 10),
    checkedAt: item.checkedAt.toISOString(),
    notes: item.notes,
  }));

  const hasMarkedAttendanceToday = attendances.some(
    (entry) => entry.userId === user.id && entry.date === todayIso
  );

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
    canMarkAttendance: user.role !== UserRole.AUDITOR,
    hasMarkedAttendanceToday,
    todayIso,
    attendances,
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

export async function markTrainingAttendanceService(
  user: AuthenticatedUserDTO,
  teamId: string,
  notes?: string
): Promise<{ alreadyMarked: boolean }> {
  const todayIso = getTodayIsoDate();
  const dateOnly = toUtcDateOnly(todayIso);
  const cleanNotes = notes?.trim() ? notes.trim().slice(0, 200) : null;

  const existing = await prisma.trainingAttendance.findUnique({
    where: {
      teamId_userId_date: {
        teamId,
        userId: user.id,
        date: dateOnly,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return { alreadyMarked: true };
  }

  await prisma.trainingAttendance.create({
    data: {
      teamId,
      userId: user.id,
      date: dateOnly,
      notes: cleanNotes,
    },
  });

  return { alreadyMarked: false };
}
