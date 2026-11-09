import { useId, useState, type ReactNode } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TaskField({ label, children }: { label: string; children: (id: string) => ReactNode }) {
  const id = useId();
  return <div className="flex min-w-0 flex-col justify-between gap-1.5">
    <Label htmlFor={id} className="flex min-h-8 items-end text-xs font-semibold">{label}</Label>
    {children(id)}
  </div>;
}

export function TaskSelect({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (value: string) => void;
  options: readonly { value: string; label: string }[]; placeholder?: string;
}) {
  return <TaskField label={label}>{(id) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className="w-full"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>{options.map((option) => (
        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
      ))}</SelectContent>
    </Select>
  )}</TaskField>;
}

const PAGE_SIZE = 10;

export function useTaskPage<T>(items: T[]) {
  const [pageIndex, setPageIndex] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = Math.min(pageIndex, pages - 1);
  const start = page * PAGE_SIZE;
  return {
    items: items.slice(start, start + PAGE_SIZE),
    pagination: { page, pages, start, count: items.length, setPage: setPageIndex },
  };
}

export function TaskPagination({ page, pages, start, count, setPage }: {
  page: number; pages: number; start: number; count: number; setPage: (page: number) => void;
}) {
  const controls = [
    { label: "Primeira página", icon: ChevronsLeft, to: 0, disabled: page === 0 },
    { label: "Página anterior", icon: ChevronLeft, to: page - 1, disabled: page === 0 },
    { label: "Próxima página", icon: ChevronRight, to: page + 1, disabled: page === pages - 1 },
    { label: "Última página", icon: ChevronsRight, to: pages - 1, disabled: page === pages - 1 },
  ];
  return <div className="flex flex-col items-center justify-between gap-3 py-3 text-xs sm:flex-row">
    <p className="font-medium text-muted-foreground">Mostrando {count ? start + 1 : 0}-{Math.min(count, start + PAGE_SIZE)} de {count} tarefas</p>
    <div className="flex items-center gap-2">
      <span className="whitespace-nowrap text-muted-foreground">Página {page + 1} de {pages}</span>
      <div className="inline-flex overflow-hidden rounded-lg border border-border bg-card shadow-xs">
        {controls.map(({ label, icon: Icon, to, disabled }) => (
          <Button key={label} variant="ghost" size="icon" className="size-8 rounded-none border-r last:border-r-0"
            aria-label={label} title={label} disabled={disabled} onClick={() => setPage(to)}><Icon /></Button>
        ))}
      </div>
    </div>
  </div>;
}
