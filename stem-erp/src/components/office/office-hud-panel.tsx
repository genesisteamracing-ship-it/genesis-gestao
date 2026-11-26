"use client";

import * as React from "react";
import Link from "next/link";
import type { DeliveryGroup } from "@prisma/client";
import {
  AlertTriangle,
  Calendar,
  Clock,
  Coffee,
  ExternalLink,
  Pencil,
  Search,
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
import type { OfficeSectorGroup } from "@/lib/office-layout";
import type {
  OfficeMemberDTO,
  OfficeMemberStatus,
  OfficeSummaryDTO,
  OfficeTaskRole,
} from "@/types/office";
import {
  officeRaciBadgeStyles,
  officeStatusBadgeStyles,
  officeStatusSquareStyles,
} from "./office-styles";
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

const RACI_ROLE_NAMES: Record<OfficeTaskRole, string> = {
  R: "Principal",
  A: "Aprovador",
  C: "Consultado",
  I: "Apoio",
};

const RACI_FILTER_OPTIONS: Array<{ role: OfficeTaskRole; label: string }> = [
  { role: "R", label: "Responsável" },
  { role: "A", label: "Aprovador" },
  { role: "C", label: "Consultado" },
  { role: "I", label: "Informado" },
];

const SECTORS = Object.keys(DELIVERY_GROUP_SHORT_LABELS) as DeliveryGroup[];

interface OfficeHudPanelProps {
  summary: OfficeSummaryDTO;
  sectorGroups: OfficeSectorGroup[];
  selectedMember: OfficeMemberDTO | null;
  canAccessTasks: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  sectorFilter: DeliveryGroup | "ALL";
  onSectorFilterChange: (value: DeliveryGroup | "ALL") => void;
  statusFilter: OfficeMemberStatus | "ALL";
  onStatusFilterChange: (value: OfficeMemberStatus | "ALL") => void;
  roleFilter: OfficeTaskRole | "ALL";
  onRoleFilterChange: (value: OfficeTaskRole | "ALL") => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
  onSelectMember: (memberId: string, focusCamera?: boolean) => void;
}

function formatDateBr(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}/${month}`;
}

interface MemberTreeEntry {
  lead: OfficeMemberDTO;
  collaborators: OfficeMemberDTO[];
}

function buildSectorMemberTree(members: OfficeMemberDTO[]): MemberTreeEntry[] {
  const consumedIds = new Set<string>();
  const entries: MemberTreeEntry[] = [];

  // Prioriza líderes (R / A) primeiro para agrupar seus respectivos colaboradores (C / I)
  const ordered = [...members].sort((a, b) => {
    const aIsLead =
      a.activeTask?.role === "R" || a.activeTask?.role === "A" ? 0 : 1;
    const bIsLead =
      b.activeTask?.role === "R" || b.activeTask?.role === "A" ? 0 : 1;
    return aIsLead - bIsLead;
  });

  for (const member of ordered) {
    if (consumedIds.has(member.id)) continue;
    const isLeadRole =
      member.activeTask &&
      (member.activeTask.role === "R" || member.activeTask.role === "A");

    if (isLeadRole && member.activeTask) {
      const taskId = member.activeTask.id;
      const collaborators = ordered.filter(
        (other) =>
          other.id !== member.id &&
          !consumedIds.has(other.id) &&
          other.activeTask?.id === taskId &&
          (other.activeTask.role === "C" || other.activeTask.role === "I")
      );
      consumedIds.add(member.id);
      for (const c of collaborators) consumedIds.add(c.id);
      entries.push({ lead: member, collaborators });
    } else {
      consumedIds.add(member.id);
      entries.push({ lead: member, collaborators: [] });
    }
  }

  return entries;
}

export function OfficeHudPanel({
  summary,
  sectorGroups,
  selectedMember,
  canAccessTasks,
  search,
  onSearchChange,
  sectorFilter,
  onSectorFilterChange,
  statusFilter,
  onStatusFilterChange,
  roleFilter,
  onRoleFilterChange,
  hasActiveFilters,
  onClearFilters,
  onSelectMember,
}: OfficeHudPanelProps) {
  const searchRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/") return;
      const active = document.activeElement;
      const tag = active?.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleStatus = (target: OfficeMemberStatus) => {
    onStatusFilterChange(statusFilter === target ? "ALL" : target);
  };

  const toggleRole = (target: OfficeTaskRole) => {
    onRoleFilterChange(roleFilter === target ? "ALL" : target);
  };

  return (
    <aside
      aria-label="Painel do Escritório"
      className="flex flex-col gap-3.5 min-w-0"
    >
      {/* Bloco de Busca, Atalho `/` e Chips RACI + Status (estilo Diretório Pixel Office) */}
      <Card className="rounded-2xl border border-border bg-card shadow-xs">
        <CardContent className="p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
              Escritório
            </h2>
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

          {/* Campo de busca com atalho `/` */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar integrante, setor ou tarefa..."
              aria-label="Buscar integrante ou tarefa"
              className="h-8 pl-8 pr-7 text-xs"
            />
            <kbd
              aria-hidden="true"
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.2 text-[10px] font-mono text-muted-foreground"
            >
              /
            </kbd>
          </div>

          {/* Pílulas rápidas de papel RACI (idênticas a Conta C / Conta D) */}
          <div className="flex flex-wrap items-center gap-1.5">
            {RACI_FILTER_OPTIONS.map((opt) => {
              const active = roleFilter === opt.role;
              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => toggleRole(opt.role)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                    active
                      ? "border-primary bg-primary/15 text-foreground"
                      : "border-border bg-secondary/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={officeRaciBadgeStyles({ role: opt.role })}>
                    {opt.role}
                  </span>
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>

          {/* Contadores rápidos de status + filtro de setor */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => toggleStatus("WORKING")}
              aria-pressed={statusFilter === "WORKING"}
              className={`flex items-center justify-between rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                statusFilter === "WORKING"
                  ? "border-success bg-success/15 text-foreground"
                  : "border-border bg-muted/35 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-1 truncate">
                <span className="h-2 w-2 shrink-0 rounded-[2px] bg-success" />
                Ativos
              </span>
              <span className="font-extrabold text-foreground">
                {summary.workingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleStatus("OVERDUE")}
              aria-pressed={statusFilter === "OVERDUE"}
              className={`flex items-center justify-between rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                statusFilter === "OVERDUE"
                  ? "border-destructive bg-destructive/15 text-foreground"
                  : "border-border bg-muted/35 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-1 truncate">
                <span className="h-2 w-2 shrink-0 rounded-[2px] bg-destructive" />
                Atraso
              </span>
              <span className="font-extrabold text-destructive">
                {summary.overdueCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleStatus("IDLE")}
              aria-pressed={statusFilter === "IDLE"}
              className={`flex items-center justify-between rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                statusFilter === "IDLE"
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-muted/35 text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="inline-flex items-center gap-1 truncate">
                <span className="h-2 w-2 shrink-0 rounded-[2px] bg-muted-foreground/60" />
                Livres
              </span>
              <span className="font-extrabold text-foreground">
                {summary.idleCount}
              </span>
            </button>
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
        </CardContent>
      </Card>

      {/* Grupos por Setor com Barra de Progresso & Avatares Pixelados */}
      <div className="space-y-3 max-h-[440px] overflow-y-auto pr-0.5">
        {sectorGroups.length === 0 ? (
          <Card className="rounded-2xl border border-border bg-card shadow-xs">
            <CardContent className="p-5 text-center text-xs text-muted-foreground">
              Nenhum integrante corresponde aos filtros.
            </CardContent>
          </Card>
        ) : (
          sectorGroups.map((group) => {
            const pct =
              group.totalTasksCount > 0
                ? Math.min(
                    100,
                    Math.round(
                      (group.doneTasksCount / group.totalTasksCount) * 100
                    )
                  )
                : 0;
            const tree = buildSectorMemberTree(group.members);
            const hasSelectedInside = group.members.some(
              (m) => m.id === selectedMember?.id
            );

            return (
              <Card
                key={group.id}
                className={`rounded-2xl border bg-card shadow-xs transition-colors ${
                  hasSelectedInside ? "border-primary/50" : "border-border"
                }`}
              >
                <CardContent className="p-3.5 space-y-2.5">
                  {/* Cabeçalho do Setor + Progresso */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-xs font-extrabold text-foreground truncate">
                          {group.label}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.2 text-[10px] font-bold text-muted-foreground">
                          {group.members.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {group.rolesPresent.map((role) => (
                          <span
                            key={role}
                            className={officeRaciBadgeStyles({ role })}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-success transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                        {group.doneTasksCount}/{group.totalTasksCount} tarefas
                      </span>
                    </div>
                  </div>

                  {/* Linhas de integrantes com PixelAvatar + Árvore de Colaboradores */}
                  <ul className="space-y-1.5">
                    {tree.map(({ lead, collaborators }) => {
                      const isSelected = selectedMember?.id === lead.id;
                      const leadRole =
                        lead.activeTask?.role ?? lead.tasks[0]?.role ?? null;

                      return (
                        <li key={lead.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => onSelectMember(lead.id, true)}
                            className={`flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-primary/12 ring-1 ring-primary/45"
                                : "hover:bg-muted/60"
                            }`}
                          >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50">
                              <PixelAvatar
                                seed={lead.id}
                                deliveryGroup={lead.deliveryGroup}
                                status={lead.status}
                                size={36}
                              />
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center justify-between gap-1.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-xs font-bold text-foreground truncate">
                                    {lead.name}
                                  </span>
                                  {leadRole && (
                                    <span
                                      className={officeRaciBadgeStyles({
                                        role: leadRole,
                                      })}
                                    >
                                      {leadRole}
                                    </span>
                                  )}
                                </div>
                                <span className="shrink-0 text-[10px] font-semibold text-muted-foreground">
                                  {leadRole
                                    ? RACI_ROLE_NAMES[leadRole]
                                    : "Disponível"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-1 min-w-0 text-[11px] text-muted-foreground">
                                  {lead.status === "OVERDUE" ? (
                                    <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" />
                                  ) : lead.activeTask ? (
                                    <Pencil className="h-3 w-3 shrink-0 text-warning" />
                                  ) : (
                                    <Coffee className="h-3 w-3 shrink-0 text-muted-foreground" />
                                  )}
                                  <span className="truncate">
                                    {lead.activeTask?.title ?? "Disponível"}
                                  </span>
                                </span>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {lead.activeTask && (
                                    <span className="rounded bg-primary/15 px-1.5 py-0.2 text-[10px] font-bold text-primary">
                                      {formatDateBr(lead.activeTask.endDate)}
                                    </span>
                                  )}
                                  <span
                                    className={officeStatusSquareStyles({
                                      status: lead.status,
                                    })}
                                  />
                                </div>
                              </div>
                            </div>
                          </button>

                          {collaborators.length > 0 && (
                            <div className="ml-5 border-l-2 border-border pl-2.5 space-y-1">
                              <p className="text-[10px] font-semibold text-muted-foreground">
                                {collaborators.length}{" "}
                                {collaborators.length === 1
                                  ? "colaborador na entrega"
                                  : "colaboradores na entrega"}
                              </p>
                              {collaborators.map((sub) => {
                                const subSelected =
                                  selectedMember?.id === sub.id;
                                const subRole = sub.activeTask?.role ?? "C";
                                return (
                                  <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => onSelectMember(sub.id, true)}
                                    className={`flex w-full items-center gap-2 rounded-lg p-1.5 text-left transition-colors cursor-pointer ${
                                      subSelected
                                        ? "bg-primary/12 ring-1 ring-primary/45"
                                        : "hover:bg-muted/50"
                                    }`}
                                  >
                                    <PixelAvatar
                                      seed={sub.id}
                                      deliveryGroup={sub.deliveryGroup}
                                      status={sub.status}
                                      size={28}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-1">
                                        <span className="inline-flex items-center gap-1 min-w-0 text-[11px] font-bold text-foreground truncate">
                                          <span className="truncate">
                                            {sub.name}
                                          </span>
                                          <span
                                            className={officeRaciBadgeStyles({
                                              role: subRole,
                                            })}
                                          >
                                            {subRole}
                                          </span>
                                        </span>
                                        <span
                                          className={officeStatusSquareStyles({
                                            status: sub.status,
                                          })}
                                        />
                                      </div>
                                      <p className="text-[10px] text-muted-foreground truncate">
                                        {sub.activeTask?.title ?? "Apoio"}
                                      </p>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Inspetor compacto do integrante selecionado */}
      {selectedMember && (
        <Card className="rounded-2xl border border-border bg-card shadow-xs">
          <CardContent className="p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <PixelAvatar
                  seed={selectedMember.id}
                  deliveryGroup={selectedMember.deliveryGroup}
                  status={selectedMember.status}
                  size={32}
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {selectedMember.name}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {selectedMember.activeTasksCount} ativas ·{" "}
                    {selectedMember.doneTasksCount} concluídas
                  </p>
                </div>
              </div>
              <span
                className={officeStatusBadgeStyles({
                  status: selectedMember.status,
                })}
              >
                {STATUS_LABELS[selectedMember.status]}
              </span>
            </div>

            {selectedMember.tasks.length > 0 && (
              <ul className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                {selectedMember.tasks.slice(0, 5).map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border/80 bg-muted/30 px-2.5 py-1.5 text-[11px]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground truncate">
                        {task.title}
                      </p>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        {TASK_STATUS_LABELS[task.status] ?? task.status} ·{" "}
                        <Calendar className="h-2.5 w-2.5" />
                        {formatDateBr(task.endDate)}
                      </span>
                    </div>
                    <span
                      className={officeRaciBadgeStyles({ role: task.role })}
                    >
                      {task.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}

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
    </aside>
  );
}
