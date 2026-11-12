export const TASK_VIEWS = [
  { id: "tasks", href: "/tarefas", title: "Tarefas", label: "Lista de tarefas", subtitle: "Organize as atividades e os responsáveis de cada setor." },
  { id: "my-activities", href: "/tarefas?tab=my-activities", title: "Minhas atividades", label: "Minhas atividades", subtitle: "Acompanhe suas atividades por prazo limite, atualize o status e monitore seu desempenho." },
  { id: "gantt", href: "/tarefas?tab=gantt", title: "Gantt", label: "Gantt", subtitle: "Acompanhe prazos e dependências na linha do tempo." },
  { id: "risks", href: "/tarefas?tab=risks", title: "Caminhos de risco", label: "Caminhos de risco", subtitle: "Mostre quais atividades podem ser afetadas por um atraso." },
  { id: "raci", href: "/tarefas?tab=raci", title: "Matriz RACI", label: "Matriz RACI", subtitle: "Consulte quem responde, executa, é consultado ou informado." },
] as const;

export type TaskViewId = (typeof TASK_VIEWS)[number]["id"];

export function getTaskView(id?: string | null) {
  return TASK_VIEWS.find((view) => view.id === id) ?? TASK_VIEWS[0];
}
