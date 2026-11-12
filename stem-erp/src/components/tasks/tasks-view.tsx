"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { deleteTaskAction, updateMyTaskStatusAction } from "@/actions/tasks.actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getTaskView, type TaskViewId } from "@/lib/task-navigation";
import type { ComponentProps } from "react";
import type { TaskRecord, TaskRisk, TaskWorkspace } from "@/types/tasks";
import { TaskDetail } from "./task-detail";
import { TaskSelect } from "./task-fields";
import { TaskForm, sectorOptions } from "./task-form";
import { TaskGantt } from "./task-gantt";
import { TaskList } from "./task-list";
import { TaskRaci } from "./task-raci";
import { TaskRiskForm } from "./task-risk-form";
import { TaskRiskView } from "./task-risk-view";
import { MyActivitiesView } from "./my-activities-view";

type Panel = { type: "task" | "detail" | "risk"; id?: string };
type Shell = Omit<ComponentProps<typeof DashboardShell>, "title" | "subtitle" | "children">;

export function TasksView({ shell, workspace, viewId }: { shell: Shell; workspace: TaskWorkspace | null; viewId: TaskViewId }) {
  const router = useRouter();
  const { title, subtitle } = getTaskView(viewId);
  const [sector, setSector] = useState("all");
  const [panel, setPanel] = useState<Panel | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<TaskRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selectedRisk, setSelectedRisk] = useState<string>();
  const [highlightId, setHighlightId] = useState<string>();
  const task = workspace?.tasks.find((item) => item.id === panel?.id);
  const risk = workspace?.paths.find((item) => item.id === panel?.id);
  const highlighted = workspace?.paths.find((item) => item.id === highlightId && item.missing.length === 0);
  const visible = workspace?.tasks.filter((item) => sector === "all" || item.deliveryGroup === sector) ?? [];
  const openTask = (id: string) => setPanel({ type: "detail", id });
  const editTask = (id: string) => setPanel({ type: "task", id });
  const editRisk = (item?: TaskRisk) => setPanel({ type: "risk", id: item?.id });

  const saved = () => {
    if (panel?.type === "task" && !panel.id) {
      setSector("all");
      if (viewId !== "tasks") router.push(getTaskView("tasks").href);
    }
    setPanel(null);
  };

  async function confirmDeleteTask() {
    if (!taskToDelete || !workspace) return;
    setIsDeleting(true);
    setDeleteError("");
    try {
      const res = await deleteTaskAction({ id: taskToDelete.id, teamId: workspace.teamId });
      if (res.ok) {
        if (panel?.id === taskToDelete.id) {
          setPanel(null);
        }
        setTaskToDelete(null);
      } else {
        setDeleteError(res.message);
      }
    } catch {
      setDeleteError("Não foi possível excluir a tarefa. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  }

  const label = panel?.type === "risk" ? (risk ? "Editar caminho" : "Novo caminho") :
    panel?.type === "detail" ? task?.title : task ? "Editar tarefa" : "Nova tarefa";
  const empty = <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">Nenhuma tarefa neste setor.</p>;

  return (
    <DashboardShell
      {...shell}
      title={title}
      subtitle={subtitle}
      headerAction={
        workspace?.canEdit && (
          <Button type="button" className="w-full sm:w-auto" onClick={() => setPanel({ type: "task" })}>
            <Plus aria-hidden="true" />
            Nova tarefa
          </Button>
        )
      }
    >
      {!workspace ? (
        <p className="rounded-lg border border-border bg-card p-4 text-sm">
          Selecione uma equipe ativa à qual você tem acesso.
        </p>
      ) : (
        <div className="min-w-0 space-y-4">
          {viewId !== "risks" && viewId !== "my-activities" && (
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-44 flex-1 sm:max-w-72">
                <TaskSelect
                  label="Filtrar por setor"
                  value={sector}
                  onChange={setSector}
                  options={[{ value: "all", label: "Todos os setores" }, ...sectorOptions]}
                />
              </div>
              {viewId === "gantt" && highlighted && (
                <Button variant="outline" onClick={() => setHighlightId(undefined)}>
                  Limpar destaque
                </Button>
              )}
            </div>
          )}
          {viewId === "my-activities" && (
            <MyActivitiesView
              workspace={workspace}
              onOpenDetail={openTask}
              onUpdateStatus={updateMyTaskStatusAction}
            />
          )}
          {viewId === "tasks" &&
            (visible.length ? (
              <TaskList
                key={sector}
                tasks={visible}
                canEdit={workspace.canEdit}
                open={openTask}
                edit={editTask}
                remove={setTaskToDelete}
              />
            ) : (
              empty
            ))}
          {viewId === "gantt" &&
            (visible.length ? (
              <TaskGantt
                visible={visible}
                tasks={workspace.tasks}
                edges={workspace.edges}
                path={highlighted}
                open={openTask}
                teamId={workspace.teamId}
                canEdit={workspace.canEdit}
              />
            ) : (
              empty
            ))}
          {viewId === "risks" && (
            <TaskRiskView
              workspace={workspace}
              selectedId={selectedRisk}
              select={setSelectedRisk}
              edit={editRisk}
              highlight={(id) => {
                setHighlightId(id);
                setSector("all");
                router.push(getTaskView("gantt").href);
              }}
            />
          )}
          {viewId === "raci" &&
            (visible.length ? (
              <TaskRaci key={sector} tasks={visible} members={workspace.members} />
            ) : (
              empty
            ))}
        </div>
      )}

      {workspace && (
        <Dialog
          open={Boolean(panel)}
          onOpenChange={(open) => {
            if (!open) setPanel(null);
          }}
        >
          {panel && (
            <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{label}</DialogTitle>
                <DialogDescription>
                  {panel.type === "risk"
                    ? "Defina a sequência de atividades afetadas."
                    : "Consulte ou organize o trabalho deste setor."}
                </DialogDescription>
              </DialogHeader>
              {panel.type === "task" && workspace.canEdit && (
                <TaskForm
                  key={panel.id ?? "new"}
                  task={task}
                  teamId={workspace.teamId}
                  members={workspace.members}
                  currentUserId={shell.currentUser?.id}
                  currentUserName={shell.currentUser?.name}
                  onDone={saved}
                />
              )}
              {panel.type === "detail" && task && (
                <>
                  <TaskDetail key={task.id} task={task} workspace={workspace} />
                  {workspace.canEdit && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button variant="outline" onClick={() => editTask(task.id)}>
                        Editar tarefa
                      </Button>
                      <Button variant="destructive" onClick={() => setTaskToDelete(task)}>
                        Excluir tarefa
                      </Button>
                    </div>
                  )}
                </>
              )}
              {panel.type === "risk" && workspace.canEdit && (
                <TaskRiskForm
                  key={panel.id ?? "new"}
                  workspace={workspace}
                  risk={risk}
                  onDone={saved}
                />
              )}
            </DialogContent>
          )}
        </Dialog>
      )}

      {/* Modal de Confirmação de Exclusão */}
      <Dialog
        open={Boolean(taskToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setTaskToDelete(null);
            setDeleteError("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">Excluir Tarefa</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-2 space-y-2">
              Tem certeza de que deseja excluir a tarefa{" "}
              <strong className="text-foreground">&quot;{taskToDelete?.title}&quot;</strong>?
              Esta ação removerá permanentemente as atribuições e dependências vinculadas.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <p role="alert" className="text-xs text-destructive">
              {deleteError}
            </p>
          )}
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setTaskToDelete(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={confirmDeleteTask}
              className="text-xs gap-1.5"
            >
              {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>Confirmar Exclusão</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
