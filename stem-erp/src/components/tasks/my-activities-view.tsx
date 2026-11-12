"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeadlineFilter, StatusFilter } from "@/lib/my-activities";
import { TASK_STATUS_LABELS, type TaskWorkspace } from "@/types/tasks";
import { MyActivitiesKpis } from "./my-activities-kpis";
import { MyActivitiesTable } from "./my-activities-table";
import { useMyActivities, type UpdateStatusAction } from "./use-my-activities";

type MyActivitiesViewProps = {
  workspace: TaskWorkspace;
  onOpenDetail: (taskId: string) => void;
  isLoading?: boolean;
  todayIso?: string;
  onUpdateStatus?: UpdateStatusAction;
};

export function MyActivitiesView({
  workspace,
  onOpenDetail,
  isLoading = false,
  todayIso,
  onUpdateStatus,
}: MyActivitiesViewProps) {
  const {
    allMyItems,
    paginatedItems,
    kpis,
    search,
    statusFilter,
    deadlineFilter,
    pageIndex,
    totalPages,
    totalFiltered,
    startRow,
    endRow,
    pendingTaskId,
    errorMessage,
    setErrorMessage,
    setPageIndex,
    updateSearch,
    updateStatusFilter,
    updateDeadlineFilter,
    clearFilters,
    handleStatusChange,
  } = useMyActivities({ workspace, todayIso, onUpdateStatus });

  if (isLoading) {
    return (
      <div className="space-y-4" aria-label="Carregando minhas atividades">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <MyActivitiesKpis kpis={kpis} />

      {errorMessage && (
        <div
          role="alert"
          className="flex flex-col items-start justify-between gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive sm:flex-row sm:items-center"
        >
          <span>{errorMessage}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setErrorMessage(null)}>
            Dispensar
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
            placeholder="Buscar por título ou descrição..."
            aria-label="Buscar atividades"
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(value) => updateStatusFilter(value as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-44" aria-label="Filtrar por status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            <SelectItem value="TODO">{TASK_STATUS_LABELS.TODO}</SelectItem>
            <SelectItem value="IN_PROGRESS">{TASK_STATUS_LABELS.IN_PROGRESS}</SelectItem>
            <SelectItem value="DONE">{TASK_STATUS_LABELS.DONE}</SelectItem>
            <SelectItem value="CANCELLED">{TASK_STATUS_LABELS.CANCELLED}</SelectItem>
          </SelectContent>
        </Select>

        <Select value={deadlineFilter} onValueChange={(value) => updateDeadlineFilter(value as DeadlineFilter)}>
          <SelectTrigger className="w-full sm:w-48" aria-label="Filtrar por prazo">
            <SelectValue placeholder="Prazo limite" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os prazos</SelectItem>
            <SelectItem value="OVERDUE">Em atraso</SelectItem>
            <SelectItem value="THIS_WEEK">Esta semana (7 dias)</SelectItem>
            <SelectItem value="NEXT_15_DAYS">Próximos 15 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {allMyItems.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">Você não possui atividades atribuídas no momento.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Quando uma tarefa for atribuída a você como executor, ela aparecerá aqui ordenada pelo prazo limite.
          </p>
        </div>
      ) : totalFiltered === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm font-medium text-foreground">Nenhuma atividade encontrada para os filtros selecionados.</p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={clearFilters}>
            Limpar filtros
          </Button>
        </div>
      ) : (
        <MyActivitiesTable
          items={paginatedItems}
          canEdit={workspace.canEdit}
          pendingTaskId={pendingTaskId}
          pageIndex={pageIndex}
          totalPages={totalPages}
          totalFiltered={totalFiltered}
          startRow={startRow}
          endRow={endRow}
          onPageChange={setPageIndex}
          onStatusChange={handleStatusChange}
          onOpenDetail={onOpenDetail}
        />
      )}
    </div>
  );
}
