"use client";

import * as React from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeamDTO, TeamMemberDTO } from "@/types/auth";
import { usePermissionsTable } from "./use-permissions-table";
import { ModulePermissionToggle } from "./module-permission-toggle";
import { PermissionsRowActions } from "./permissions-row-actions";

export interface PermissionsTableProps {
  teams: TeamDTO[];
  members: TeamMemberDTO[];
  currentUserId: string;
}

export function PermissionsTable({
  teams,
  members,
  currentUserId,
}: PermissionsTableProps) {
  const {
    searchTerm,
    setSearchTerm,
    teamFilter,
    setTeamFilter,
    loadingMap,
    totalFiltered,
    totalPages,
    currentPage,
    setCurrentPage,
    paginatedMembers,
    startRow,
    endRow,
    handleTogglePermission,
    handleGrantAll,
    handleRestrictOperational,
  } = usePermissionsTable({
    initialMembers: members,
    currentUserId,
  });

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-xs">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 sm:p-6 border-b border-border">
        <div>
          <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>Matriz de Acessos por Módulo</span>
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Clique no botão alternador (SIM / NÃO) para conceder ou revogar o acesso imediato de cada integrante.
          </p>
        </div>

        {/* Filtros: Busca e Seleção de Equipe */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar integrante..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs sm:text-sm"
              aria-label="Buscar integrante por nome ou e-mail"
            />
          </div>

          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="h-9 w-full sm:w-48 text-xs sm:text-sm">
              <SelectValue placeholder="Todas as Equipes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as Equipes</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {totalFiltered === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
              <UserCheck className="h-6 w-6" />
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-foreground">
              Nenhum integrante encontrado
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-sm">
              Nenhum usuário corresponde aos critérios de busca ou filtro selecionados.
            </p>
          </div>
        ) : (
          <>
            {/* Tabela Desktop */}
            <div className="hidden lg:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[280px]">Integrante</TableHead>
                    <TableHead className="w-[160px]">Equipe</TableHead>
                    <TableHead className="text-center w-[130px]">Financeiro</TableHead>
                    <TableHead className="text-center w-[130px]">ROI</TableHead>
                    <TableHead className="text-center w-[130px]">Comunicação</TableHead>
                    <TableHead className="text-center w-[140px]">Equipe & Acessos</TableHead>
                    <TableHead className="text-right w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMembers.map((member) => {
                    const isSelf = member.id === currentUserId;

                    return (
                      <TableRow key={member.id} className="hover:bg-muted/40 transition-colors">
                        <TableCell>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-foreground truncate">
                                {member.name}
                              </span>
                              {isSelf && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/40 text-primary">
                                  Você
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                            {member.jobTitle && (
                              <p className="text-[11px] text-muted-foreground/80 font-medium truncate mt-0.5">
                                {member.jobTitle}
                              </p>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium truncate">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{member.teamName || "Sem equipe"}</span>
                          </div>
                        </TableCell>

                        {/* Módulo Financeiro */}
                        <TableCell className="text-center">
                          <ModulePermissionToggle
                            moduleLabel="Financeiro"
                            userName={member.name}
                            allowed={member.permissions.finance}
                            isLoading={Boolean(loadingMap[`${member.id}-finance`])}
                            onToggle={(next) =>
                              handleTogglePermission(member, "finance", next)
                            }
                          />
                        </TableCell>

                        {/* Módulo ROI */}
                        <TableCell className="text-center">
                          <ModulePermissionToggle
                            moduleLabel="ROI"
                            userName={member.name}
                            allowed={member.permissions.roi}
                            isLoading={Boolean(loadingMap[`${member.id}-roi`])}
                            onToggle={(next) =>
                              handleTogglePermission(member, "roi", next)
                            }
                          />
                        </TableCell>

                        {/* Módulo Comunicação */}
                        <TableCell className="text-center">
                          <ModulePermissionToggle
                            moduleLabel="Comunicação"
                            userName={member.name}
                            allowed={member.permissions.communication}
                            isLoading={Boolean(loadingMap[`${member.id}-communication`])}
                            onToggle={(next) =>
                              handleTogglePermission(member, "communication", next)
                            }
                          />
                        </TableCell>

                        {/* Módulo Equipe & Acessos */}
                        <TableCell className="text-center">
                          <ModulePermissionToggle
                            moduleLabel="Equipe & Acessos"
                            userName={member.name}
                            allowed={member.permissions.team}
                            disabled={isSelf}
                            disabledReason="Você não pode revogar seu próprio acesso de administrador."
                            isLoading={Boolean(loadingMap[`${member.id}-team`])}
                            onToggle={(next) =>
                              handleTogglePermission(member, "team", next)
                            }
                          />
                        </TableCell>

                        {/* Menu de Engrenagem (Ações da Linha) */}
                        <TableCell className="text-right">
                          <div className="flex justify-end">
                            <PermissionsRowActions
                              member={member}
                              isSelf={isSelf}
                              onGrantAll={() => handleGrantAll(member)}
                              onRestrictOperational={() =>
                                handleRestrictOperational(member)
                              }
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Visualização em Cards no Mobile */}
            <div className="block lg:hidden divide-y divide-border">
              {paginatedMembers.map((member) => {
                const isSelf = member.id === currentUserId;

                return (
                  <div key={member.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm text-foreground truncate">
                            {member.name}
                          </p>
                          {isSelf && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-primary/40 text-primary">
                              Você
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        <p className="text-[11px] text-muted-foreground/80 font-medium truncate mt-0.5">
                          {member.teamName || "Sem equipe"} • {member.jobTitle || "Membro"}
                        </p>
                      </div>

                      <PermissionsRowActions
                        member={member}
                        isSelf={isSelf}
                        onGrantAll={() => handleGrantAll(member)}
                        onRestrictOperational={() =>
                          handleRestrictOperational(member)
                        }
                      />
                    </div>

                    {/* Grade de Toggles no Mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/30">
                        <span className="text-xs font-semibold text-foreground">Financeiro</span>
                        <ModulePermissionToggle
                          moduleLabel="Financeiro"
                          userName={member.name}
                          allowed={member.permissions.finance}
                          isLoading={Boolean(loadingMap[`${member.id}-finance`])}
                          onToggle={(next) =>
                            handleTogglePermission(member, "finance", next)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/30">
                        <span className="text-xs font-semibold text-foreground">ROI & Cotas</span>
                        <ModulePermissionToggle
                          moduleLabel="ROI"
                          userName={member.name}
                          allowed={member.permissions.roi}
                          isLoading={Boolean(loadingMap[`${member.id}-roi`])}
                          onToggle={(next) =>
                            handleTogglePermission(member, "roi", next)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/30">
                        <span className="text-xs font-semibold text-foreground">Comunicação</span>
                        <ModulePermissionToggle
                          moduleLabel="Comunicação"
                          userName={member.name}
                          allowed={member.permissions.communication}
                          isLoading={Boolean(loadingMap[`${member.id}-communication`])}
                          onToggle={(next) =>
                            handleTogglePermission(member, "communication", next)
                          }
                        />
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/30">
                        <span className="text-xs font-semibold text-foreground">Equipe & Acessos</span>
                        <ModulePermissionToggle
                          moduleLabel="Equipe & Acessos"
                          userName={member.name}
                          allowed={member.permissions.team}
                          disabled={isSelf}
                          disabledReason="Você não pode revogar seu próprio acesso de administrador."
                          isLoading={Boolean(loadingMap[`${member.id}-team`])}
                          onToggle={(next) =>
                            handleTogglePermission(member, "team", next)
                          }
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Rodapé Padrão Universal de Paginação (Regra 9 do AGENTS.md) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground text-center sm:text-left">
                Mostrando {startRow}-{endRow} de {totalFiltered} integrantes
              </p>

              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                  Página {currentPage} de {totalPages}
                </span>

                <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-card shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage <= 1}
                    aria-label="Primeira página"
                    title="Primeira página"
                    className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    aria-label="Página anterior"
                    title="Página anterior"
                    className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    aria-label="Próxima página"
                    title="Próxima página"
                    className="flex h-8 w-8 items-center justify-center border-r border-border text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage >= totalPages}
                    aria-label="Última página"
                    title="Última página"
                    className="flex h-8 w-8 items-center justify-center text-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
