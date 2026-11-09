import { Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { formatTaskDate } from "@/lib/task-schedule";
import { TASK_STATUS_LABELS, type TaskRecord } from "@/types/tasks";
import { TaskPagination, useTaskPage } from "./task-fields";

export function TaskList({ tasks, canEdit, open, edit }: {
  tasks: TaskRecord[]; canEdit: boolean; open: (id: string) => void; edit: (id: string) => void;
}) {
  const page = useTaskPage(tasks);
  return <div>
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table aria-label="Tarefas">
        <TableHeader><TableRow>
          <TableHead>Tarefa</TableHead><TableHead>Setor</TableHead><TableHead>Prazo</TableHead><TableHead>Estado</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow></TableHeader>
        <TableBody>{page.items.map((task) => <TableRow key={task.id}>
          <TableCell>
            <span className="font-medium">{task.title}</span>
            {!task.roles.some(({ role }) => role === "R") && <span className="block text-xs text-muted-foreground">Sem executor</span>}
          </TableCell>
          <TableCell>{DELIVERY_GROUP_LABELS[task.deliveryGroup]}</TableCell>
          <TableCell>{formatTaskDate(task.startDate)} — {formatTaskDate(task.endDate)}</TableCell>
          <TableCell><Badge variant="secondary">{TASK_STATUS_LABELS[task.status]}</Badge></TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="size-8" aria-label={"Ações para " + task.title}><Settings /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => open(task.id)}>Ver detalhes</DropdownMenuItem>
                {canEdit && <DropdownMenuItem onSelect={() => edit(task.id)}>Editar tarefa</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
    <TaskPagination {...page.pagination} />
  </div>;
}
