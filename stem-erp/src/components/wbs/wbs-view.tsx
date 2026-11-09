"use client";

import * as React from "react";
import {
  AlertTriangle,
  Filter,
  Network,
  Plus,
  Search,
  TableProperties,
} from "lucide-react";
import type { AuthenticatedUserDTO } from "@/types/auth";
import type { DashboardMetricsDTO } from "@/types/financial";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWbs } from "@/hooks/use-wbs";
import { WbsHeaderMetrics } from "./wbs-header-metrics";
import { WbsTreeTable, DISCIPLINE_LABELS } from "./wbs-tree-table";
import { WbsFlowCanvas } from "./wbs-flow-canvas";
import { WbsNodeModal } from "./wbs-node-modal";
import type { DeliveryGroup, WbsTreeDataResult } from "@/types/wbs";

interface WbsViewProps {
  currentUser: AuthenticatedUserDTO;
  dashboardMetrics: DashboardMetricsDTO;
  initialWbsData?: WbsTreeDataResult;
}

export function WbsView({
  currentUser,
  dashboardMetrics,
  initialWbsData,
}: WbsViewProps) {
  const activeTeam = dashboardMetrics.activeTeam;

  const {
    tree,
    metrics,
    members,
    expandedNodeIds,
    searchQuery,
    setSearchQuery,
    selectedDiscipline,
    setSelectedDiscipline,
    isPresentationMode,
    setIsPresentationMode,
    isLoading,
    modalState,
    deleteConfirmNode,
    setDeleteConfirmNode,
    toggleExpand,
    expandAll,
    collapseAll,
    expandToDepth,
    openCreateRoot,
    openCreateChild,
    openEdit,
    closeModal,
    handleSaveNode,
    confirmDeleteNode,
  } = useWbs(activeTeam.id, initialWbsData);

  const isAuditor = currentUser.role === "AUDITOR";
  const [viewMode, setViewMode] = React.useState<"canvas" | "table">("canvas");

  const headerAction = !isAuditor ? (
    <Button
      onClick={openCreateRoot}
      className="gap-2 text-xs font-semibold cursor-pointer shrink-0 shadow-2xs"
    >
      <Plus className="h-4 w-4" />
      <span>Novo Entregável</span>
    </Button>
  ) : undefined;

  return (
    <DashboardShell
      currentUser={currentUser}
      activeTeam={activeTeam}
      availableTeams={dashboardMetrics.availableTeams}
      categories={dashboardMetrics.categories}
      budgetResources={dashboardMetrics.budgetResources}
      seasonMonths={dashboardMetrics.seasonMonths}
      title="Documentos"
      subtitle="Estrutura Analítica do Projeto (WBS / EAP) e Decomposição de Escopo"
      headerAction={headerAction}
    >
      <div className="space-y-5">
        {/* Cartões de Métricas Consolidadas */}
        <WbsHeaderMetrics metrics={metrics} isLoading={isLoading} />

        {/* Barra de Filtros e Busca */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 print:hidden">
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-2xl">
            {/* Campo de Busca Textual */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar entregável por código EAP, nome ou responsável..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            {/* Filtro por Disciplina */}
            <div className="relative w-full sm:w-56 shrink-0">
              <Filter className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              <select
                value={selectedDiscipline}
                onChange={(e) =>
                  setSelectedDiscipline(e.target.value as DeliveryGroup | "ALL")
                }
                className="w-full h-9 rounded-md border border-border bg-background pl-8 pr-3 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="ALL">Todas as Disciplinas</option>
                {(Object.keys(DISCIPLINE_LABELS) as DeliveryGroup[]).map((group) => (
                  <option key={group} value={group}>
                    {DISCIPLINE_LABELS[group]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Controles do Lado Direito: Alternador de Visualização & Modo Apresentação */}
          <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Alternador Canvas vs Tabela */}
            <div className="inline-flex items-center rounded-lg border border-border bg-card p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode("canvas")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === "canvas"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Visualização em Árvore Interativa (Canvas)"
              >
                <Network className="h-3.5 w-3.5" />
                <span>Árvore (Canvas)</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Visualização em Tabela Tabular"
              >
                <TableProperties className="h-3.5 w-3.5" />
                <span>Tabela</span>
              </button>
            </div>
          </div>
        </div>

        {/* Visualização da WBS: React Flow Canvas ou Tabela */}
        {viewMode === "canvas" ? (
          <WbsFlowCanvas
            nodes={tree}
            expandedNodeIds={expandedNodeIds}
            isPresentationMode={false}
            onToggleExpand={toggleExpand}
            onAddChild={openCreateChild}
            onEdit={openEdit}
            onDelete={(node) => setDeleteConfirmNode(node)}
            onOpenCreateRoot={openCreateRoot}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        ) : (
          <WbsTreeTable
            nodes={tree}
            expandedNodeIds={expandedNodeIds}
            onToggleExpand={toggleExpand}
            isPresentationMode={false}
            onAddChild={openCreateChild}
            onEdit={openEdit}
            onDelete={(node) => setDeleteConfirmNode(node)}
          />
        )}
      </div>

      {/* Modal de Criação / Edição de Entregáveis */}
      {modalState.isOpen && (
        <WbsNodeModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          teamId={activeTeam.id}
          members={members}
          editingNode={modalState.editingNode}
          parentNode={modalState.parentNode}
          existingNodes={tree}
          onSubmit={handleSaveNode}
        />
      )}

      {/* Modal de Confirmação de Exclusão (com alerta de cascata) */}
      <Dialog
        open={Boolean(deleteConfirmNode)}
        onOpenChange={(open) => !open && setDeleteConfirmNode(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-base font-bold">
                Excluir Entregável da WBS
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground pt-2 space-y-2">
              <p>
                Tem certeza de que deseja remover o entregável{" "}
                <strong className="text-foreground">
                  &quot;{deleteConfirmNode?.code} - {deleteConfirmNode?.title}&quot;
                </strong>
                ?
              </p>
              {deleteConfirmNode && deleteConfirmNode.children.length > 0 && (
                <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive text-xs font-medium">
                  Atenção: Este nó possui {deleteConfirmNode.children.length} sub-entregável(is) vinculado(s).
                  A exclusão será realizada em cascata, removendo todos os subcomponentes da hierarquia.
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmNode(null)}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDeleteNode}
              className="text-xs"
            >
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
