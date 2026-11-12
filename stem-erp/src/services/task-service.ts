import { Prisma, TaskStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createsCycle, missingLinks, parseTaskDate } from "@/lib/task-schedule";
import type {
  CreateTaskInput,
  DeleteTaskInput,
  EdgeInput,
  EditTaskInput,
  RiskPathInput,
  UpdateMyTaskStatusInput,
} from "@/lib/validations/tasks";
import type { AuthenticatedUserDTO } from "@/types/auth";
import type { TaskPerson, TaskWorkspace } from "@/types/tasks";

type Scope = { teamId: string; actorId: string; canEdit: boolean };
export class TaskError extends Error {}

export async function resolveTaskScope(user: AuthenticatedUserDTO | null): Promise<Scope | null> {
  if (!user?.permissions.tasks || !user.teamId) return null;
  const [team, actor] = await Promise.all([
    prisma.team.findFirst({ where: { id: user.teamId, isActive: true }, select: { id: true } }),
    prisma.user.findFirst({
      where: { id: user.id, isActive: true },
      select: { id: true, teamId: true, role: true, canAccessTasks: true },
    }),
  ]);
  if (!team || !actor) return null;
  if (actor.role !== UserRole.SUPER_ADMIN && (actor.teamId !== team.id || !actor.canAccessTasks)) return null;
  return {
    teamId: team.id,
    actorId: actor.id,
    canEdit: actor.role !== UserRole.AUDITOR && user.role !== UserRole.AUDITOR,
  };
}

function requireWrite(scope: Scope, teamId: string) {
  if (!scope.canEdit) throw new TaskError("Você tem acesso somente para consulta.");
  if (scope.teamId !== teamId) throw new TaskError("A equipe ativa mudou. Recarregue a página.");
}

async function requireActiveEditor(tx: Prisma.TransactionClient, scope: Scope) {
  const [team, actor] = await Promise.all([
    tx.team.findFirst({ where: { id: scope.teamId, isActive: true }, select: { id: true } }),
    tx.user.findFirst({
      where: {
        id: scope.actorId,
        isActive: true,
        OR: [
          { role: UserRole.SUPER_ADMIN },
          { teamId: scope.teamId, role: { not: UserRole.AUDITOR }, canAccessTasks: true },
        ],
      },
      select: { name: true },
    }),
  ]);
  if (!team || !actor) throw new TaskError("Seu acesso à equipe mudou. Recarregue a página.");
  return actor;
}

const memberSelect = { id: true, name: true, isActive: true, teamId: true } as const;
type LiveMember = Prisma.UserGetPayload<{ select: typeof memberSelect }>;

function person(teamId: string, key: string, name: string, live: LiveMember | null, isGlobalAuthor = false): TaskPerson {
  const current = live && (isGlobalAuthor || live.teamId === teamId) ? live : null;
  return { key, name: current?.name ?? name, available: current?.isActive ?? false };
}

export async function getTaskWorkspace({ teamId, actorId, canEdit }: Scope): Promise<TaskWorkspace> {
  const [members, tasks, edges, paths] = await prisma.$transaction([
    prisma.user.findMany({ where: { teamId, isActive: true }, select: memberSelect, orderBy: [{ name: "asc" }, { id: "asc" }] }),
    prisma.task.findMany({
      where: { teamId }, orderBy: [{ startDate: "asc" }, { title: "asc" }, { id: "asc" }],
      include: {
        creator: { select: { ...memberSelect, role: true } },
        assignments: { include: { user: { select: memberSelect } }, orderBy: [{ role: "asc" }, { memberKey: "asc" }] },
      },
    }),
    prisma.taskDependency.findMany({ where: { teamId }, select: { predecessorId: true, successorId: true } }),
    prisma.riskPath.findMany({ where: { teamId }, orderBy: [{ name: "asc" }, { id: "asc" }], include: { steps: { orderBy: { position: "asc" } } } }),
  ], { isolationLevel: "RepeatableRead" });
  return {
    teamId, currentUserId: actorId, canEdit, edges,
    members: members.map((member) => person(teamId, member.id, member.name, member)),
    tasks: tasks.map((task) => ({
      id: task.id, title: task.title, description: task.description, deliveryGroup: task.deliveryGroup,
      startDate: task.startDate.toISOString().slice(0, 10), endDate: task.endDate.toISOString().slice(0, 10),
      status: task.status,
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      cancelledAt: task.cancelledAt ? task.cancelledAt.toISOString() : null,
      revision: task.revision,
      roles: [
        {
          role: "A",
          person: person(
            teamId, task.creatorKey, task.creatorName, task.creator,
            task.creator?.role === UserRole.SUPER_ADMIN,
          ),
        },
        ...task.assignments.map((row) => ({ role: row.role, person: person(teamId, row.memberKey, row.memberName, row.user) })),
      ],
    })),
    paths: paths.map(({ id, name, reason, revision, steps }) => {
      const taskIds = steps.map((step) => step.taskId);
      return { id, name, reason, revision, taskIds, missing: missingLinks(taskIds, edges) };
    }),
  };
}

