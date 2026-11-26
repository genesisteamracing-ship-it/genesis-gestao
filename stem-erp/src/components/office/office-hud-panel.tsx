"use client";

import * as React from "react";
import Link from "next/link";
import type { DeliveryGroup } from "@prisma/client";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  Search,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DELIVERY_GROUP_SHORT_LABELS } from "@/lib/constants";
import type {
  OfficeMemberDTO,
  OfficeMemberStatus,
  OfficeSummaryDTO,
} from "@/types/office";
import { officeStatusBadgeStyles } from "./office-styles";
import { PixelAvatar } from "./pixel-avatar";

const STATUS_LABELS: Record<OfficeMemberStatus, string> = {
  WORKING: "Em execução",
  OVERDUE: "Em atraso",
  IDLE: "Disponível",
};

const TASK_STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: "Em andamento",
  TODO: "A fazer",
  DONE: "Concluída",
};

const SECTORS = Object.keys(DELIVERY_GROUP_SHORT_LABELS) as DeliveryGroup[];

interface OfficeHudPanelProps {
  summary: OfficeSummaryDTO;
  members: OfficeMemberDTO[];
  selectedMember: OfficeMemberDTO | null;
  canAccessTasks: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  sectorFilter: DeliveryGroup | "ALL";
  onSectorFilterChange: (value: DeliveryGroup | "ALL") => void;
  statusFilter: OfficeMemberStatus | "ALL";
  onStatusFilterChange: (value: OfficeMemberStatus | "ALL") => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onSelectMember: (memberId: string, focusCamera?: boolean) => void;
}

