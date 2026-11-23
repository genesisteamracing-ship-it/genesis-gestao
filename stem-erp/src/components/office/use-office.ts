"use client";

import * as React from "react";
import type { DeliveryGroup } from "@prisma/client";
import { getOfficeSnapshotAction } from "@/actions/office-actions";
import {
  buildOfficeFloorplan,
  filterOfficeMembers,
  type OfficeFloorplanLayout,
} from "@/lib/office-layout";
import type {
  OfficeMemberDTO,
  OfficeMemberStatus,
  OfficeSnapshotDTO,
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
  pollIntervalMs?: number;
}

export function useOffice({
  initialSnapshot,
  initialError = null,
  isLoadingInitial = false,
  onRefresh,
  pollIntervalMs = 30000,
}: UseOfficeOptions) {
  const [snapshot, setSnapshot] = React.useState<OfficeSnapshotDTO | null>(
    initialSnapshot
  );
  const [error, setError] = React.useState<string | null>(initialError);
  const [isLoading, setIsLoading] = React.useState<boolean>(isLoadingInitial);
  const [isRefreshing, setIsRefreshing] = React.useState<boolean>(false);

  const [viewMode, setViewMode] = React.useState<OfficeViewMode>("canvas");
  const [search, setSearch] = React.useState<string>("");
  const [sectorFilter, setSectorFilter] = React.useState<DeliveryGroup | "ALL">(
    "ALL"
  );
  const [statusFilter, setStatusFilter] = React.useState<
    OfficeMemberStatus | "ALL"
  >("ALL");
  const [selectedMemberId, setSelectedMemberId] = React.useState<string | null>(
    () =>
      initialSnapshot?.members.find((m) => m.status !== "IDLE")?.id ??
      initialSnapshot?.members[0]?.id ??
      null
  );
  const [focusRequestId, setFocusRequestId] = React.useState<number>(0);

  const fetcher = onRefresh ?? getOfficeSnapshotAction;

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
      }),
    [allMembers, search, sectorFilter, statusFilter]
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
    statusFilter !== "ALL";

  const clearFilters = React.useCallback(() => {
    setSearch("");
    setSectorFilter("ALL");
    setStatusFilter("ALL");
  }, []);

  return {
    snapshot,
    error,
    isLoading,
    isRefreshing,
    refresh,
    viewMode,
    setViewMode,
    search,
    setSearch,
    sectorFilter,
    setSectorFilter,
    statusFilter,
    setStatusFilter,
    hasActiveFilters,
    clearFilters,
    allMembers,
    filteredMembers,
    filteredMemberIds,
    floorplan,
    selectedMember,
    selectedMemberId,
    selectMember,
    focusRequestId,
  };
}
