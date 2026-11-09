"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ComponentProps } from "react";
import type { TaskRisk, TaskWorkspace } from "@/types/tasks";
import { TaskDetail } from "./task-detail";
import { TaskSelect } from "./task-fields";
import { TaskForm, sectorOptions } from "./task-form";
import { TaskGantt } from "./task-gantt";
import { TaskList } from "./task-list";
import { TaskRaci } from "./task-raci";
import { TaskRiskForm } from "./task-risk-form";
import { TaskRiskView } from "./task-risk-view";

const tabs = {
  tasks: { title: "Tarefas", subtitle: "Organize as atividades e os responsáveis de cada setor." },
  gantt: { title: "Gantt", subtitle: "Acompanhe prazos e dependências na linha do tempo." },
  risks: { title: "Caminhos de risco", subtitle: "Mostre quais atividades podem ser afetadas por um atraso." },
  raci: { title: "Matriz RACI", subtitle: "Consulte quem responde, executa, é consultado ou informado." },
};
type Tab = keyof typeof tabs;
type Panel = { type: "task" | "detail" | "risk"; id?: string };
type Shell = Omit<ComponentProps<typeof DashboardShell>, "title" | "subtitle" | "children">;

export function TasksView({ shell, workspace }: { shell: Shell; workspace: TaskWorkspace | null }) {
  const [tab, setTab] = useState<Tab>("tasks");
  const [sector, setSector] = useState("all");
  const [panel, setPanel] = useState<Panel | null>(null);
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
      setTab("tasks");
      setSector("all");
    }
    setPanel(null);
  };
  const label = panel?.type === "risk" ? (risk ? "Editar caminho" : "Novo caminho") :
    panel?.type === "detail" ? task?.title : task ? "Editar tarefa" : "Nova tarefa";
  const empty = <p className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">Nenhuma tarefa neste setor.</p>;

  return <DashboardShell {...shell} {...tabs[tab]} headerAction={workspace?.canEdit && (
    <Button type="button" className="w-full sm:w-auto" onClick={() => setPanel({ type: "task" })}>
      <Plus aria-hidden="true" />
      Nova tarefa
    </Button>
  )}>
    {!workspace ? <p className="rounded-lg border border-border bg-card p-4 text-sm">Selecione uma equipe ativa à qual você tem acesso.</p> : (
      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="min-w-0 gap-4">
        <div className="overflow-x-auto">
          <TabsList>{Object.entries(tabs).map(([key, item]) => <TabsTrigger key={key} value={key}>{item.title}</TabsTrigger>)}</TabsList>
        </div>
        {tab !== "risks" && <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-44 flex-1 sm:max-w-72">
            <TaskSelect label="Filtrar por setor" value={sector} onChange={setSector}
              options={[{ value: "all", label: "Todos os setores" }, ...sectorOptions]} />
          </div>
          {tab === "gantt" && highlighted && <Button variant="outline" onClick={() => setHighlightId(undefined)}>Limpar destaque</Button>}
        </div>}
        <TabsContent value="tasks">{visible.length ? <TaskList key={sector} tasks={visible} canEdit={workspace.canEdit} open={openTask} edit={editTask} /> : empty}</TabsContent>
        <TabsContent value="gantt">{visible.length ? <TaskGantt visible={visible} tasks={workspace.tasks} edges={workspace.edges}
          path={highlighted} open={openTask} /> : empty}</TabsContent>
        <TabsContent value="risks"><TaskRiskView workspace={workspace} selectedId={selectedRisk} select={setSelectedRisk}
          edit={editRisk} highlight={(id) => { setHighlightId(id); setSector("all"); setTab("gantt"); }} /></TabsContent>
        <TabsContent value="raci">{visible.length ? <TaskRaci key={sector} tasks={visible} members={workspace.members} /> : empty}</TabsContent>
      </Tabs>
    )}
    {workspace && <Dialog open={Boolean(panel)} onOpenChange={(open) => { if (!open) setPanel(null); }}>
      {panel && <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{label}</DialogTitle><DialogDescription>
          {panel.type === "risk" ? "Defina a sequência de atividades afetadas." : "Consulte ou organize o trabalho deste setor."}
        </DialogDescription></DialogHeader>
        {panel.type === "task" && workspace.canEdit && <TaskForm key={panel.id ?? "new"} task={task} teamId={workspace.teamId} members={workspace.members} onDone={saved} />}
        {panel.type === "detail" && task && <>
          <TaskDetail key={task.id} task={task} workspace={workspace} />
          {workspace.canEdit && <Button variant="outline" onClick={() => editTask(task.id)}>Editar tarefa</Button>}
        </>}
        {panel.type === "risk" && workspace.canEdit && <TaskRiskForm key={panel.id ?? "new"} workspace={workspace} risk={risk} onDone={saved} />}
      </DialogContent>}
    </Dialog>}
  </DashboardShell>;
}
