"use client";

import * as React from "react";
import {
  AlertCircle,
  Building2,
  List,
  RefreshCw,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DELIVERY_GROUP_SHORT_LABELS } from "@/lib/constants";
import type { OfficeSnapshotDTO } from "@/types/office";
import { OfficeCanvas } from "./office-canvas";
import { OfficeHudPanel } from "./office-hud-panel";
import { officeStatusBadgeStyles } from "./office-styles";
import { PixelAvatar } from "./pixel-avatar";
import { useOffice } from "./use-office";

const STATUS_LABELS = {
  WORKING: "Em execução",
  OVERDUE: "Em atraso",
  IDLE: "Disponível",
} as const;

export interface OfficeViewProps {
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

export function OfficeView({
  initialSnapshot,
  initialError = null,
  isLoadingInitial = false,
  onRefresh,
  pollIntervalMs = 30000,
}: OfficeViewProps) {
  const office = useOffice({
    initialSnapshot,
    initialError,
    isLoadingInitial,
    onRefresh,
    pollIntervalMs,
  });

  if (office.isLoading) {
    return (
      <section aria-label="Carregando escritório virtual" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-56 rounded-xl" />
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="h-[580px] w-full rounded-2xl" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <Skeleton className="h-18 rounded-xl" />
              <Skeleton className="h-18 rounded-xl" />
              <Skeleton className="h-18 rounded-xl" />
              <Skeleton className="h-18 rounded-xl" />
            </div>
            <Skeleton className="h-56 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </section>
    );
  }

  if (office.error && !office.snapshot) {
    return (
      <Card className="rounded-2xl border border-destructive/30 bg-card shadow-xs">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h2 className="text-base font-bold text-foreground">
              Não foi possível carregar o escritório virtual
            </h2>
            <p className="text-xs text-muted-foreground">{office.error}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void office.refresh()}
            className="gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!office.snapshot || office.allMembers.length === 0) {
    return (
      <Card className="rounded-2xl border border-border bg-card shadow-xs">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-md">
            <h2 className="text-base font-bold text-foreground">
              Nenhum integrante ativo na equipe
            </h2>
            <p className="text-xs text-muted-foreground">
              Cadastre integrantes ativos para visualizar suas estações e tarefas em tempo real.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeCount =
    office.snapshot.summary.workingCount + office.snapshot.summary.overdueCount;

  return (
    <section className="space-y-4">
      {/* Barra superior: Alternador de Visualização (Canvas / Lista) + Atualização */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Modo de visualização do escritório"
          className="inline-flex items-center rounded-xl border border-border bg-card p-1 shadow-2xs w-full sm:w-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={office.viewMode === "canvas"}
            onClick={() => office.setViewMode("canvas")}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              office.viewMode === "canvas"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Escritório (Canvas)</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={office.viewMode === "list"}
            onClick={() => office.setViewMode("list")}
            className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              office.viewMode === "list"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>Lista</span>
          </button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void office.refresh()}
          disabled={office.isRefreshing}
          className="h-9 gap-1.5 text-xs font-semibold w-full sm:w-auto"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${office.isRefreshing ? "animate-spin" : ""}`}
          />
          <span>Atualizar agora</span>
        </Button>
      </div>

      {/* Layout Principal: Escritório + HUD Lateral */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="min-w-0">
          {office.viewMode === "canvas" ? (
            <OfficeCanvas
              floorplan={office.floorplan}
              filteredMemberIds={office.filteredMemberIds}
              hasActiveFilters={office.hasActiveFilters}
              selectedMemberId={office.selectedMemberId}
              focusRequestId={office.focusRequestId}
              teamName={office.snapshot.teamName}
              activeCount={activeCount}
              totalMembers={office.snapshot.summary.totalMembers}
              onSelectMember={(memberId) => office.selectMember(memberId, false)}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {office.filteredMembers.map((member) => {
                const isSelected = office.selectedMemberId === member.id;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => office.selectMember(member.id, false)}
                    className={`flex items-start gap-3 rounded-2xl border bg-card p-4 text-left shadow-xs transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary ring-2 ring-primary/30"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
                      <PixelAvatar
                        seed={member.id}
                        deliveryGroup={member.deliveryGroup}
                        status={member.status}
                        size={40}
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-foreground truncate">
                          {member.name}
                        </p>
                        <span
                          className={officeStatusBadgeStyles({
                            status: member.status,
                          })}
                        >
                          {STATUS_LABELS[member.status]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.deliveryGroup
                          ? DELIVERY_GROUP_SHORT_LABELS[member.deliveryGroup]
                          : "Geral"}
                        {member.jobTitle ? ` · ${member.jobTitle}` : ""}
                      </p>
                      <p className="pt-1 text-xs font-semibold text-foreground truncate">
                        {member.activeTask
                          ? member.activeTask.title
                          : "Nenhuma tarefa em execução"}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <OfficeHudPanel
          summary={office.snapshot.summary}
          members={office.filteredMembers}
          selectedMember={office.selectedMember}
          canAccessTasks={office.snapshot.canAccessTasks}
          search={office.search}
          onSearchChange={office.setSearch}
          sectorFilter={office.sectorFilter}
          onSectorFilterChange={office.setSectorFilter}
          statusFilter={office.statusFilter}
          onStatusFilterChange={office.setStatusFilter}
          hasActiveFilters={office.hasActiveFilters}
          onClearFilters={office.clearFilters}
          onSelectMember={office.selectMember}
        />
      </div>
    </section>
  );
}
