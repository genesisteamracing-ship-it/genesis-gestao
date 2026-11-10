import { useState, type FormEvent } from "react";
import type { TaskStatus } from "@prisma/client";
import { createTaskAction, editTaskAction } from "@/actions/tasks.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { TASK_STATUS_LABELS, type TaskPerson, type TaskRecord } from "@/types/tasks";
import { TaskField, TaskSelect, TaskMultiSelect } from "./task-fields";

export const sectorOptions = Object.entries(DELIVERY_GROUP_LABELS).map(([value, label]) => ({ value, label }));
const statuses = Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({ value, label }));

export function TaskForm({
  task,
  teamId,
  members,
  currentUserId,
  currentUserName,
  onDone,
}: {
  task?: TaskRecord;
  teamId: string;
  members: TaskPerson[];
  currentUserId?: string;
  currentUserName?: string;
  onDone: () => void;
}) {
  const [sector, setSector] = useState<string>(task?.deliveryGroup ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");

  const people = new Map(members.map((person) => [person.key, person]));
  for (const item of task?.roles ?? []) people.set(item.person.key, item.person);

  // A — Quem cria/atribui a tarefa
  const authorRole = task?.roles.find(({ role }) => role === "A");
  const authorKey = authorRole?.person.key ?? currentUserId ?? "";
  const authorName = authorRole?.person.name ?? currentUserName ?? "Você (quem cria a tarefa)";

  // R — Responsáveis (Executores)
  const [selectedResponsibleKeys, setSelectedResponsibleKeys] = useState<string[]>(() =>
    (task?.roles ?? [])
      .filter(({ role }) => role === "R")
      .map(({ person }) => person.key)
  );

  // C — Consultados
  const [selectedConsultedKeys, setSelectedConsultedKeys] = useState<string[]>(() =>
    (task?.roles ?? [])
      .filter(({ role }) => role === "C")
      .map(({ person }) => person.key)
  );

  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  // Opções para R: integrantes disponíveis (e os que já estavam selecionados)
  const responsibleOptions = [...people.values()].filter(
    (person) => person.available || selectedResponsibleKeys.includes(person.key)
  );

  // Opções para C: quem for selecionado como responsável NÃO aparecerá no consultado!
  const consultedOptions = [...people.values()].filter((person) => {
    if (selectedResponsibleKeys.includes(person.key)) return false;
    if (authorKey && person.key === authorKey) return false;
    return person.available || selectedConsultedKeys.includes(person.key);
  });

  const handleResponsibleChange = (keys: string[]) => {
    setSelectedResponsibleKeys(keys);
    // Se algum membro virou responsável, remove de consultados imediatamente
    setSelectedConsultedKeys((cKeys) => cKeys.filter((k) => !keys.includes(k)));
  };

  const handleConsultedChange = (keys: string[]) => {
    // Garante que nenhum responsável entre em consultados
    setSelectedConsultedKeys(keys.filter((k) => !selectedResponsibleKeys.includes(k)));
  };

  // I — Informados: os que não forem selecionados como consultados, responsável ou for quem atribuiu
  // será automaticamente marcado como informado
  const autoInformedKeys = [...people.values()]
    .filter((person) => {
      if (authorKey && person.key === authorKey) return false;
      if (selectedResponsibleKeys.includes(person.key)) return false;
      if (selectedConsultedKeys.includes(person.key)) return false;
      return person.available || (task?.roles.some((r) => r.role === "I" && r.person.key === person.key));
    })
    .map((person) => person.key);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const assignments = [
      ...selectedResponsibleKeys.map((memberKey) => ({ role: "R" as const, memberKey })),
      ...selectedConsultedKeys.map((memberKey) => ({ role: "C" as const, memberKey })),
      ...autoInformedKeys.map((memberKey) => ({ role: "I" as const, memberKey })),
    ];

    const input = {
      teamId,
      deliveryGroup: sector,
      assignments,
      title: data.get("title"),
      description: data.get("description"),
      startDate: data.get("startDate"),
      endDate: data.get("endDate"),
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

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Título: largura total */}
      <TaskField label="Título">
        {(id) => <Input id={id} name="title" defaultValue={task?.title} maxLength={160} required />}
      </TaskField>

      {/* Setor: ocupando toda a largura */}
      <div className="w-full">
        <TaskSelect
          label="Setor"
          value={sector}
          options={sectorOptions}
          onChange={setSector}
          placeholder="Selecione"
        />
      </div>

      {/* Estado (quando editando tarefa existente) */}
      {task && (
        <div className="w-full">
          <TaskSelect
            label="Estado"
            value={status}
            options={statuses}
            onChange={(value) => setStatus(value as TaskStatus)}
          />
        </div>
      )}

      {/* Início e Término: um do lado do outro */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TaskField label="Início">
          {(id) => <Input id={id} type="date" name="startDate" defaultValue={task?.startDate} required />}
        </TaskField>
        <TaskField label="Término">
          {(id) => <Input id={id} type="date" name="endDate" defaultValue={task?.endDate} required />}
        </TaskField>
      </div>

      {/* Descrição: largura total */}
      <TaskField label="Descrição">
        {(id) => (
          <Textarea
            id={id}
            name="description"
            defaultValue={task?.description ?? ""}
            maxLength={4000}
          />
        )}
      </TaskField>

      {/* A — Atribuição */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-b border-border/60 pb-2">
        <span className="font-semibold text-foreground">A — Atribuído por:</span>
        <span>{authorName}</span>
      </div>

      {/* R e C — Seleção via combobox com múltipla escolha e caixa de seleção */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <TaskMultiSelect
          label="R — Executores (Responsáveis)"
          placeholder="Selecione os responsáveis"
          options={responsibleOptions}
          value={selectedResponsibleKeys}
          onChange={handleResponsibleChange}
        />
        <TaskMultiSelect
          label="C — Consultados"
          placeholder="Selecione os consultados"
          options={consultedOptions}
          value={selectedConsultedKeys}
          onChange={handleConsultedChange}
          emptyMessage={
            responsibleOptions.length > 0 && consultedOptions.length === 0
              ? "Todos os integrantes foram marcados como responsáveis"
              : "Nenhum integrante disponível"
          }
        />
      </div>

      {/* I — Informados (automáticos) */}
      <div className="rounded-lg border border-border/80 bg-muted/20 p-2.5 space-y-1">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span>I — Informados</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            Marcados automaticamente ({autoInformedKeys.length})
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          {autoInformedKeys.length > 0 ? (
            <p className="line-clamp-2 leading-relaxed">
              {autoInformedKeys
                .map((k) => people.get(k)?.name ?? k)
                .filter(Boolean)
                .join(", ")}
            </p>
          ) : (
            <p className="italic text-[11px]">Nenhum outro integrante restante.</p>
          )}
        </div>
      </div>

      {message && <p role="alert" className="text-sm text-destructive">{message}</p>}

      <div className="flex justify-end pt-1">
        <Button type="submit" disabled={pending || !sector}>
          {pending ? "Salvando…" : "Salvar tarefa"}
        </Button>
      </div>
    </form>
  );
}
