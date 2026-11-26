"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Pencil,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { formatPertDays, type PertTaskMetrics } from "@/lib/pert-engine";

const PAGE_SIZE = 10;

interface PertTableProps {
  items: PertTaskMetrics[];
  canEdit: boolean;
  onOpenDetail: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
}

export function PertTable({ items, canEdit, onOpenDetail, onEditTask }: PertTableProps) {
  const [pageIndex, setPageIndex] = React.useState(0);

  const totalFiltered = items.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const pageItems = React.useMemo(() => {
    const start = safePageIndex * PAGE_SIZE;
    return items.slice(start, start + PAGE_SIZE);
  }, [items, safePageIndex]);

  const startRow = totalFiltered === 0 ? 0 : safePageIndex * PAGE_SIZE + 1;
  const endRow = Math.min((safePageIndex + 1) * PAGE_SIZE, totalFiltered);
  const canPrevious = safePageIndex > 0;
  const canNext = safePageIndex < totalPages - 1;

  return (
    <div className="space-y-3 p-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-52">Atividade</TableHead>
              <TableHead className="whitespace-nowrap">O / M / P</TableHead>
              <TableHead className="whitespace-nowrap text-right">Te (d)</TableHead>
              <TableHead className="whitespace-nowrap text-right">ES</TableHead>
              <TableHead className="whitespace-nowrap text-right">EF</TableHead>
              <TableHead className="whitespace-nowrap text-right">LS</TableHead>
              <TableHead className="whitespace-nowrap text-right">LF</TableHead>
              <TableHead className="whitespace-nowrap text-right">Folga</TableHead>
              <TableHead className="whitespace-nowrap">Caminho</TableHead>
              <TableHead className="w-14 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageItems.map((item) => {
              const hasPert =
                item.optimisticDays != null &&
                item.mostLikelyDays != null &&
                item.pessimisticDays != null;

              return (
                <TableRow key={item.task.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{item.task.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {DELIVERY_GROUP_LABELS[item.task.deliveryGroup]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                    {hasPert
                      ? `${item.optimisticDays} / ${item.mostLikelyDays} / ${item.pessimisticDays}`
                      : "Datas"}
                  </TableCell>
                  <TableCell className="text-right font-medium tabular-nums">
                    {formatPertDays(item.expectedDuration)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPertDays(item.earlyStart)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPertDays(item.earlyFinish)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPertDays(item.lateStart)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPertDays(item.lateFinish)}
                  </TableCell>
                  <TableCell
                    className={
                      item.isCritical
                        ? "text-right font-semibold tabular-nums text-destructive"
                        : "text-right tabular-nums"
                    }
                  >
                    {formatPertDays(item.totalSlack)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isCritical ? "destructive" : "secondary"}>
                      {item.isCritical ? "Crítico" : "Com folga"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg border-border/80 bg-card hover:bg-muted/80 hover:text-foreground"
                          aria-label={`Ações para ${item.task.title}`}
                        >
                          <Settings className="h-4 w-4 text-foreground transition-transform duration-200 hover:rotate-45" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          className="cursor-pointer gap-2 text-xs font-medium"
                          onSelect={() => onOpenDetail(item.task.id)}
                        >
                          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Detalhes e vínculos</span>
                        </DropdownMenuItem>
                        {canEdit && item.task.canManage !== false && (
                          <DropdownMenuItem
                            className="cursor-pointer gap-2 text-xs font-medium"
                            onSelect={() => onEditTask(item.task.id)}
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-1">
        <p className="text-xs sm:text-sm font-medium text-muted-foreground text-center sm:text-left">
          Mostrando {startRow}-{endRow} de {totalFiltered} atividades
        </p>

        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
            Página {safePageIndex + 1} de {totalPages}
          </span>
          <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-2xs">
            <button
              type="button"
              onClick={() => setPageIndex(0)}
              disabled={!canPrevious}
              aria-label="Primeira página"
              title="Primeira página"
              className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={!canPrevious}
              aria-label="Página anterior"
              title="Página anterior"
              className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPageIndex((prev) => Math.min(totalPages - 1, prev + 1))}
              disabled={!canNext}
              aria-label="Próxima página"
              title="Próxima página"
              className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setPageIndex(totalPages - 1)}
              disabled={!canNext}
              aria-label="Última página"
              title="Última página"
              className="flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
