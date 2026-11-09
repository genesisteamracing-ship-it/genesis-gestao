import { useId, useMemo, useState } from "react";
import { tv } from "tailwind-variants";
import { Button } from "@/components/ui/button";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { dayLabel, edgeKey, formatTaskDate, pathEdges, scheduleConflict, taskDay } from "@/lib/task-schedule";
import { TASK_STATUS_LABELS, type TaskRecord, type TaskEdge, type TaskRisk } from "@/types/tasks";

const ROW_HEIGHT = 54;
const LABEL_WIDTH = 170;
const bar = tv({
  base: "absolute top-2 z-10 h-8 overflow-hidden rounded-md border px-1 text-left text-xs font-semibold outline-offset-2 focus-visible:outline-2",
  variants: {
    status: {
      TODO: "border-border bg-secondary text-secondary-foreground",
      IN_PROGRESS: "border-primary/40 bg-primary/15 text-foreground",
      DONE: "border-success/40 bg-success/15 text-foreground",
    },
    highlighted: { true: "border-primary ring-2 ring-primary" },
  },
});

export function TaskGantt({ visible, tasks, edges, path, open }: {
  visible: TaskRecord[]; tasks: TaskRecord[]; edges: TaskEdge[]; path?: TaskRisk; open: (id: string) => void;
}) {
  const [week, setWeek] = useState(false);
  const marker = useId();
  const highlightedTasks = new Set(path?.taskIds);
  const highlightedEdges = new Set(pathEdges(path?.taskIds ?? []).map(edgeKey));
  const view = useMemo(() => {
    const ranges = visible.map((task) => ({ task, start: taskDay(task.startDate), end: taskDay(task.endDate) }));
    const from = ranges.reduce((min, item) => Math.min(min, item.start), ranges[0]?.start ?? 0);
    const last = ranges.reduce((max, item) => Math.max(max, item.end), from);
    const span = last - from + 1;
    const dayWidth = Math.min(week ? 15 : 44, 160_000 / span);
    const tickStep = (week ? 7 : 1) * Math.max(1, Math.ceil(span / (week ? 1400 : 200)));
    const rows = ranges.map(({ task, start, end }, index) => ({
      task, left: (start - from) * dayWidth, width: (end - start + 1) * dayWidth, y: index * ROW_HEIGHT + 24,
    }));
    return { rows, span, from, dayWidth, tickStep };
  }, [visible, week]);
  const width = view.span * view.dayWidth;
  const rows = new Map(view.rows.map((row) => [row.task.id, row]));
  const byId = new Map(tasks.map((task) => [task.id, task]));
  const shown = edges.filter((edge) => rows.has(edge.predecessorId) || rows.has(edge.successorId));
  const conflicts = new Set(shown.filter((edge) => {
    const predecessor = byId.get(edge.predecessorId);
    const successor = byId.get(edge.successorId);
    return predecessor && successor && scheduleConflict(predecessor.endDate, successor.startDate);
  }).map((edge) => edge.successorId));
  const ticks = Array.from({ length: Math.ceil(view.span / view.tickStep) }, (_, index) => index * view.tickStep);

  return <section aria-label="Cronograma de Gantt" className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant={week ? "outline" : "default"} aria-pressed={!week} onClick={() => setWeek(false)}>Dias</Button>
      <Button size="sm" variant={week ? "default" : "outline"} aria-pressed={week} onClick={() => setWeek(true)}>Semanas</Button>
      {path && <span className="text-sm font-medium text-primary">Caminho em destaque · {path.name}</span>}
    </div>
    <div className="max-h-[65vh] overflow-auto rounded-xl border border-border bg-card" tabIndex={0} aria-label="Linha do tempo rolável">
      <div style={{ width: LABEL_WIDTH + width }}>
        <div className="sticky top-0 z-30 flex h-10 border-b border-border bg-card text-xs font-semibold">
          <div className="sticky left-0 z-10 shrink-0 border-r border-border bg-card p-2" style={{ width: LABEL_WIDTH }}>Tarefa / setor</div>
          <div className="relative flex-1">{ticks.map((offset) => <span key={offset} className="absolute h-full whitespace-nowrap border-l border-border px-1 py-2"
            style={{ left: offset * view.dayWidth }}>{formatTaskDate(dayLabel(view.from + offset)).slice(0, 5)}</span>)}</div>
        </div>
        <div className="relative">
          {view.rows.map(({ task, left, width: duration }) => (
            <div key={task.id} className="flex border-b border-border last:border-b-0" style={{ height: ROW_HEIGHT }}>
              <button type="button" className="sticky left-0 z-20 shrink-0 truncate border-r border-border bg-card px-2 text-left text-xs focus-visible:outline-2"
                onClick={() => open(task.id)} style={{ width: LABEL_WIDTH }}>
                <span className="block truncate font-semibold">{task.title}</span>
                <span className="block truncate text-muted-foreground">{DELIVERY_GROUP_LABELS[task.deliveryGroup]}</span>
                {conflicts.has(task.id) && <span className="block truncate font-medium text-destructive">Conflito de datas</span>}
              </button>
              <div className="relative flex-1" style={{
                backgroundImage: "linear-gradient(to right, var(--border) 1px, transparent 1px)",
                backgroundSize: (view.dayWidth * view.tickStep) + "px 100%",
              }}>
                <button type="button" className={bar({ status: task.status, highlighted: highlightedTasks.has(task.id) })}
                  style={{ left, width: Math.max(5, duration) }} onClick={() => open(task.id)}
                  aria-label={task.title + " · " + formatTaskDate(task.startDate) + " até " + formatTaskDate(task.endDate) + " · " + TASK_STATUS_LABELS[task.status] + (highlightedTasks.has(task.id) ? " · Em destaque" : "")}
                  title={formatTaskDate(task.startDate) + " — " + formatTaskDate(task.endDate) + " · " + TASK_STATUS_LABELS[task.status]}>
                  {highlightedTasks.has(task.id) && "★ "}{TASK_STATUS_LABELS[task.status]}
                </button>
              </div>
            </div>
          ))}
          <svg aria-hidden="true" className="pointer-events-none absolute top-0 z-10 overflow-visible text-muted-foreground"
            style={{ left: LABEL_WIDTH }} width={width} height={view.rows.length * ROW_HEIGHT}>
            <defs><marker id={marker} markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
              <path d="M0 0 L6 3 L0 6 Z" fill="context-stroke" />
            </marker></defs>
            {shown.map((edge) => {
              const source = rows.get(edge.predecessorId);
              const target = rows.get(edge.successorId);
              if (!source || !target) return null;
              const key = edgeKey(edge);
              const x = source.left + source.width;
              const approach = target.left - 8;
              const highlight = highlightedEdges.has(key);
              const conflict = scheduleConflict(source.task.endDate, target.task.startDate);
              const segments = approach >= x + 8
                ? ["H", approach, "V", target.y]
                : ["H", x + 8, "V", target.y - 15, "H", approach, "V", target.y];
              return <path key={key} d={["M", x, source.y, ...segments, "H", target.left].join(" ")}
                className={highlight ? "text-primary" : conflict ? "text-destructive" : undefined}
                fill="none" stroke="currentColor" strokeWidth={highlight ? 3 : 1.5} strokeDasharray={conflict ? "4 3" : undefined}
                markerEnd={"url(#" + marker + ")"} />;
            })}
          </svg>
        </div>
      </div>
    </div>
    {shown.length > 0 && <details className="rounded-lg border border-border bg-card p-3 text-sm">
      <summary className="cursor-pointer font-medium">Dependências ({shown.length})</summary>
      <ul className="mt-2 space-y-1">{shown.map((edge) => {
        const a = byId.get(edge.predecessorId);
        const b = byId.get(edge.successorId);
        if (!a || !b) return null;
        const external = !rows.has(a.id) || !rows.has(b.id);
        return <li key={edgeKey(edge)}>{a.title} ({DELIVERY_GROUP_LABELS[a.deliveryGroup]}) → {b.title} ({DELIVERY_GROUP_LABELS[b.deliveryGroup]})
          {external && " · Fora do filtro"}{scheduleConflict(a.endDate, b.startDate) && " · Conflito de datas"}
          {highlightedEdges.has(edgeKey(edge)) && " · Em destaque"}</li>;
      })}</ul>
    </details>}
  </section>;
}
