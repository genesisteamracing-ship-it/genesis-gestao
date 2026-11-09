import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TaskPagination, useTaskPage } from "./task-fields";
import type { TaskPerson, TaskRecord } from "@/types/tasks";

export function TaskRaci({ tasks, members }: { tasks: TaskRecord[]; members: TaskPerson[] }) {
  const page = useTaskPage(tasks);
  const people = new Map(members.map((person) => [person.key, person]));
  for (const task of tasks) for (const { person } of task.roles) people.set(person.key, person);
  const columns = [...people.values()];
  return <section aria-label="Matriz RACI" className="min-w-0 space-y-3">
    <p className="text-sm text-muted-foreground">A · Responde pela entrega &nbsp; R · Executa &nbsp; C · Consultado &nbsp; I · Informado</p>
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 z-10 min-w-40 bg-card" scope="col">Tarefa</TableHead>
            {columns.map((person) => <TableHead key={person.key} scope="col">{person.name}{!person.available && " (indisponível)"}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>{page.items.map((task) => {
          const roles = new Map<string, string[]>();
          for (const { person, role } of task.roles) roles.set(person.key, [...(roles.get(person.key) ?? []), role]);
          return <TableRow key={task.id}>
            <th scope="row" className="sticky left-0 z-10 bg-card p-2 text-left text-sm font-medium">
              <span>{task.title}</span>
              {!task.roles.some(({ role }) => role === "R") && <span className="block text-xs text-muted-foreground">Sem executor</span>}
            </th>
            {columns.map((person) => <TableCell key={person.key}>{roles.get(person.key)?.join(" / ") ?? "—"}</TableCell>)}
          </TableRow>;
        })}</TableBody>
      </Table>
    </div>
    <TaskPagination {...page.pagination} />
  </section>;
}
