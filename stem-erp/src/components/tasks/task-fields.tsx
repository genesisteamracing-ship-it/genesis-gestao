import { useId, useState, type ReactNode } from "react";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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

export function TaskMultiSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione",
  emptyMessage = "Nenhuma opção disponível",
  disabled = false,
}: {
  label: string;
  value: readonly string[];
  onChange: (keys: string[]) => void;
  options: readonly { key: string; name: string; available?: boolean }[];
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const contentId = useId();

  const selectedNames = value
    .map((k) => options.find((o) => o.key === k)?.name)
    .filter(Boolean) as string[];

  let summary = placeholder;
  if (selectedNames.length === 1) {
    summary = selectedNames[0];
  } else if (selectedNames.length === 2) {
    summary = `${selectedNames[0]}, ${selectedNames[1]}`;
  } else if (selectedNames.length > 2) {
    summary = `${selectedNames[0]}, ${selectedNames[1]} (+${selectedNames.length - 2})`;
  }

  const toggle = (key: string) => {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else {
      onChange([...value, key]);
    }
  };

  return (
    <TaskField label={label}>
      {(id) => (
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              id={id}
              role="combobox"
              aria-label={label}
              aria-expanded={open}
              aria-controls={contentId}
              disabled={disabled}
              className={cn(
                "flex h-9 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-1 text-xs shadow-2xs transition-colors",
                "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              )}
            >
              <span className={cn("truncate text-left", value.length === 0 && "text-muted-foreground")}>
                {summary}
              </span>
              <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            id={contentId}
            align="start"
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px] max-h-56 overflow-y-auto p-1"
          >
            {options.length === 0 ? (
              <div className="py-3 px-2 text-center text-xs text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              options.map((option) => {
                const isChecked = value.includes(option.key);
                return (
                  <DropdownMenuItem
                    key={option.key}
                    onSelect={(event) => {
                      event.preventDefault();
                      toggle(option.key);
                    }}
                    className="flex items-center gap-2 cursor-pointer text-xs py-1.5 px-2 rounded-md hover:bg-muted focus:bg-muted"
                  >
                    <input
                      type="checkbox"
                      aria-label={option.name}
                      checked={isChecked}
                      onChange={() => {}}
                      tabIndex={-1}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer pointer-events-none"
                    />
                    <span className="flex-1 truncate">{option.name}</span>
                    {option.available === false && (
                      <span className="text-[10px] text-muted-foreground">(indisponível)</span>
                    )}
                  </DropdownMenuItem>
                );
              })
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </TaskField>
  );
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
