"use client";

import { tv } from "tailwind-variants";
import { Building2, Maximize2, Network, Plus, Search, Users, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrgMapViewMode } from "@/hooks/use-stakeholder-org-map";
import type { StakeholderOrgMapTree } from "@/types/communication";

const controlsStyles = tv({
  slots: {
    headerBar: "flex flex-col gap-3 border-b border-border bg-card/80 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between",
    statsRow: "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground",
    statItem: "inline-flex items-center gap-1 font-medium",
    subToolbar: "flex flex-col gap-2.5 border-b border-border/60 bg-background/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between",
    modePill: "rounded-lg px-3 py-1 text-xs font-semibold transition-colors cursor-pointer",
  },
  variants: {
    active: {
      true: { modePill: "bg-primary text-primary-foreground shadow-2xs" },
      false: { modePill: "text-muted-foreground hover:text-foreground" },
    },
  },
});

interface OrgMapHeaderControlsProps {
  tree: StakeholderOrgMapTree;
  viewMode?: OrgMapViewMode;
  onViewModeChange?: (mode: OrgMapViewMode) => void;
  partnerFilter: string;
  onPartnerFilterChange: (partnerKey: string) => void;
  availablePartners: Array<{ key: string; name: string; count: number }>;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onOpenCreateStakeholder: () => void;
}

export function OrgMapHeaderControls({
  tree,
  viewMode,
  onViewModeChange,
  partnerFilter,
  onPartnerFilterChange,
  availablePartners,
  searchQuery,
  onSearchChange,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onOpenCreateStakeholder,
}: OrgMapHeaderControlsProps) {
  const styles = controlsStyles();

  return (
    <>
      <div className={styles.headerBar()}>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary shrink-0" />
            <h3 className="text-sm sm:text-base font-bold text-foreground">
              {partnerFilter === "ALL"
                ? "Todas as Organizações & Parceiros"
                : availablePartners.find((p) => p.key === partnerFilter)?.name || "Parceiro Selecionado"}
            </h3>
          </div>
          <div className={styles.statsRow()}>
            <span className={styles.statItem()}><Building2 className="h-3.5 w-3.5 text-primary" />{tree.totalPartners} parceiros</span>
            <span>•</span>
            <span className={styles.statItem()}><Users className="h-3.5 w-3.5 text-purple" />{tree.totalStakeholders} stakeholders</span>
            <span>•</span>
            <span>{tree.totalLogs} interações</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => onPartnerFilterChange("ALL")}
              className={controlsStyles({ active: partnerFilter === "ALL" }).modePill()}
            >
              Todos os Parceiros
            </button>
            {availablePartners.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => onPartnerFilterChange(p.key)}
                className={controlsStyles({ active: partnerFilter === p.key }).modePill()}
              >
                {p.name} ({p.count})
              </button>
            ))}
          </div>

          <Button type="button" size="sm" onClick={onOpenCreateStakeholder} className="gap-1.5 text-xs font-semibold">
            <Plus className="h-3.5 w-3.5" />
            Cadastrar Stakeholder
          </Button>
        </div>
      </div>

      <div className={styles.subToolbar()}>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar parceiro, cargo ou pessoa..."
            className="h-8 pl-8 text-xs bg-card"
            aria-label="Buscar no mapa de stakeholders"
          />
        </div>

        <div className="flex items-center justify-end gap-1">
          <Button type="button" variant="outline" size="icon" onClick={onZoomOut} className="h-7 w-7" aria-label="Reduzir zoom"><ZoomOut className="h-3.5 w-3.5" /></Button>
          <span className="min-w-[44px] text-center text-[11px] font-medium text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button type="button" variant="outline" size="icon" onClick={onZoomIn} className="h-7 w-7" aria-label="Aumentar zoom"><ZoomIn className="h-3.5 w-3.5" /></Button>
          <Button type="button" variant="outline" size="icon" onClick={onZoomReset} className="h-7 w-7" aria-label="Restaurar enquadramento"><Maximize2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </>
  );
}
