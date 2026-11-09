import { Button } from "@/components/ui/button";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { edgeKey } from "@/lib/task-schedule";
import type { TaskRisk, TaskWorkspace } from "@/types/tasks";
import { TaskSelect } from "./task-fields";

export function TaskRiskView({ workspace, selectedId, select, edit, highlight }: {
  workspace: TaskWorkspace; selectedId?: string; select: (id: string) => void;
  edit: (risk?: TaskRisk) => void; highlight: (id: string) => void;
}) {
  const risk = workspace.paths.find((path) => path.id === selectedId) ?? workspace.paths[0];
  const byId = new Map(workspace.tasks.map((task) => [task.id, task]));
  const incomplete = Boolean(risk?.missing.length);

  return <section aria-label="Caminhos de risco" className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-end gap-2">
      {risk && <div className="min-w-44 flex-1">
        <TaskSelect label="Caminho salvo" value={risk.id} onChange={select}
          options={workspace.paths.map((item) => ({ value: item.id, label: item.name }))} />
      </div>}
      {workspace.canEdit && <Button onClick={() => edit()} disabled={!workspace.edges.length}>Novo caminho</Button>}
      {workspace.canEdit && risk && <Button variant="outline" onClick={() => edit(risk)}>Editar caminho</Button>}
      {risk && <Button variant="outline" disabled={incomplete} onClick={() => highlight(risk.id)}>Destacar no Gantt</Button>}
    </div>
    {!risk && <div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
      {workspace.edges.length ? "Nenhum caminho salvo." : "Vincule pelo menos duas tarefas para montar o primeiro caminho."}
    </div>}
    {risk && <>
      <p className="whitespace-pre-wrap break-words text-sm">{risk.reason}</p>
      {incomplete && <div role="status" className="rounded-md border border-destructive/40 p-2 text-sm">
        <strong>Caminho incompleto</strong>
        {risk.missing.map((edge) => <p key={edgeKey(edge)}>{byId.get(edge.predecessorId)?.title} → {byId.get(edge.successorId)?.title} · Ligação ausente</p>)}
      </div>}
      <ol aria-label="Sequência do caminho" className="list-decimal space-y-2 rounded-lg border border-border bg-card p-4 pl-8 text-sm">
        {risk.taskIds.map((id, index) => {
          const task = byId.get(id);
          return task && <li key={id}>{task.title} · {DELIVERY_GROUP_LABELS[task.deliveryGroup]}{index === 0 && " · Origem"}</li>;
        })}
      </ol>
    </>}
  </section>;
}