function formatDateBr(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}`;
}

export function OfficeHudPanel({
  summary,
  members,
  selectedMember,
  canAccessTasks,
  search,
  onSearchChange,
  sectorFilter,
  onSectorFilterChange,
  statusFilter,
  onStatusFilterChange,
  hasActiveFilters,
  onClearFilters,
  onSelectMember,
}: OfficeHudPanelProps) {
  const toggleStatusFilter = (target: OfficeMemberStatus) => {
    onStatusFilterChange(statusFilter === target ? "ALL" : target);
  };

  const selectedResponsibleTasks = React.useMemo(
    () =>
      selectedMember
        ? selectedMember.tasks.filter((task) => task.role === "R")
        : [],
    [selectedMember]
  );

  const selectedActiveResponsibleCount = React.useMemo(
    () =>
      selectedResponsibleTasks.filter((task) => task.status === "IN_PROGRESS")
        .length,
    [selectedResponsibleTasks]
  );

  const selectedDoneResponsibleCount = React.useMemo(
    () =>
      selectedResponsibleTasks.filter((task) => task.status === "DONE").length,
    [selectedResponsibleTasks]
  );

  return (
    <aside
      aria-label="Painel do Escritório"
      className="flex flex-col gap-4 min-w-0"
    >
      {/* 4 Contadores Rápidos (estilo HUD my-virtual-office) */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-2">
        <button
          type="button"
          onClick={() => toggleStatusFilter("WORKING")}
          aria-pressed={statusFilter === "WORKING"}
          className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors cursor-pointer ${
            statusFilter === "WORKING"
              ? "border-success bg-success/10"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <span className="text-lg font-bold text-foreground">
            {summary.workingCount}
          </span>
          <span className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-success" />
            Em execução
          </span>
        </button>

        <button
          type="button"
          onClick={() => toggleStatusFilter("IDLE")}
          aria-pressed={statusFilter === "IDLE"}
          className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors cursor-pointer ${
            statusFilter === "IDLE"
              ? "border-primary bg-primary/10"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <span className="text-lg font-bold text-foreground">
            {summary.idleCount}
          </span>
          <span className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-muted-foreground/60" />
            Disponíveis
          </span>
        </button>

        <button
          type="button"
          onClick={() => toggleStatusFilter("OVERDUE")}
          aria-pressed={statusFilter === "OVERDUE"}
          className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors cursor-pointer ${
            statusFilter === "OVERDUE"
              ? "border-destructive bg-destructive/10"
              : "border-border bg-card hover:bg-muted/50"
          }`}
        >
          <span className="text-lg font-bold text-destructive">
            {summary.overdueCount}
          </span>
          <span className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            Em atraso
          </span>
        </button>

        <div className="flex flex-col items-start rounded-xl border border-border bg-card p-3">
          <span className="text-lg font-bold text-foreground">
            {summary.totalDoneTasks}
          </span>
          <span className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <CheckCircle2 className="h-3 w-3 text-success" />
            Concluídas
          </span>
        </div>
      </div>

      {/* Inspetor do Integrante Selecionado */}
      {selectedMember && (
        <Card className="rounded-2xl border border-border bg-card shadow-xs">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
                  <PixelAvatar
                    seed={selectedMember.id}
                    deliveryGroup={selectedMember.deliveryGroup}
                    status={selectedMember.status}
                    size={36}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {selectedMember.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedMember.jobTitle ||
                      (selectedMember.deliveryGroup
                        ? DELIVERY_GROUP_SHORT_LABELS[selectedMember.deliveryGroup]
                        : "Equipe")}
                  </p>
                </div>
              </div>

              <span className={officeStatusBadgeStyles({ status: selectedMember.status })}>
                {STATUS_LABELS[selectedMember.status]}
              </span>
            </div>

            {/* Tarefas do integrante (apenas Responsável R) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                <span>Atividades ({selectedResponsibleTasks.length})</span>
                <span>
                  {selectedActiveResponsibleCount} ativas ·{" "}
                  {selectedDoneResponsibleCount} concluídas
                </span>
              </div>

              {selectedResponsibleTasks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-3 text-center text-xs text-muted-foreground">
                  Nenhuma tarefa sob sua responsabilidade no momento.
                </div>
              ) : (
                <ul className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                  {selectedResponsibleTasks.slice(0, 6).map((task) => (
                    <li
                      key={task.id}
                      className="rounded-xl border border-border/80 bg-muted/30 px-3 py-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground leading-snug line-clamp-2">
                          {task.title}
                        </p>
                        <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                          {task.role}
                        </span>
                      </div>
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          {task.isOverdue ? (
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          <span className={task.isOverdue ? "text-destructive font-semibold" : ""}>
                            {TASK_STATUS_LABELS[task.status] ?? task.status}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateBr(task.endDate)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {canAccessTasks && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs font-semibold gap-1.5"
              >
                <Link href="/tarefas">
                  <span>Abrir quadro de tarefas</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de Integrantes + Filtros */}
      <Card className="rounded-2xl border border-border bg-card shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Integrantes ({members.length})
              </h2>
            </div>
            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
              >
                <X className="h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar integrante ou tarefa..."
                aria-label="Buscar integrante ou tarefa"
                className="h-8 pl-8 text-xs"
              />
            </div>

            <Select
              value={sectorFilter}
              onValueChange={(value) =>
                onSectorFilterChange(value as DeliveryGroup | "ALL")
              }
            >
              <SelectTrigger
                aria-label="Filtrar por setor"
                className="h-8 text-xs"
              >
                <SelectValue placeholder="Todos os setores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos os setores</SelectItem>
                {SECTORS.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {DELIVERY_GROUP_SHORT_LABELS[sector]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {members.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">
              Nenhum integrante corresponde aos filtros.
            </p>
          ) : (
            <ul className="space-y-1 max-h-64 overflow-y-auto pr-0.5">
              {members.map((member) => {
                const isSelected = selectedMember?.id === member.id;
                const dotColor =
                  member.status === "OVERDUE"
                    ? "bg-destructive"
                    : member.status === "WORKING"
                      ? "bg-success"
                      : "bg-muted-foreground/50";

                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => onSelectMember(member.id, true)}
                      className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary/10 ring-1 ring-primary/40"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {member.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {member.activeTask?.title ?? "Disponível"}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] font-medium text-muted-foreground">
                        {member.deliveryGroup
                          ? DELIVERY_GROUP_SHORT_LABELS[member.deliveryGroup]
                          : "Geral"}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </aside>
  );
}
