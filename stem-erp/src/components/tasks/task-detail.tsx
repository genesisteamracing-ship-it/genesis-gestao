import { useState } from "react";
import { addTaskDependencyAction, removeTaskDependencyAction } from "@/actions/tasks.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { formatTaskDate, edgeKey, scheduleConflict } from "@/lib/task-schedule";
import { TASK_STATUS_LABELS, type TaskRecord, type TaskWorkspace, type TaskEdge } from "@/types/tasks";
import { TaskSelect } from "./task-fields";

export function TaskDetail({ task, workspace }: {
  task: TaskRecord; workspace: TaskWorkspace;
}) {
  const [predecessorId, setPredecessorId] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const linked = workspace.edges.filter((edge) => edge.predecessorId === task.id || edge.successorId === task.id);
  const byId = new Map(workspace.tasks.map((item) => [item.id, item]));
  const predecessors = new Set(linked.filter((edge) => edge.successorId === task.id).map((edge) => edge.predecessorId));
  const options = workspace.tasks.filter((item) => item.id !== task.id && !predecessors.has(item.id))
    .map((item) => ({ value: item.id, label: item.title + " · " + DELIVERY_GROUP_LABELS[item.deliveryGroup] }));

  async function change(edge: TaskEdge, add: boolean) {
    setPending(true);
    setMessage("");
    try {
      const action = add ? addTaskDependencyAction : removeTaskDependencyAction;
      const result = await action({ ...edge, teamId: workspace.teamId });
      if (result.ok) setPredecessorId("");
      else setMessage(result.message);
    } catch {
      setMessage("Não foi possível atualizar a dependência. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-5 px-2">
      <div className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/30 p-3 text-sm sm:grid-cols-2">
        <div>
          <span className="text-muted-foreground">Setor: </span>
          <span className="font-medium text-foreground">{DELIVERY_GROUP_LABELS[task.deliveryGroup]}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Status:</span>
          <Badge variant="secondary">{TASK_STATUS_LABELS[task.status]}</Badge>
        </div>
        <div>
          <span className="text-muted-foreground">Data início: </span>
          <span className="font-medium text-foreground">{formatTaskDate(task.startDate)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Data de entrega: </span>
          <span className="font-medium text-foreground">{formatTaskDate(task.endDate)}</span>
        </div>
      </div>

      {task.description && (
        <p className="whitespace-pre-wrap break-words text-sm text-foreground">{task.description}</p>
      )}

      <section aria-label="Dependências" className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Dependências</h3>
        {linked.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma dependência.</p>}
        <ul className="space-y-2">
          {linked.map((edge) => {
            const source = byId.get(edge.predecessorId);
            const target = byId.get(edge.successorId);
            if (!source || !target) return null;
            const label = source.title + " → " + target.title;
            return (
              <li
                key={edgeKey(edge)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2 text-sm"
              >
                <span>
                  {label}
                  {scheduleConflict(source.endDate, target.startDate) && (
                    <span className="block font-medium text-destructive">Conflito de datas</span>
                  )}
                </span>
                {workspace.canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={"Remover " + label}
                    disabled={pending}
                    onClick={() => change(edge, false)}
                  >
                    Remover
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
        {workspace.canEdit && options.length > 0 && (
          <div className="grid items-end gap-2 sm:grid-cols-[1fr_auto]">
            <TaskSelect
              label="Tarefa predecessora"
              value={predecessorId}
              options={options}
              onChange={setPredecessorId}
              placeholder="Selecione"
            />
            <Button
              type="button"
              variant="outline"
              disabled={!predecessorId || pending}
              onClick={() => change({ predecessorId, successorId: task.id }, true)}
            >
              Adicionar dependência
            </Button>
          </div>
        )}
        {message && (
          <p role="alert" className="text-sm text-destructive">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
