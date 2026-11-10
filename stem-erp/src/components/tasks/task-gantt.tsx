"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { Link2, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { tv } from "tailwind-variants";
import { addTaskDependencyAction, removeTaskDependencyAction } from "@/actions/tasks.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import {
  createsCycle,
  dayLabel,
  edgeKey,
  formatTaskDate,
  pathEdges,
  scheduleConflict,
  taskDay,
} from "@/lib/task-schedule";
import { TASK_STATUS_LABELS, type TaskEdge, type TaskRecord, type TaskRisk } from "@/types/tasks";

const ROW_HEIGHT = 54;
const LABEL_WIDTH = 170;

const bar = tv({
  base: "group absolute top-2 z-10 flex h-8 items-center justify-between overflow-visible rounded-md border text-left text-xs font-semibold outline-offset-2 transition-all focus-visible:outline-2",
  variants: {
    status: {
      TODO: "border-border bg-secondary text-secondary-foreground",
      IN_PROGRESS: "border-primary/40 bg-primary/15 text-foreground",
      DONE: "border-success/40 bg-success/15 text-foreground",
    },
    highlighted: { true: "border-primary ring-2 ring-primary" },
    isConnectingSource: { true: "border-primary ring-2 ring-primary shadow-sm" },
    isDropTargetValid: { true: "border-primary ring-2 ring-primary bg-primary/25 shadow-sm" },
    isDropTargetInvalid: { true: "border-destructive ring-2 ring-destructive/80 bg-destructive/15" },
  },
});

type ConnectingState = {
  sourceId: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
};

function calculateBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx >= 20) {
    const midX = x1 + dx / 2;
    return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
  }
  const offset = Math.max(28, Math.abs(dy) * 0.4);
  return `M ${x1} ${y1} C ${x1 + offset} ${y1}, ${x2 - offset} ${y2}, ${x2} ${y2}`;
}

