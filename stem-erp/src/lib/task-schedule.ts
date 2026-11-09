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
