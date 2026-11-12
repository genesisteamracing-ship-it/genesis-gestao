"use client";

import * as React from "react";
import { AlertCircle, Plus, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { tv } from "tailwind-variants";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useRisks, type RiskFiltersState } from "@/hooks/use-risks";
import { DELIVERY_GROUP_SHORT_LABELS } from "@/lib/constants";
import {
  RISK_CONSEQUENCE_LABELS,
  RISK_CONSEQUENCE_ORDER,
  RISK_ENTRY_TYPE_LABELS,
  RISK_PROBABILITY_LABELS,
  RISK_PROBABILITY_ORDER,
} from "@/lib/risk-matrix";
import type { RiskItemDTO, RiskTeamMemberOption } from "@/types/risks";
import { RiskCartesianChart } from "./risk-cartesian-chart";
import { RiskDistributionCharts } from "./risk-distribution-charts";
import { RiskFormDialog } from "./risk-form-dialog";
import { RiskReviewDialog } from "./risk-review-dialog";
import { RiskTable } from "./risk-table";

interface RisksViewProps {
  season: string;
  initialItems?: RiskItemDTO[];
  initialMembers?: RiskTeamMemberOption[];
  initialCanEdit?: boolean;
}

const viewStyles = tv({
  slots: {
    root: "space-y-6",
    toolbar:
      "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between",
    filtersGrid:
      "grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5",
    stateBox:
      "flex flex-col items-center justify-center rounded-2xl border border-border bg-card p-10 text-center shadow-xs",
  },
});

const SECTORS = Object.entries(DELIVERY_GROUP_SHORT_LABELS);

export function RisksView({
  season,
  initialItems,
  initialMembers,
  initialCanEdit = true,
}: RisksViewProps) {
  const styles = viewStyles();
  const [pendingDelete, setPendingDelete] = React.useState<RiskItemDTO | null>(
    null
  );

  const {
    items,
    filteredItems,
    members,
    canEdit,
    isLoading,
    error,
    isSaving,
    filters,
    setFilters,
    resetFilters,
    probabilityDistribution,
    consequenceDistribution,
    cartesianPoints,
    formOpen,
    setFormOpen,
    editingItem,
    openCreateForm,
    openEditForm,
    reviewItem,
    reviews,
    isLoadingReviews,
    openReviewModal,
    closeReviewModal,
    loadData,
    handleCreateOrUpdate,
    handleDelete,
    handleRegisterReview,
  } = useRisks(season, initialItems, initialMembers, initialCanEdit);

  const handleSelectCartesianRisk = React.useCallback(
    (riskId: string) => {
      const target = items.find((i) => i.id === riskId);
      if (target) {
        void openReviewModal(target);
      }
    },
    [items, openReviewModal]
  );

  if (isLoading) {
    return (
      <div className={styles.root()} aria-busy="true" aria-label="Carregando riscos">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <Skeleton className="h-72 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.stateBox()} role="alert">
        <AlertCircle className="mb-3 h-10 w-10 text-destructive" />
        <h2 className="text-base font-semibold text-foreground">
          Erro ao carregar riscos
        </h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{error}</p>
        <Button onClick={() => void loadData()} className="mt-4 gap-2">
          <RefreshCw className="h-4 w-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.root()}>
      <div className={styles.toolbar()}>
        <div className={styles.filtersGrid()}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Buscar risco ou observação"
              placeholder="Buscar risco..."
              value={filters.search}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, search: e.target.value }))
              }
              className="pl-9"
            />
          </div>

          <Select
            value={filters.entryType}
            onValueChange={(v) =>
              setFilters((prev) => ({
                ...prev,
                entryType: v as RiskFiltersState["entryType"],
              }))
            }
          >
            <SelectTrigger aria-label="Filtrar por tipo">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os tipos</SelectItem>
              {Object.entries(RISK_ENTRY_TYPE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sector}
            onValueChange={(v) =>
              setFilters((prev) => ({
                ...prev,
                sector: v as RiskFiltersState["sector"],
              }))
            }
          >
            <SelectTrigger aria-label="Filtrar por setor">
              <SelectValue placeholder="Setor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos os setores</SelectItem>
              {SECTORS.map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.probability}
            onValueChange={(v) =>
              setFilters((prev) => ({
                ...prev,
                probability: v as RiskFiltersState["probability"],
              }))
            }
          >
            <SelectTrigger aria-label="Filtrar por chance">
              <SelectValue placeholder="Chance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as chances</SelectItem>
              {RISK_PROBABILITY_ORDER.map((k) => (
                <SelectItem key={k} value={k}>
                  {RISK_PROBABILITY_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.consequence}
            onValueChange={(v) =>
              setFilters((prev) => ({
                ...prev,
                consequence: v as RiskFiltersState["consequence"],
              }))
            }
          >
            <SelectTrigger aria-label="Filtrar por consequência">
              <SelectValue placeholder="Consequência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todas as consequências</SelectItem>
              {RISK_CONSEQUENCE_ORDER.map((k) => (
                <SelectItem key={k} value={k}>
                  {RISK_CONSEQUENCE_LABELS[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {canEdit && (
            <Button
              onClick={openCreateForm}
              className="w-full gap-2 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Novo Risco
            </Button>
          )}
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className={styles.stateBox()}>
          <ShieldAlert className="mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">
            {items.length === 0
              ? "Nenhum risco cadastrado"
              : "Nenhum registro encontrado para os filtros aplicados"}
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {items.length === 0
              ? "Cadastre riscos ou oportunidades para acompanhar chances, consequências e planos de contingência."
              : "Ajuste ou limpe os filtros para visualizar os registros."}
          </p>
          {items.length === 0 && canEdit ? (
            <Button onClick={openCreateForm} className="mt-4 gap-2">
              <Plus className="h-4 w-4" />
              Cadastrar Primeiro Risco
            </Button>
          ) : items.length > 0 ? (
            <Button
              variant="outline"
              onClick={resetFilters}
              className="mt-4"
            >
              Limpar filtros
            </Button>
          ) : null}
        </div>
      ) : (
        <>
          <RiskDistributionCharts
            probabilityData={probabilityDistribution}
            consequenceData={consequenceDistribution}
          />

          <RiskCartesianChart
            points={cartesianPoints}
            onSelectRisk={handleSelectCartesianRisk}
          />

          <RiskTable
            items={filteredItems}
            canEdit={canEdit}
            onEdit={openEditForm}
            onReview={(item) => void openReviewModal(item)}
            onDelete={(item) => setPendingDelete(item)}
          />
        </>
      )}

      <RiskFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        season={season}
        editingItem={editingItem}
        members={members}
        isSaving={isSaving}
        onSubmit={handleCreateOrUpdate}
      />

      <RiskReviewDialog
        item={reviewItem}
        reviews={reviews}
        isLoadingReviews={isLoadingReviews}
        isSaving={isSaving}
        canEdit={canEdit}
        onClose={closeReviewModal}
        onSubmitReview={handleRegisterReview}
      />

      <Dialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir registro</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{" "}
              <strong>{pendingDelete?.title}</strong> e todo o seu histórico de
              revisões?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setPendingDelete(null)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={isSaving}
              onClick={async () => {
                if (!pendingDelete) return;
                const ok = await handleDelete(pendingDelete);
                if (ok) setPendingDelete(null);
              }}
            >
              {isSaving ? "Excluindo..." : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
