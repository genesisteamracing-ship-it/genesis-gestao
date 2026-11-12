import { useId, useState } from "react";
import { addTaskDependencyAction, removeTaskDependencyAction } from "@/actions/tasks.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { formatTaskDate, edgeKey, scheduleConflict } from "@/lib/task-schedule";
import { TASK_STATUS_LABELS, type TaskRecord, type TaskWorkspace, type TaskEdge } from "@/types/tasks";

export function TaskDetail({ task, workspace }: {
  task: TaskRecord; workspace: TaskWorkspace;
}) {
  const inputId = useId();
  const [predecessorId, setPredecessorId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const linked = workspace.edges.filter((edge) => edge.predecessorId === task.id || edge.successorId === task.id);
  const byId = new Map(workspace.tasks.map((item) => [item.id, item]));
  const predecessors = new Set(linked.filter((edge) => edge.successorId === task.id).map((edge) => edge.predecessorId));
  const options = workspace.tasks
    .filter((item) => item.id !== task.id && !predecessors.has(item.id))
    .map((item) => ({
      value: item.id,
      title: item.title,
      sector: DELIVERY_GROUP_LABELS[item.deliveryGroup],
      label: item.title + " · " + DELIVERY_GROUP_LABELS[item.deliveryGroup],
    }));

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchingOptions = normalizedQuery
    ? options.filter(
        (option) =>
          option.title.toLowerCase().includes(normalizedQuery) ||
          option.sector.toLowerCase().includes(normalizedQuery),
      )
    : [];
  const showSuggestions = normalizedQuery.length > 0 && !predecessorId;

  async function change(edge: TaskEdge, add: boolean) {
    setPending(true);
    setMessage("");
    try {
      const action = add ? addTaskDependencyAction : removeTaskDependencyAction;
      const result = await action({ ...edge, teamId: workspace.teamId });
      if (result.ok) {
        setPredecessorId("");
        setSearchQuery("");
      } else {
        setMessage(result.message);
      }
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
            <div className="relative flex min-w-0 flex-col justify-between gap-1.5">
              <Label htmlFor={inputId} className="flex min-h-8 items-end text-xs font-semibold">
                Tarefa predecessora
              </Label>
              <Input
                id={inputId}
                type="search"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  if (predecessorId) setPredecessorId("");
                }}
                placeholder="Digite o nome da atividade..."
                autoComplete="off"
                aria-autocomplete="list"
              />
              {showSuggestions && (
                <div
                  role="listbox"
                  aria-label="Atividades encontradas"
                  className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md"
                >
                  {matchingOptions.length === 0 ? (
                    <p className="px-2 py-1.5 text-xs text-muted-foreground">Nenhuma atividade encontrada.</p>
                  ) : (
                    matchingOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        role="option"
                        aria-selected={predecessorId === option.value}
                        onClick={() => {
                          setPredecessorId(option.value);
                          setSearchQuery(option.title);
                        }}
                        className="flex w-full cursor-pointer flex-col rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                      >
                        <span className="font-medium text-foreground">{option.title}</span>
                        <span className="text-muted-foreground">{option.sector}</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
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
