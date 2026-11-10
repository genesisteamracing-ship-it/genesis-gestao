import { Eye, Pencil, Settings, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { formatTaskDate } from "@/lib/task-schedule";
import { TASK_STATUS_LABELS, type TaskRecord } from "@/types/tasks";
import { TaskPagination, useTaskPage } from "./task-fields";

export function TaskList({
  tasks,
  canEdit,
  open,
  edit,
  remove,
}: {
  tasks: TaskRecord[];
  canEdit: boolean;
  open: (id: string) => void;
  edit: (id: string) => void;
  remove?: (task: TaskRecord) => void;
}) {
  const page = useTaskPage(tasks);
  return (
    <div>
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table aria-label="Tarefas">
          <TableHeader>
            <TableRow>
              <TableHead>Tarefa</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Prazo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.items.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <span className="font-medium">{task.title}</span>
                  {!task.roles.some(({ role }) => role === "R") && (
                    <span className="block text-xs text-muted-foreground">Sem executor</span>
                  )}
                </TableCell>
                <TableCell>{DELIVERY_GROUP_LABELS[task.deliveryGroup]}</TableCell>
                <TableCell>
                  {formatTaskDate(task.startDate)} — {formatTaskDate(task.endDate)}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{TASK_STATUS_LABELS[task.status]}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-lg border-border/80 bg-card hover:bg-muted/80 hover:text-foreground cursor-pointer"
                        aria-label={"Ações para " + task.title}
                      >
                        <Settings className="h-4 w-4 text-foreground transition-transform duration-200 hover:rotate-45" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        onSelect={() => open(task.id)}
                        className="cursor-pointer gap-2 text-xs font-medium"
                      >
                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Ver detalhes</span>
                      </DropdownMenuItem>
                      {canEdit && (
                        <>
                          <DropdownMenuItem
                            onSelect={() => edit(task.id)}
                            className="cursor-pointer gap-2 text-xs font-medium"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Editar tarefa</span>
                          </DropdownMenuItem>
                          {remove && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onSelect={() => remove(task)}
                                className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Excluir tarefa</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <TaskPagination {...page.pagination} />
    </div>
  );
}
