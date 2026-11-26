"use client";

import * as React from "react";
import type { DeliveryGroup } from "@prisma/client";
import { toast } from "sonner";
import {
  getOfficeSnapshotAction,
  markTrainingAttendanceAction,
} from "@/actions/office-actions";
import {
  buildOfficeFloorplan,
  filterOfficeMembers,
  groupMembersBySector,
  type OfficeFloorplanLayout,
  type OfficeSectorGroup,
} from "@/lib/office-layout";
import type {
  OfficeMemberDTO,
  OfficeMemberStatus,
  OfficeSnapshotDTO,
  OfficeTaskRole,
} from "@/types/office";

export type OfficeViewMode = "canvas" | "list";

interface UseOfficeOptions {
  initialSnapshot: OfficeSnapshotDTO | null;
  initialError?: string | null;
  isLoadingInitial?: boolean;
  onRefresh?: () => Promise<{
    success: boolean;
    data?: OfficeSnapshotDTO;
    error?: string;
  }>;
  onMarkAttendance?: () => Promise<{
    success: boolean;
    data?: OfficeSnapshotDTO;
    message?: string;
    alreadyMarked?: boolean;
    error?: string;
  }>;
  pollIntervalMs?: number;
}

export function useOffice({
  initialSnapshot,
  initialError = null,
  isLoadingInitial = false,
  onRefresh,
  onMarkAttendance,
  pollIntervalMs = 30000,
}: UseOfficeOptions) {
  const [snapshot, setSnapshot] = React.useState<OfficeSnapshotDTO | null>(
    initialSnapshot
  );
  const [error, setError] = React.useState<string | null>(initialError);
  const [isLoading, setIsLoading] = React.useState<boolean>(isLoadingInitial);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);
  const [isMarkingAttendance, setIsMarkingAttendance] =
    React.useState<boolean>(false);

  const [viewMode, setViewMode] = React.useState<OfficeViewMode>("canvas");
  const [search, setSearch] = React.useState<string>("");
  const [sectorFilter, setSectorFilter] = React.useState<DeliveryGroup | "ALL">(
    "ALL"
  );
  const [statusFilter, setStatusFilter] = React.useState<
    OfficeMemberStatus | "ALL"
  >("ALL");
  const [roleFilter, setRoleFilter] = React.useState<OfficeTaskRole | "ALL">(
    "ALL"
  );
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(
    () =>
      initialSnapshot?.members.find((m) => m.status !== "IDLE")?.id ??
      initialSnapshot?.members[0]?.id ??
      null
  );
  const [focusRequestId, setFocusRequestId] = React.useState<number>(0);

  const fetcher = onRefresh ?? getOfficeSnapshotAction;
  const attendanceHandler = onMarkAttendance ?? markTrainingAttendanceAction;

  const markAttendance = React.useCallback(async () => {
    setIsMarkingAttendance(true);
    try {
      const result = await attendanceHandler();
      if (result.success && result.data) {
        setSnapshot(result.data);
        setError(null);
        toast.success(
          result.message ?? "Presença marcada com sucesso no treino de hoje!"
        );
      } else {
        toast.error(
          result.error ?? "Não foi possível marcar presença no treino."
        );
      }
    } catch {
      toast.error("Falha de conexão ao marcar presença no treino.");
    } finally {
      setIsMarkingAttendance(false);
    }
  }, [attendanceHandler]);

  const refresh = React.useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await fetcher();
      if (result.success && result.data) {
        setSnapshot(result.data);
        setError(null);
      } else {
        setError(
          result.error ?? "Não foi possível atualizar o escritório virtual."
        );
      }
    } catch {
      setError("Falha de conexão ao atualizar o escritório virtual.");
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, [fetcher]);

  React.useEffect(() => {
    if (!pollIntervalMs || pollIntervalMs <= 0) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refresh();
      }
    }, pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [pollIntervalMs, refresh]);

  const allMembers = React.useMemo(
    () => snapshot?.members ?? [],
    [snapshot?.members]
  );

  const filteredMembers = React.useMemo(
    () =>
      filterOfficeMembers(allMembers, {
        search,
        sector: sectorFilter,
        status: statusFilter,
        role: roleFilter,
      }),
    [allMembers, search, sectorFilter, statusFilter, roleFilter]
  );

  const sectorGroups: OfficeSectorGroup[] = React.useMemo(
    () => groupMembersBySector(filteredMembers),
    [filteredMembers]
  );

  const filteredMemberIds = React.useMemo(
    () => new Set(filteredMembers.map((m) => m.id)),
    [filteredMembers]
  );

  const floorplan: OfficeFloorplanLayout = React.useMemo(
    () => buildOfficeFloorplan(allMembers),
    [allMembers]
  );

  const selectedMember: OfficeMemberDTO | null = React.useMemo(() => {
    if (!selectedMemberId) return null;
    return allMembers.find((m) => m.id === selectedMemberId) ?? null;
  }, [allMembers, selectedMemberId]);

  const selectMember = React.useCallback(
    (memberId: string | null, shouldFocusCamera = false) => {
      setSelectedMemberId(memberId);
      if (shouldFocusCamera && memberId) {
        setFocusRequestId((prev) => prev + 1);
      }
    },
    []
  );

  const hasActiveFilters =
    search.trim().length > 0 ||
    sectorFilter !== "ALL" ||
    statusFilter !== "ALL" ||
    roleFilter !== "ALL";

  const clearFilters = React.useCallback(() => {
    setSearch("");
    setSectorFilter("ALL");
    setStatusFilter("ALL");
    setRoleFilter("ALL");
  }, []);

  return {
    snapshot,
    error,
    isLoading,
    isRefreshing,
    isMarkingAttendance,
    refresh,
    markAttendance,
    viewMode,
    setViewMode,
    search,
    setSearch,
    sectorFilter,
    setSectorFilter,
    statusFilter,
    setStatusFilter,
    roleFilter,
    setRoleFilter,
    hasActiveFilters,
    clearFilters,
    allMembers,
    filteredMembers,
    sectorGroups,
    filteredMemberIds,
    floorplan,
    selectedMember,
    selectedMemberId,
    selectMember,
    focusRequestId,
  };
}