async function serializable<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(operation, { isolationLevel: "Serializable" });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2034") throw error;
    }
  }
  throw new TaskError("Os dados mudaram ao mesmo tempo. Recarregue e tente novamente.");
}

export async function saveTask(scope: Scope, input: CreateTaskInput | EditTaskInput): Promise<string> {
  requireWrite(scope, input.teamId);
  const { teamId } = scope;
  return serializable(async (tx) => {
    const actor = await requireActiveEditor(tx, scope);
    const startDate = parseTaskDate(input.startDate);
    const endDate = parseTaskDate(input.endDate);
    if (!startDate || !endDate || endDate < startDate) throw new TaskError("Informe um intervalo de datas válido.");
    const fields = {
      title: input.title, description: input.description || null, deliveryGroup: input.deliveryGroup, startDate, endDate,
    };
    let taskId: string;
    if ("id" in input) {
      taskId = input.id;
      const current = await tx.task.findFirst({
        where: { id: taskId, teamId, revision: input.revision },
        select: { status: true },
      });
      if (!current) throw new TaskError("Tarefa não encontrada ou atualizada. Recarregue a página.");
      const { count } = await tx.task.updateMany({
        where: { id: taskId, teamId, revision: input.revision },
        data: {
          ...fields,
          status: input.status,
          ...buildStatusTimestamps(input.status, current.status),
          revision: { increment: 1 },
        },
      });
      if (!count) throw new TaskError("Tarefa não encontrada ou atualizada. Recarregue a página.");
    } else {
      const task = await tx.task.create({
        data: { ...fields, teamId, creatorKey: scope.actorId, creatorName: actor.name, creatorUserId: scope.actorId },
        select: { id: true },
      });
      taskId = task.id;
    }

    const old = await tx.taskAssignment.findMany({ where: { teamId, taskId } });
    const key = (row: { memberKey: string; role: string }) => JSON.stringify([row.memberKey, row.role]);
    const currentKeys = new Set(old.map(key));
    const nextKeys = new Set(input.assignments.map(key));
    const additions = input.assignments.filter((row) => !currentKeys.has(key(row)));
    const people = await tx.user.findMany({
      where: { id: { in: additions.map((row) => row.memberKey) }, teamId, isActive: true },
      select: { id: true, name: true },
    });
    const names = new Map(people.map((row) => [row.id, row.name]));
    const newRows = additions.map((row) => {
      const name = names.get(row.memberKey);
      if (!name) throw new TaskError("Escolha um integrante ativo desta equipe para cada novo papel.");
      return { ...row, teamId, taskId, userId: row.memberKey, memberName: name };
    });
    const removals = old.filter((row) => !nextKeys.has(key(row))).map(({ memberKey, role }) => ({ memberKey, role }));
    if (removals.length) await tx.taskAssignment.deleteMany({ where: { teamId, taskId, OR: removals } });
    if (newRows.length) await tx.taskAssignment.createMany({ data: newRows });
    return taskId;
  });
}

function buildStatusTimestamps(nextStatus: TaskStatus, currentStatus?: TaskStatus) {
  if (nextStatus === TaskStatus.DONE) {
    return {
      completedAt: currentStatus === TaskStatus.DONE ? undefined : new Date(),
      cancelledAt: null,
    };
  }
  if (nextStatus === TaskStatus.CANCELLED) {
    return {
      completedAt: null,
      cancelledAt: currentStatus === TaskStatus.CANCELLED ? undefined : new Date(),
    };
  }
  return { completedAt: null, cancelledAt: null };
}

