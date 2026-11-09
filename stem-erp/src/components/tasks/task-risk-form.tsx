import { useState, type FormEvent } from "react";
import { saveRiskPathAction } from "@/actions/tasks.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { missingLinks } from "@/lib/task-schedule";
import type { TaskRisk, TaskWorkspace } from "@/types/tasks";
import { TaskField, TaskSelect } from "./task-fields";

export function TaskRiskForm({ workspace, risk, onDone }: {
  workspace: TaskWorkspace; risk?: TaskRisk; onDone: () => void;
}) {
  const [sequence, setSequence] = useState(risk?.taskIds ?? []);
  const [nextId, setNextId] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const byId = new Map(workspace.tasks.map((task) => [task.id, task]));
  const last = sequence.at(-1);
  const choices = new Set(workspace.edges.filter((edge) => edge.predecessorId === last).map((edge) => edge.successorId));
  const options = workspace.tasks.filter((task) => last ? choices.has(task.id) && !sequence.includes(task.id) :
    workspace.edges.some((edge) => edge.predecessorId === task.id)).map((task) => ({
    value: task.id, label: task.title + " · " + DELIVERY_GROUP_LABELS[task.deliveryGroup],
  }));
  const missing = missingLinks(sequence, workspace.edges);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    setPending(true);
    setMessage("");
    try {
      const result = await saveRiskPathAction({
        teamId: workspace.teamId, name: fields.get("name"), reason: fields.get("reason"), taskIds: sequence,
        ...(risk && { edit: { id: risk.id, revision: risk.revision } }),
      });
      if (result.ok) onDone();
      else setMessage(result.message);
    } catch {
      setMessage("Não foi possível salvar o caminho. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="space-y-4">
    <TaskField label="Nome do caminho">{(id) => <Input id={id} name="name" defaultValue={risk?.name} maxLength={160} required />}</TaskField>
    <TaskField label="Motivo do risco">{(id) => <Textarea id={id} name="reason" defaultValue={risk?.reason} maxLength={4000} required />}</TaskField>
    <ol className="space-y-1">{sequence.map((id, index) => <li key={id}
      className="flex items-center justify-between gap-2 rounded-md border border-border p-2 text-sm">
      <span>{index + 1}. {byId.get(id)?.title}{index === 0 && " · Origem"}</span>
      <Button type="button" variant="ghost" size="sm" onClick={() => { setSequence(sequence.slice(0, index)); setNextId(""); }}
        aria-label={"Remover etapa " + (index + 1) + " e seguintes"}>Remover daqui</Button>
    </li>)}</ol>
    {missing.length > 0 && <p role="alert" className="text-sm text-destructive">Há ligações ausentes. Remova as etapas a partir da primeira ligação ausente para reconstruir a sequência.</p>}
    {options.length > 0 && <div className="grid items-end gap-2 sm:grid-cols-[1fr_auto]">
      <TaskSelect label={last ? "Próxima tarefa" : "Tarefa de origem"} value={nextId} options={options} onChange={setNextId} placeholder="Selecione" />
      <Button type="button" variant="outline" disabled={!options.some(({ value }) => value === nextId)} onClick={() => {
        setSequence([...sequence, nextId]);
        setNextId("");
      }}>Adicionar etapa</Button>
    </div>}
    {!options.length && !sequence.length && <p className="text-sm text-muted-foreground">Vincule pelo menos duas tarefas antes de criar um caminho.</p>}
    {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    <div className="flex justify-end">
      <Button type="submit" disabled={pending || sequence.length < 2 || missing.length > 0}>{pending ? "Salvando…" : "Salvar caminho"}</Button>
    </div>
  </form>;
}
