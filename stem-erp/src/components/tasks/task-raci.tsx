import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { tv } from "tailwind-variants";
import { TaskPagination, useTaskPage } from "./task-fields";
import type { TaskPerson, TaskRecord, TaskRole } from "@/types/tasks";

const roleStyles = tv({
  base: "inline-flex size-6 shrink-0 items-center justify-center rounded-md text-xs font-semibold text-foreground",
  variants: {
    role: {
      A: "bg-success/20",
      R: "bg-destructive/20",
      C: "bg-primary/20",
      I: "bg-amber/20",
    } satisfies Record<TaskRole, string>,
  },
});

const legend = [
  { role: "A", label: "Responde pela entrega" },
  { role: "R", label: "Executa" },
  { role: "C", label: "Consultado" },
  { role: "I", label: "Informado" },
] as const;

export function TaskRaci({ tasks, members }: { tasks: TaskRecord[]; members: TaskPerson[] }) {
  const page = useTaskPage(tasks);
  const people = new Map(members.map((person) => [person.key, person]));
  for (const task of tasks) for (const { person } of task.roles) people.set(person.key, person);
  const columns = [...people.values()];
  return <section aria-label="Matriz RACI" className="min-w-0 space-y-3">
    <ul aria-label="Legenda RACI" className="flex flex-wrap gap-x-3 gap-y-2 text-sm text-muted-foreground">
      {legend.map(({ role, label }) => <li key={role} className="flex items-center gap-1.5">
        <span className={roleStyles({ role })}>{role}</span>
        {label}
      </li>)}
    </ul>
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 min-w-40 bg-card" scope="col">Tarefa</TableHead>
            {columns.map((person) => <TableHead key={person.key} scope="col">{person.name}{!person.available && " (indisponível)"}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>{page.items.map((task) => {
          const roles = new Map<string, TaskRole[]>();
          for (const { person, role } of task.roles) roles.set(person.key, [...(roles.get(person.key) ?? []), role]);
          return <TableRow key={task.id}>
            <th scope="row" className="sticky left-0 z-10 bg-card p-2 text-left text-sm font-medium">
              <span>{task.title}</span>
              {!task.roles.some(({ role }) => role === "R") && <span className="block text-xs text-muted-foreground">Sem executor</span>}
            </th>
            {columns.map((person) => {
              const assigned = roles.get(person.key);
              return <TableCell key={person.key}>{assigned ? (
                <ul className="inline-flex flex-wrap gap-1">
                  {assigned.map((role) => <li key={role} className={roleStyles({ role })}>{role}</li>)}
                </ul>
              ) : "—"}</TableCell>;
            })}
          </TableRow>;
        })}</TableBody>
      </Table>
    </div>
    <TaskPagination {...page.pagination} />
  </section>;
}
