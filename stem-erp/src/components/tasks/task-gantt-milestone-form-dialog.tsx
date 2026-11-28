"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Sparkles, Trash2 } from "lucide-react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { tv } from "tailwind-variants";
import { z } from "zod";
import { saveMilestoneAction } from "@/actions/tasks.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import {
  getMilestoneWeekRange,
  suggestMilestoneTaskIds,
} from "@/lib/task-milestone-metrics";
import { formatTaskDate, parseTaskDate } from "@/lib/task-schedule";
import type { SaveMilestoneInput } from "@/lib/validations/tasks";
import type {
  TaskActionResult,
  TaskMilestoneRecord,
  TaskRecord,
} from "@/types/tasks";

const milestoneFormSchema = z.object({
  title: z.string().trim().min(1, "Informe o título do marco.").max(160),
  targetDate: z
    .string()
    .refine((value) => parseTaskDate(value) !== null, "Informe uma data válida."),
  description: z.string().trim().max(2000).optional(),
  criteria: z
    .array(
      z.object({
        criterionId: z.string().optional(),
        title: z
          .string()
          .trim()
          .min(1, "Informe o critério de aceitação.")
          .max(240, "Critério muito longo (máximo 240 caracteres)."),
      }),
    )
    .min(1, "Adicione ao menos um critério de aceitação.")
    .max(20, "Limite de 20 critérios por marco."),
  taskIds: z.array(z.string()),
});

type MilestoneFormValues = z.infer<typeof milestoneFormSchema>;

const taskOptionStyles = tv({
  base: "flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-xs transition-colors",
  variants: {
    selected: {
      true: "border-primary/50 bg-primary/5 text-foreground",
      false: "border-border bg-card text-foreground hover:bg-muted/40",
    },
  },
  defaultVariants: {
    selected: false,
  },
});

function buildDefaultValues(
  milestone: TaskMilestoneRecord | undefined,
  defaultDate: string,
): MilestoneFormValues {
  if (milestone) {
    return {
      title: milestone.title,
      targetDate: milestone.targetDate,
      description: milestone.description ?? "",
      criteria:
        milestone.criteria.length > 0
          ? milestone.criteria.map((item) => ({
              criterionId: item.id,
              title: item.title,
            }))
          : [{ title: "" }],
      taskIds: [...milestone.taskIds],
    };
  }

  return {
    title: "",
    targetDate: defaultDate,
    description: "",
    criteria: [{ title: "" }],
    taskIds: [],
  };
}

export interface TaskGanttMilestoneFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  tasks: TaskRecord[];
  milestone?: TaskMilestoneRecord;
  defaultDate: string;
  onSaved: () => void;
  onSubmitMilestone?: (input: SaveMilestoneInput) => Promise<TaskActionResult>;
}