export function TaskGantt({
  visible,
  tasks,
  edges,
  path,
  open,
  teamId,
  canEdit = false,
}: {
  visible: TaskRecord[];
  tasks: TaskRecord[];
  edges: TaskEdge[];
  path?: TaskRisk;
  open: (id: string) => void;
  teamId?: string;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [week, setWeek] = useState(false);
  const [optimistic, setOptimistic] = useState<{ forEdges: TaskEdge[]; list: TaskEdge[] }>({
    forEdges: edges,
    list: edges,
  });
  const [connecting, setConnecting] = useState<ConnectingState | null>(null);
  const [edgeToDelete, setEdgeToDelete] = useState<TaskEdge | null>(null);
  const [isDeletingEdge, setIsDeletingEdge] = useState(false);

  const marker = useId();
  const rowsContainerRef = useRef<HTMLDivElement>(null);

  const currentEdges = optimistic.forEdges === edges ? optimistic.list : edges;
  const byId = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);

  const highlightedTasks = new Set(path?.taskIds);
  const highlightedEdges = new Set(pathEdges(path?.taskIds ?? []).map(edgeKey));

  const view = useMemo(() => {
    const ranges = visible.map((task) => ({ task, start: taskDay(task.startDate), end: taskDay(task.endDate) }));
    const from = ranges.reduce((min, item) => Math.min(min, item.start), ranges[0]?.start ?? 0);
    const last = ranges.reduce((max, item) => Math.max(max, item.end), from);
    const span = Math.max(1, last - from + 1);
    const dayWidth = Math.min(week ? 15 : 44, 160_000 / span);
    const tickStep = (week ? 7 : 1) * Math.max(1, Math.ceil(span / (week ? 1400 : 200)));
    const rows = ranges.map(({ task, start, end }, index) => ({
      task,
      left: (start - from) * dayWidth,
      width: (end - start + 1) * dayWidth,
      y: index * ROW_HEIGHT + 24,
    }));
    return { rows, span, from, dayWidth, tickStep };
  }, [visible, week]);

  const width = view.span * view.dayWidth;
  const rows = useMemo(() => new Map(view.rows.map((row) => [row.task.id, row])), [view.rows]);
  const shown = currentEdges.filter((edge) => rows.has(edge.predecessorId) || rows.has(edge.successorId));

  const conflicts = useMemo(
    () =>
      new Set(
        shown
          .filter((edge) => {
            const predecessor = byId.get(edge.predecessorId);
            const successor = byId.get(edge.successorId);
            return predecessor && successor && scheduleConflict(predecessor.endDate, successor.startDate);
          })
          .map((edge) => edge.successorId)
      ),
    [shown, byId]
  );

  const ticks = Array.from({ length: Math.ceil(view.span / view.tickStep) }, (_, index) => index * view.tickStep);

  const handleAddEdge = useCallback(
    async (predecessorId: string, successorId: string) => {
      if (!teamId || !canEdit) return;
      const sourceTask = byId.get(predecessorId);
      const targetTask = byId.get(successorId);

      setOptimistic((prev) => {
        const base = prev.forEdges === edges ? prev.list : edges;
        return { forEdges: edges, list: [...base, { predecessorId, successorId }] };
      });

      try {
        const res = await addTaskDependencyAction({ teamId, predecessorId, successorId });
        if (res.ok) {
          toast.success(
            `Dependência criada: ${sourceTask?.title ?? "Tarefa"} → ${targetTask?.title ?? "Tarefa"}`
          );
          router.refresh();
        } else {
          setOptimistic({ forEdges: edges, list: edges });
          toast.error(res.message || "Não foi possível criar a dependência.");
        }
      } catch {
        setOptimistic({ forEdges: edges, list: edges });
        toast.error("Ocorreu um erro ao criar a dependência.");
      }
    },
    [teamId, canEdit, byId, edges, router]
  );

  const handleRemoveEdge = useCallback(
    async (edge: TaskEdge) => {
      if (!teamId || !canEdit) return;
      const sourceTask = byId.get(edge.predecessorId);
      const targetTask = byId.get(edge.successorId);

      setOptimistic((prev) => {
        const base = prev.forEdges === edges ? prev.list : edges;
        return {
          forEdges: edges,
          list: base.filter(
            (e) => !(e.predecessorId === edge.predecessorId && e.successorId === edge.successorId)
          ),
        };
      });

      try {
        const res = await removeTaskDependencyAction({ teamId, ...edge });
        if (res.ok) {
          toast.success(
            `Dependência removida: ${sourceTask?.title ?? "Tarefa"} → ${targetTask?.title ?? "Tarefa"}`
          );
          router.refresh();
        } else {
          setOptimistic({ forEdges: edges, list: edges });
          toast.error(res.message || "Não foi possível remover a dependência.");
        }
      } catch {
        setOptimistic({ forEdges: edges, list: edges });
        toast.error("Ocorreu um erro ao remover a dependência.");
      }
    },
    [teamId, canEdit, byId, edges, router]
  );

  const confirmDeleteEdge = async () => {
    if (!edgeToDelete) return;
    setIsDeletingEdge(true);
    await handleRemoveEdge(edgeToDelete);
    setIsDeletingEdge(false);
    setEdgeToDelete(null);
  };

  // Drag and drop pointer listener
  useEffect(() => {
    if (!connecting) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!rowsContainerRef.current) return;
      const rect = rowsContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - LABEL_WIDTH;
      const y = e.clientY - rect.top;

      setConnecting((prev) => {
        if (!prev) return null;
        const moved = Math.hypot(x - prev.startX, y - prev.startY);
        return {
          ...prev,
          currentX: x,
          currentY: y,
          isDragging: prev.isDragging || moved > 6,
        };
      });
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!rowsContainerRef.current) return;
      const rect = rowsContainerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - LABEL_WIDTH;
      const y = e.clientY - rect.top;

      const rowIndex = Math.floor(y / ROW_HEIGHT);
      const candidate = view.rows[rowIndex]?.task;

      setConnecting((prev) => {
        if (!prev) return null;
        const moved = Math.hypot(x - prev.startX, y - prev.startY);

        if (candidate && candidate.id !== prev.sourceId) {
          const alreadyExists = currentEdges.some(
            (edge) => edge.predecessorId === prev.sourceId && edge.successorId === candidate.id
          );
          const hasCycle = createsCycle(currentEdges, prev.sourceId, candidate.id);

          if (!alreadyExists && !hasCycle) {
            void handleAddEdge(prev.sourceId, candidate.id);
            return null;
          } else if (hasCycle) {
            toast.error("Esta dependência não pode ser criada porque causaria um ciclo.");
          } else if (alreadyExists) {
            toast.error("Esta dependência já existe.");
          }
        }

        // If moved very little (click rather than drag), keep click-to-connect active
        if (moved <= 6) {
          return { ...prev, isDragging: false };
        }
        return null;
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setConnecting(null);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [connecting, currentEdges, view.rows, handleAddEdge]);

  // Handle bar clicking in connection mode vs view mode
  const handleTaskBarClick = (taskId: string) => {
    if (connecting) {
      if (taskId === connecting.sourceId) {
        setConnecting(null);
        return;
      }
      const alreadyExists = currentEdges.some(
        (edge) => edge.predecessorId === connecting.sourceId && edge.successorId === taskId
      );
      const hasCycle = createsCycle(currentEdges, connecting.sourceId, taskId);

      if (alreadyExists) {
        toast.error("Esta dependência já existe.");
        return;
      }
      if (hasCycle) {
        toast.error("Esta dependência criaria um ciclo.");
        return;
      }
      void handleAddEdge(connecting.sourceId, taskId);
      setConnecting(null);
      return;
    }
    open(taskId);
  };

  // Active hover evaluation during connecting
  const hoveredRowIndex = connecting ? Math.floor(connecting.currentY / ROW_HEIGHT) : -1;
  const hoveredCandidate =
    connecting && hoveredRowIndex >= 0 && hoveredRowIndex < view.rows.length
      ? view.rows[hoveredRowIndex]?.task
      : null;
  const isHoveredSelf = hoveredCandidate?.id === connecting?.sourceId;
  const isHoveredExisting =
    connecting && hoveredCandidate
      ? currentEdges.some(
          (edge) => edge.predecessorId === connecting.sourceId && edge.successorId === hoveredCandidate.id
        )
      : false;
  const isHoveredCycle =
    connecting && hoveredCandidate && !isHoveredSelf
      ? createsCycle(currentEdges, connecting.sourceId, hoveredCandidate.id)
      : false;
  const isValidTarget = Boolean(
    connecting && hoveredCandidate && !isHoveredSelf && !isHoveredExisting && !isHoveredCycle
  );

  const activeSourceTask = connecting ? byId.get(connecting.sourceId) : null;
  const targetRow = hoveredCandidate ? rows.get(hoveredCandidate.id) : null;

  const connectingEndX = isValidTarget && targetRow ? targetRow.left : connecting?.currentX ?? 0;
  const connectingEndY = isValidTarget && targetRow ? targetRow.y : connecting?.currentY ?? 0;

  const edgeToDeleteSource = edgeToDelete ? byId.get(edgeToDelete.predecessorId) : null;
  const edgeToDeleteTarget = edgeToDelete ? byId.get(edgeToDelete.successorId) : null;

  return (
    <section aria-label="Cronograma de Gantt" className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={week ? "outline" : "default"}
            aria-pressed={!week}
            onClick={() => setWeek(false)}
          >
            Dias
          </Button>
          <Button
            size="sm"
            variant={week ? "default" : "outline"}
            aria-pressed={week}
            onClick={() => setWeek(true)}
          >
            Semanas
          </Button>
          {path && <span className="text-sm font-medium text-primary">Caminho em destaque · {path.name}</span>}
        </div>
        {canEdit && (
          <p className="hidden text-xs text-muted-foreground sm:block">
            Arraste ou clique no ponto ao final da barra para conectar dependências.
          </p>
        )}
      </div>

      {activeSourceTask && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-xs sm:text-sm font-medium text-foreground">
          <div className="flex items-center gap-2 min-w-0">
            <Link2 className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">
              Conectando: <strong>{activeSourceTask.title}</strong>
              {hoveredCandidate && !isHoveredSelf ? (
                <>
                  {" "}→{" "}
                  <strong className={isValidTarget ? "text-primary" : "text-destructive"}>
                    {hoveredCandidate.title}
                  </strong>
                  {!isValidTarget && (
                    <span className="ml-1 text-xs text-destructive font-normal">
                      ({isHoveredCycle ? "Criaria ciclo de dependências" : "Já conectada"})
                    </span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground font-normal">
                  {" "}— arraste até outra tarefa ou clique nela para conectar
                </span>
              )}
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => setConnecting(null)}
          >
            Cancelar (Esc)
          </Button>
        </div>
      )}

      <div
        className="max-h-[65vh] overflow-auto rounded-xl border border-border bg-card"
        tabIndex={0}
        aria-label="Linha do tempo rolável"
      >
        <div style={{ width: LABEL_WIDTH + width }}>
          <div className="sticky top-0 z-30 flex h-10 border-b border-border bg-card text-xs font-semibold">
            <div
              className="sticky left-0 z-10 shrink-0 border-r border-border bg-card p-2"
              style={{ width: LABEL_WIDTH }}
            >
              Tarefa / setor
            </div>
            <div className="relative flex-1">
              {ticks.map((offset) => (
                <span
                  key={offset}
                  className="absolute h-full whitespace-nowrap border-l border-border px-1 py-2"
                  style={{ left: offset * view.dayWidth }}
                >
                  {formatTaskDate(dayLabel(view.from + offset)).slice(0, 5)}
                </span>
              ))}
            </div>
          </div>

          <div ref={rowsContainerRef} className="relative">
            {view.rows.map(({ task, left, width: duration, y }) => {
              const isSource = connecting?.sourceId === task.id;
              const isTargetCandidate = Boolean(connecting && !isSource && hoveredCandidate?.id === task.id);
              const barWidth = Math.max(28, duration);

              return (
                <div
                  key={task.id}
                  className="flex border-b border-border last:border-b-0"
                  style={{ height: ROW_HEIGHT }}
                >
                  <button
                    type="button"
                    className="sticky left-0 z-20 shrink-0 truncate border-r border-border bg-card px-2 text-left text-xs focus-visible:outline-2"
                    onClick={() => handleTaskBarClick(task.id)}
                    style={{ width: LABEL_WIDTH }}
                  >
                    <span className="block truncate font-semibold">{task.title}</span>
                    <span className="block truncate text-muted-foreground">
                      {DELIVERY_GROUP_LABELS[task.deliveryGroup]}
                    </span>
                    {conflicts.has(task.id) && (
                      <span className="block truncate font-medium text-destructive">Conflito de datas</span>
                    )}
                  </button>

                  <div
                    className="relative flex-1"
                    style={{
                      backgroundImage: "linear-gradient(to right, var(--border) 1px, transparent 1px)",
                      backgroundSize: view.dayWidth * view.tickStep + "px 100%",
                    }}
                  >
                    <div
                      className={bar({
                        status: task.status,
                        highlighted: highlightedTasks.has(task.id),
                        isConnectingSource: isSource,
                        isDropTargetValid: Boolean(isTargetCandidate && isValidTarget),
                        isDropTargetInvalid: Boolean(isTargetCandidate && !isValidTarget),
                      })}
                      style={{ left, width: barWidth }}
                    >
                      {/* Target Snap Anchor (Left) */}
                      {connecting && !isSource && (
                        <div
                          className={`pointer-events-none absolute -left-2 top-1/2 -translate-y-1/2 z-20 flex h-4 w-4 items-center justify-center rounded-full border bg-card transition-all ${
                            isTargetCandidate
                              ? isValidTarget
                                ? "scale-125 border-primary bg-primary text-primary-foreground"
                                : "scale-125 border-destructive bg-destructive text-destructive-foreground"
                              : "border-primary/50 text-muted-foreground"
                          }`}
                        >
                          <div
                            className={`h-1.5 w-1.5 rounded-full ${
                              isTargetCandidate
                                ? isValidTarget
                                  ? "bg-primary-foreground"
                                  : "bg-destructive-foreground"
                                : "bg-primary"
                            }`}
                          />
                        </div>
                      )}

                      {/* Main Bar Button */}
                      <button
                        type="button"
                        className="h-full flex-1 truncate px-1.5 text-left focus-visible:outline-none"
                        onClick={() => handleTaskBarClick(task.id)}
                        aria-label={
                          task.title +
                          " · " +
                          formatTaskDate(task.startDate) +
                          " até " +
                          formatTaskDate(task.endDate) +
                          " · " +
                          TASK_STATUS_LABELS[task.status] +
                          (highlightedTasks.has(task.id) ? " · Em destaque" : "")
                        }
                        title={
                          formatTaskDate(task.startDate) +
                          " — " +
                          formatTaskDate(task.endDate) +
                          " · " +
                          TASK_STATUS_LABELS[task.status]
                        }
                      >
                        {highlightedTasks.has(task.id) && "★ "}
                        {TASK_STATUS_LABELS[task.status]}
                      </button>

                      {/* Source Drag Connector Handle (Right) */}
                      {canEdit && (
                        <div
                          role="button"
                          tabIndex={0}
                          aria-label={`Conectar dependência a partir de ${task.title}`}
                          title="Conectar dependência: arraste até outra tarefa ou clique para conectar"
                          onPointerDown={(e) => {
                            if (e.button !== 0) return;
                            e.preventDefault();
                            e.stopPropagation();
                            setConnecting({
                              sourceId: task.id,
                              startX: left + barWidth,
                              startY: y,
                              currentX: left + barWidth,
                              currentY: y,
                              isDragging: false,
                            });
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (connecting?.sourceId === task.id) {
                              setConnecting(null);
                            } else {
                              setConnecting({
                                sourceId: task.id,
                                startX: left + barWidth,
                                startY: y,
                                currentX: left + barWidth,
                                currentY: y,
                                isDragging: false,
                              });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              e.stopPropagation();
                              setConnecting({
                                sourceId: task.id,
                                startX: left + barWidth,
                                startY: y,
                                currentX: left + barWidth,
                                currentY: y,
                                isDragging: false,
                              });
                            }
                          }}
                          className={`absolute -right-2 top-1/2 -translate-y-1/2 z-20 flex h-5 w-5 items-center justify-center rounded-full border-2 border-primary bg-card shadow-xs transition-transform hover:scale-125 focus:scale-125 cursor-crosshair ${
                            isSource
                              ? "scale-125 opacity-100 ring-2 ring-primary/60"
                              : "opacity-80 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                          }`}
                        >
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* SVG Layer for Edges and Active Connecting Line */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute top-0 z-10 overflow-visible text-muted-foreground"
              style={{ left: LABEL_WIDTH }}
              width={width}
              height={view.rows.length * ROW_HEIGHT}
            >
              <defs>
                <marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
                  <path d="M0 0 L6 3 L0 6 Z" fill="context-stroke" />
                </marker>
                <marker id={marker + "-primary"} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
                  <path d="M0 0 L6 3 L0 6 Z" fill="var(--primary)" />
                </marker>
                <marker id={marker + "-destructive"} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
                  <path d="M0 0 L6 3 L0 6 Z" fill="var(--destructive)" />
                </marker>
              </defs>

              {/* Render Existing Edges */}
              {shown.map((edge) => {
                const source = rows.get(edge.predecessorId);
                const target = rows.get(edge.successorId);
                if (!source || !target) return null;
                const key = edgeKey(edge);
                const x = source.left + source.width;
                const approach = target.left - 8;
                const highlight = highlightedEdges.has(key);
                const conflict = scheduleConflict(source.task.endDate, target.task.startDate);
                const segments =
                  approach >= x + 8
                    ? ["H", approach, "V", target.y]
                    : ["H", x + 8, "V", target.y - 15, "H", approach, "V", target.y];
                const pathD = ["M", x, source.y, ...segments, "H", target.left].join(" ");

                return (
                  <g key={key} className="group/edge">
                    {/* Interactive hit area to select/remove edge */}
                    {canEdit && (
                      <path
                        d={pathD}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={14}
                        className="pointer-events-auto cursor-pointer"
                        onClick={() => setEdgeToDelete(edge)}
                      >
                        <title>{`Clique para remover dependência: ${source.task.title} → ${target.task.title}`}</title>
                      </path>
                    )}
                    <path
                      d={pathD}
                      className={
                        highlight
                          ? "text-primary"
                          : conflict
                            ? "text-destructive"
                            : "text-muted-foreground group-hover/edge:text-primary transition-colors"
                      }
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={highlight ? 3 : 1.5}
                      strokeDasharray={conflict ? "4 3" : undefined}
                      markerEnd={"url(#" + marker + ")"}
                    />
                  </g>
                );
              })}

              {/* Render Active Temporary Connecting Line */}
              {connecting && (
                <path
                  d={calculateBezierPath(connecting.startX, connecting.startY, connectingEndX, connectingEndY)}
                  className={isValidTarget || !hoveredCandidate ? "text-primary" : "text-destructive"}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  markerEnd={
                    "url(#" + (isValidTarget || !hoveredCandidate ? marker + "-primary" : marker + "-destructive") + ")"
                  }
                />
              )}
            </svg>
          </div>
        </div>
      </div>

      {/* Dependencies List with Quick Remove Action */}
      {shown.length > 0 && (
        <details className="rounded-lg border border-border bg-card p-3 text-sm">
          <summary className="cursor-pointer font-medium">Dependências ({shown.length})</summary>
          <ul className="mt-2 divide-y divide-border">
            {shown.map((edge) => {
              const a = byId.get(edge.predecessorId);
              const b = byId.get(edge.successorId);
              if (!a || !b) return null;
              const external = !rows.has(a.id) || !rows.has(b.id);
              const conflict = scheduleConflict(a.endDate, b.startDate);

              return (
                <li key={edgeKey(edge)} className="flex items-center justify-between gap-2 py-1.5 first:pt-0 last:pb-0">
                  <span className="truncate text-xs sm:text-sm">
                    <strong>{a.title}</strong> ({DELIVERY_GROUP_LABELS[a.deliveryGroup]}) →{" "}
                    <strong>{b.title}</strong> ({DELIVERY_GROUP_LABELS[b.deliveryGroup]})
                    {external && " · Fora do filtro"}
                    {conflict && <span className="ml-1 text-destructive font-medium">· Conflito de datas</span>}
                    {highlightedEdges.has(edgeKey(edge)) && (
                      <span className="ml-1 text-primary font-medium">· Em destaque</span>
                    )}
                  </span>
                  {canEdit && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                      onClick={() => setEdgeToDelete(edge)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Remover
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {/* Confirmation Dialog to Remove Dependency */}
      <Dialog open={Boolean(edgeToDelete)} onOpenChange={(isOpen) => !isOpen && setEdgeToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remover dependência?</DialogTitle>
            <DialogDescription>
              A dependência entre <strong>{edgeToDeleteSource?.title ?? "Tarefa"}</strong> e{" "}
              <strong>{edgeToDeleteTarget?.title ?? "Tarefa"}</strong> será desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeletingEdge}
              onClick={() => setEdgeToDelete(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeletingEdge}
              onClick={confirmDeleteEdge}
              className="text-xs gap-1.5"
            >
              {isDeletingEdge && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Remover dependência</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