export async function updateTaskStatus(scope: Scope, input: UpdateMyTaskStatusInput): Promise<void> {
  requireWrite(scope, input.teamId);
  await serializable(async (tx) => {
    await requireActiveEditor(tx, scope);
    const existing = await tx.task.findFirst({
      where: { id: input.taskId, teamId: scope.teamId },
      select: { id: true, status: true, revision: true },
    });
    if (!existing) throw new TaskError("Tarefa não encontrada.");
    if (existing.revision !== input.revision) {
      throw new TaskError("A tarefa foi atualizada por outro integrante. Recarregue para ver a versão atual.");
    }
    const timestamps = buildStatusTimestamps(input.status, existing.status);
    const { count } = await tx.task.updateMany({
      where: { id: input.taskId, teamId: scope.teamId, revision: input.revision },
      data: {
        status: input.status,
        ...timestamps,
        revision: { increment: 1 },
      },
    });
    if (!count) {
      throw new TaskError("A tarefa foi atualizada por outro integrante. Recarregue para ver a versão atual.");
    }
  });
}

export async function deleteTask(scope: Scope, input: DeleteTaskInput): Promise<void> {
  requireWrite(scope, input.teamId);
  await serializable(async (tx) => {
    await requireActiveEditor(tx, scope);
    const { count } = await tx.task.deleteMany({
      where: { id: input.id, teamId: scope.teamId },
    });
    if (!count) throw new TaskError("Tarefa não encontrada.");
  });
}

export async function changeDependency(scope: Scope, input: EdgeInput, add: boolean) {
  requireWrite(scope, input.teamId);
  const { teamId } = scope;
  const { predecessorId, successorId } = input;
  const edge = { teamId, predecessorId, successorId };
  await serializable(async (tx) => {
    await requireActiveEditor(tx, scope);
    if (!add) {
      await tx.taskDependency.deleteMany({ where: edge });
      return;
    }
    const count = await tx.task.count({ where: { teamId, id: { in: [predecessorId, successorId] } } });
    if (count !== 2) throw new TaskError("Escolha duas tarefas diferentes da sua equipe.");
    const edges = await tx.taskDependency.findMany({ where: { teamId } });
    if (edges.some((item) => item.predecessorId === predecessorId && item.successorId === successorId)) {
      throw new TaskError("Esta dependência já existe.");
    }
    if (createsCycle(edges, predecessorId, successorId)) throw new TaskError("Esta dependência criaria um ciclo.");
    await tx.taskDependency.create({ data: edge });
  });
}

export async function saveRiskPath(scope: Scope, input: RiskPathInput) {
  requireWrite(scope, input.teamId);
  const { teamId } = scope;
  await serializable(async (tx) => {
    await requireActiveEditor(tx, scope);
    const count = await tx.task.count({ where: { teamId, id: { in: input.taskIds } } });
    if (input.taskIds.length < 2 || count !== input.taskIds.length) throw new TaskError("Escolha tarefas diferentes da sua equipe.");
    const edges = await tx.taskDependency.findMany({ where: { teamId } });
    if (missingLinks(input.taskIds, edges).length) throw new TaskError("Cada etapa precisa depender diretamente da anterior.");
    const fields = { name: input.name, reason: input.reason };
    let pathId: string;
    if (input.edit) {
      pathId = input.edit.id;
      const { count } = await tx.riskPath.updateMany({
        where: { id: pathId, teamId, revision: input.edit.revision },
        data: { ...fields, revision: { increment: 1 } },
      });
      if (!count) throw new TaskError("Caminho não encontrado ou atualizado. Recarregue a página.");
      await tx.riskPathStep.deleteMany({ where: { teamId, pathId } });
    } else {
      ({ id: pathId } = await tx.riskPath.create({ data: { ...fields, teamId }, select: { id: true } }));
    }
    await tx.riskPathStep.createMany({ data: input.taskIds.map((taskId, position) => ({ teamId, pathId, taskId, position })) });
  });
}