export function TaskGanttMilestoneFormDialog({
  open,
  onOpenChange,
  teamId,
  tasks,
  milestone,
  defaultDate,
  onSaved,
  onSubmitMilestone = saveMilestoneAction,
}: TaskGanttMilestoneFormDialogProps) {
  const scopeKey = `${milestone?.id ?? "new"}:${defaultDate}:${open}`;
  const [serverError, setServerError] = useState<{
    scopeKey: string;
    message: string;
  } | null>(null);
  const currentServerError =
    serverError?.scopeKey === scopeKey ? serverError.message : "";

  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: buildDefaultValues(milestone, defaultDate),
  });

  useEffect(() => {
    if (!open) return;
    form.reset(buildDefaultValues(milestone, defaultDate));
  }, [open, milestone, defaultDate, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "criteria",
  });

  const watchedTargetDate = useWatch({ control: form.control, name: "targetDate" });
  const watchedTaskIds = useWatch({ control: form.control, name: "taskIds" }) ?? [];
  const selectedTaskSet = new Set(watchedTaskIds);

  const selectableTasks = tasks.filter(
    (task) => task.status !== "CANCELLED" || selectedTaskSet.has(task.id),
  );

  const weekInfo = getMilestoneWeekRange(watchedTargetDate || defaultDate);

  function toggleTaskSelection(taskId: string) {
    const next = selectedTaskSet.has(taskId)
      ? watchedTaskIds.filter((id) => id !== taskId)
      : [...watchedTaskIds, taskId];
    form.setValue("taskIds", next, { shouldDirty: true });
  }

  function handleSelectUntilDate() {
    const suggested = suggestMilestoneTaskIds(tasks, watchedTargetDate || defaultDate);
    form.setValue("taskIds", suggested, { shouldDirty: true });
  }

  async function onSubmit(values: MilestoneFormValues) {
    setServerError(null);
    const payload: SaveMilestoneInput = {
      teamId,
      ...(milestone ? { id: milestone.id, revision: milestone.revision } : {}),
      title: values.title.trim(),
      description: values.description?.trim() ? values.description.trim() : undefined,
      targetDate: values.targetDate,
      criteria: values.criteria.map((item) => ({
        ...(item.criterionId ? { id: item.criterionId } : {}),
        title: item.title.trim(),
      })),
      taskIds: values.taskIds,
    };

    try {
      const res = await onSubmitMilestone(payload);
      if (res.ok) {
        toast.success(milestone ? "Marco atualizado." : "Marco adicionado ao Gantt.");
        onSaved();
        onOpenChange(false);
      } else {
        setServerError({ scopeKey, message: res.message });
      }
    } catch {
      setServerError({
        scopeKey,
        message: "Não foi possível salvar o marco. Tente novamente.",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold">
            {milestone ? "Editar marco" : "Novo marco"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Defina a data/semana, os critérios de aceitação e as tarefas avaliadas no marco.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="milestone-title"
                className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
              >
                Nome do marco
              </Label>
              <div className="mt-auto space-y-1">
                <Input
                  id="milestone-title"
                  placeholder="Ex: Entrega CAD Preliminar"
                  {...form.register("title")}
                />
                {form.formState.errors.title && (
                  <p className="text-xs text-destructive" role="alert">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="milestone-date"
                className="flex min-h-[2rem] items-end justify-between gap-2 text-xs font-semibold leading-tight"
              >
                <span>Data / Semana do marco</span>
                <span className="font-normal text-muted-foreground">{weekInfo.label}</span>
              </Label>
              <div className="mt-auto space-y-1">
                <Input
                  id="milestone-date"
                  type="date"
                  {...form.register("targetDate")}
                />
                {form.formState.errors.targetDate && (
                  <p className="text-xs text-destructive" role="alert">
                    {form.formState.errors.targetDate.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="milestone-description" className="text-xs font-semibold">
              Observações (opcional)
            </Label>
            <Textarea
              id="milestone-description"
              rows={2}
              placeholder="Escopo ou contexto da revisão deste marco"
              {...form.register("description")}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-semibold">Critérios de aceitação</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={fields.length >= 20}
                onClick={() => append({ title: "" })}
                className="h-7 gap-1 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar critério
              </Button>
            </div>

            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label={`Critério de aceitação ${index + 1}`}
                      placeholder={`Critério ${index + 1} (ex: Arquivo validado sem interferências)`}
                      {...form.register(`criteria.${index}.title`)}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      disabled={fields.length <= 1}
                      onClick={() => remove(index)}
                      aria-label={`Remover critério ${index + 1}`}
                      className="h-9 w-9 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {form.formState.errors.criteria?.[index]?.title && (
                    <p className="text-xs text-destructive" role="alert">
                      {form.formState.errors.criteria[index]?.title?.message}
                    </p>
                  )}
                </div>
              ))}
              {form.formState.errors.criteria?.message && (
                <p className="text-xs text-destructive" role="alert">
                  {form.formState.errors.criteria.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs font-semibold">
                Tarefas vinculadas ({watchedTaskIds.length})
              </Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleSelectUntilDate}
                disabled={tasks.length === 0}
                className="h-7 gap-1 text-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Selecionar até esta data
              </Button>
            </div>

            {selectableTasks.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
                Nenhuma tarefa disponível para vincular.
              </p>
            ) : (
              <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
                {selectableTasks.map((task) => {
                  const checked = selectedTaskSet.has(task.id);
                  return (
                    <label key={task.id} className={taskOptionStyles({ selected: checked })}>
                      <span className="flex min-w-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTaskSelection(task.id)}
                          aria-label={`Vincular tarefa ${task.title}`}
                          className="h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{task.title}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">
                            {DELIVERY_GROUP_LABELS[task.deliveryGroup]}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatTaskDate(task.endDate).slice(0, 5)}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {currentServerError && (
            <p className="text-xs font-medium text-destructive" role="alert">
              {currentServerError}
            </p>
          )}

          <DialogFooter className="flex-col-reverse gap-2 pt-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting}
              className="w-full gap-1.5 sm:w-auto"
            >
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{milestone ? "Salvar alterações" : "Criar marco"}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
