import type { TaskEdge } from "@/types/tasks";

const DAY_MS = 86_400_000;

export function parseTaskDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith("0000-")) return null;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date : null;
}

export function taskDay(value: string): number {
  const date = parseTaskDate(value);
  if (!date) throw new Error("Data de tarefa inválida.");
  return date.getTime() / DAY_MS;
}

export function dayLabel(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}

export function formatTaskDate(date: string): string {
  const [year, month, day] = date.split("-");
  return [day, month, year].join("/");
}

export function scheduleConflict(end: string, start: string): boolean {
  return start <= end;
}

export function createsCycle(edges: TaskEdge[], predecessorId: string, successorId: string): boolean {
  const adjacency = new Map<string, string[]>();
  for (const edge of edges) {
    const neighbors = adjacency.get(edge.predecessorId) ?? [];
    neighbors.push(edge.successorId);
    adjacency.set(edge.predecessorId, neighbors);
  }
  const pending = [successorId];
  const seen = new Set<string>();
  while (pending.length) {
    const current = pending.pop()!;
    if (current === predecessorId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    pending.push(...(adjacency.get(current) ?? []));
  }
  return false;
}

export function edgeKey(edge: TaskEdge): string {
  return JSON.stringify([edge.predecessorId, edge.successorId]);
}

export function pathEdges(taskIds: string[]): TaskEdge[] {
  return taskIds.slice(1).map((successorId, index) => ({ predecessorId: taskIds[index], successorId }));
}

export function missingLinks(taskIds: string[], edges: TaskEdge[]): TaskEdge[] {
  const existing = new Set(edges.map(edgeKey));
  return pathEdges(taskIds).filter((edge) => !existing.has(edgeKey(edge)));
}

export type ResizeTaskEdge = "start" | "end";

export function resizeTaskDates({
  startDate,
  endDate,
  edge,
  deltaDays,
}: {
  startDate: string;
  endDate: string;
  edge: ResizeTaskEdge;
  deltaDays: number;
}): { startDate: string; endDate: string } {
  const start = taskDay(startDate);
  const end = taskDay(endDate);
  if (edge === "start") {
    const nextStart = Math.min(start + deltaDays, end);
    return { startDate: dayLabel(nextStart), endDate };
  }
  const nextEnd = Math.max(end + deltaDays, start);
  return { startDate, endDate: dayLabel(nextEnd) };
}

export function reorderItems<T extends { id: string }>(
  items: readonly T[],
  sourceId: string,
  targetIndex: number,
): T[] {
  const fromIndex = items.findIndex((item) => item.id === sourceId);
  if (fromIndex === -1 || items.length < 2) return [...items];
  const clampedTarget = Math.max(0, Math.min(items.length - 1, targetIndex));
  if (fromIndex === clampedTarget) return [...items];
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(clampedTarget, 0, moved);
  return next;
}
