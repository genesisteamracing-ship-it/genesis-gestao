"use client";

import { useMemo, useState } from "react";
import type { TaskStatus } from "@prisma/client";
import { toast } from "sonner";
import { updateMyTaskStatusAction } from "@/actions/tasks.actions";
import {
  buildMyActivityItems,
  calculateUserActivityKpis,
  filterMyActivities,
  getTodayIsoDate,
  sortMyActivities,
  type DeadlineFilter,
  type MyActivityItem,
  type StatusFilter,
  type UserActivityKpis,
} from "@/lib/my-activities";
import type { TaskActionResult, TaskRecord, TaskWorkspace } from "@/types/tasks";

export const MY_ACTIVITIES_PAGE_SIZE = 10;

export type UpdateStatusAction = (input: {
  teamId: string;
  taskId: string;
  status: TaskStatus;
  revision: number;
}) => Promise<TaskActionResult>;

type UseMyActivitiesOptions = {
  workspace: TaskWorkspace;
  todayIso?: string;
  onUpdateStatus?: UpdateStatusAction;
};

export function useMyActivities({
  workspace,
  todayIso = getTodayIsoDate(),
  onUpdateStatus = updateMyTaskStatusAction,
}: UseMyActivitiesOptions) {
  const [tasks, setTasks] = useState<TaskRecord[]>(workspace.tasks);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [deadlineFilter, setDeadlineFilter] = useState<DeadlineFilter>("ALL");
  const [pageIndex, setPageIndex] = useState(0);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const allMyItems = useMemo<MyActivityItem[]>(
    () => sortMyActivities(buildMyActivityItems(tasks, workspace.currentUserId, todayIso)),
    [tasks, workspace.currentUserId, todayIso],
  );

  const kpis = useMemo<UserActivityKpis>(
    () => calculateUserActivityKpis(allMyItems),
    [allMyItems],
  );

  const filteredItems = useMemo(
    () =>
      filterMyActivities(allMyItems, {
        search,
        status: statusFilter,
        deadline: deadlineFilter,
      }),
    [allMyItems, search, statusFilter, deadlineFilter],
  );

  const totalFiltered = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / MY_ACTIVITIES_PAGE_SIZE));
  const safePageIndex = Math.min(pageIndex, totalPages - 1);

  const paginatedItems = useMemo(() => {
    const start = safePageIndex * MY_ACTIVITIES_PAGE_SIZE;
    return filteredItems.slice(start, start + MY_ACTIVITIES_PAGE_SIZE);
  }, [filteredItems, safePageIndex]);

  const startRow = totalFiltered === 0 ? 0 : safePageIndex * MY_ACTIVITIES_PAGE_SIZE + 1;
  const endRow = Math.min(totalFiltered, (safePageIndex + 1) * MY_ACTIVITIES_PAGE_SIZE);

  function updateSearch(value: string) {
    setSearch(value);
    setPageIndex(0);
  }

  function updateStatusFilter(value: StatusFilter) {
    setStatusFilter(value);
    setPageIndex(0);
  }

  function updateDeadlineFilter(value: DeadlineFilter) {
    setDeadlineFilter(value);
    setPageIndex(0);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setDeadlineFilter("ALL");
    setPageIndex(0);
  }

  async function handleStatusChange(task: TaskRecord, nextStatus: TaskStatus) {
    if (!workspace.canEdit || task.status === nextStatus || pendingTaskId === task.id) return;
    setPendingTaskId(task.id);
    setErrorMessage(null);

    try {
      const result = await onUpdateStatus({
        teamId: workspace.teamId,
        taskId: task.id,
        status: nextStatus,
        revision: task.revision,
      });

      if (!result.ok) {
        setErrorMessage(result.message);
        toast.error(result.message);
        return;
      }

      const nowIso = new Date().toISOString();
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id
            ? {
                ...item,
                status: nextStatus,
                revision: item.revision + 1,
                completedAt: nextStatus === "DONE" ? nowIso : null,
                cancelledAt: nextStatus === "CANCELLED" ? nowIso : null,
              }
            : item,
        ),
      );
      toast.success("Status da atividade atualizado.");
    } catch {
      const fallback = "Não foi possível atualizar o status. Tente novamente.";
      setErrorMessage(fallback);
      toast.error(fallback);
    } finally {
      setPendingTaskId(null);
    }
  }

  return {
    allMyItems,
    filteredItems,
    paginatedItems,
    kpis,
    search,
    statusFilter,
    deadlineFilter,
    pageIndex: safePageIndex,
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
  };
}
