import { useState, type FormEvent } from "react";
import type { TaskAssignmentRole, TaskStatus } from "@prisma/client";
import { createTaskAction, editTaskAction } from "@/actions/tasks.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { TASK_STATUS_LABELS, type TaskPerson, type TaskRecord } from "@/types/tasks";
import { TaskField, TaskSelect } from "./task-fields";

export const sectorOptions = Object.entries(DELIVERY_GROUP_LABELS).map(([value, label]) => ({ value, label }));
const statuses = Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const roleOptions = [
  { role: "R", title: "R — Executores" },
  { role: "C", title: "C — Consultados" },
  { role: "I", title: "I — Informados" },
] as const;

export function TaskForm({ task, teamId, members, onDone }: {
  task?: TaskRecord; teamId: string; members: TaskPerson[]; onDone: () => void;
}) {
  const [sector, setSector] = useState<string>(task?.deliveryGroup ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");
  const [roles, setRoles] = useState(() => (task?.roles ?? []).flatMap(({ role, person }) =>
    role === "A" ? [] : [{ role, memberKey: person.key }],
  ));
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const people = new Map(members.map((person) => [person.key, person]));
  for (const item of task?.roles ?? []) people.set(item.person.key, item.person);

  function toggle(role: TaskAssignmentRole, memberKey: string, selected: boolean) {
    setRoles((current) => selected
      ? [...current, { role, memberKey }]
      : current.filter((item) => item.memberKey !== memberKey || item.role !== role));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const input = {
      teamId, deliveryGroup: sector, assignments: roles,
      title: data.get("title"), description: data.get("description"),
      startDate: data.get("startDate"), endDate: data.get("endDate"),
    };
    setPending(true);
    setMessage("");
    try {
      const result = task
        ? await editTaskAction({ ...input, id: task.id, revision: task.revision, status })
        : await createTaskAction(input);
      if (result.ok) onDone();
      else setMessage(result.message);
    } catch {
      setMessage("Não foi possível salvar. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="space-y-4">
    <TaskField label="Título">{(id) => <Input id={id} name="title" defaultValue={task?.title} maxLength={160} required />}</TaskField>
    <div className="grid gap-3 sm:grid-cols-2">
      <TaskSelect label="Setor" value={sector} options={sectorOptions} onChange={setSector} placeholder="Selecione" />
      {task && <TaskSelect label="Estado" value={status} options={statuses} onChange={(value) => setStatus(value as TaskStatus)} />}
      <TaskField label="Início">{(id) => <Input id={id} type="date" name="startDate" defaultValue={task?.startDate} required />}</TaskField>
      <TaskField label="Término">{(id) => <Input id={id} type="date" name="endDate" defaultValue={task?.endDate} required />}</TaskField>
    </div>
    <TaskField label="Descrição">{(id) => <Textarea id={id} name="description" defaultValue={task?.description ?? ""} maxLength={4000} />}</TaskField>
    <p className="text-sm text-muted-foreground">A — {task?.roles.find(({ role }) => role === "A")?.person.name ?? "Quem cria a tarefa"}</p>
    <div className="grid gap-2 sm:grid-cols-3">
      {roleOptions.map(({ role, title }) => <fieldset key={role} className="min-w-0 rounded-lg border border-border p-2">
        <legend className="px-1 text-xs font-medium">{title}</legend>
        <div className="max-h-36 space-y-1 overflow-auto">
          {[...people.values()].map((person) => {
            const selected = roles.some((item) => item.role === role && item.memberKey === person.key);
            if (!person.available && !selected) return null;
            return <label key={person.key} className="flex min-h-8 items-center gap-2 text-xs">
              <input type="checkbox" className="accent-primary" checked={selected} onChange={(event) => toggle(role, person.key, event.target.checked)} />
              <span>{person.name}{!person.available && " (indisponível)"}</span>
            </label>;
          })}
        </div>
      </fieldset>)}
    </div>
    {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
    <div className="flex justify-end"><Button type="submit" disabled={pending || !sector}>{pending ? "Salvando…" : "Salvar tarefa"}</Button></div>
  </form>;
}
