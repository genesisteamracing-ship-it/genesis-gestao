"use client";

import * as React from "react";
import { tv } from "tailwind-variants";
import { Hand, Network, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useStakeholderOrgMap,
  type OrgMapViewMode,
  type QuickAddStakeholderPrefill,
} from "@/hooks/use-stakeholder-org-map";
import {
  PartnerNodeCard,
  RootTeamNodeCard,
  StakeholderNodeCard,
} from "./org-map-node-card";
import { OrgMapHeaderControls } from "./org-map-controls";
import { StakeholderInspectorDialog } from "./stakeholder-inspector-dialog";
import type {
  OrgMapStakeholderNode,
  StakeholderWithRelations,
} from "@/types/communication";

const orgMapStyles = tv({
  slots: {
    shell: "relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
    canvasViewport:
      "relative min-h-[580px] w-full overflow-hidden bg-background bg-[radial-gradient(var(--border)_1.2px,transparent_1.2px)] [background-size:24px_24px] p-4 sm:p-8 touch-none select-none",
    treeCanvas:
      "mx-auto flex min-w-max flex-col items-center origin-top select-none will-change-transform",
    vLine: "h-6 w-px bg-border",
    hBar: "h-px bg-border",
    branchesRow: "flex items-start justify-center gap-6 sm:gap-10 pt-0",
    branchCol: "flex flex-col items-center",
    minimap:
      "pointer-events-none absolute bottom-4 right-4 hidden lg:flex flex-col justify-between rounded-xl border border-border bg-card/90 p-3 shadow-md w-44 h-24 backdrop-blur-xs",
  },
});

interface RecursiveNodeSubtreeProps {
  node: OrgMapStakeholderNode;
  viewMode: OrgMapViewMode;
  onSelectNode: (node: OrgMapStakeholderNode) => void;
  onAddSubordinate: (node: OrgMapStakeholderNode) => void;
  onAddLateral?: (node: OrgMapStakeholderNode) => void;
}

function RecursiveStakeholderSubtree({
  node,
  viewMode,
  onSelectNode,
  onAddSubordinate,
  onAddLateral,
}: RecursiveNodeSubtreeProps) {
  const styles = orgMapStyles();
  const hasChildren = node.children.length > 0;

  return (
    <div className={styles.branchCol()}>
      <StakeholderNodeCard
        node={node}
        viewMode={viewMode}
        onSelect={onSelectNode}
        onAddSubordinate={onAddSubordinate}
        onAddLateral={onAddLateral}
      />

      {hasChildren && (
        <>
          <div className={styles.vLine()} aria-hidden="true" />
          {node.children.length > 1 && (
            <div className="w-full px-16">
              <div className={styles.hBar()} />
            </div>
          )}
          <div className="flex items-start justify-center gap-5">
            {node.children.map((child) => (
              <div key={child.id} className={styles.branchCol()}>
                {node.children.length > 1 && <div className="h-4 w-px bg-border" />}
                <RecursiveStakeholderSubtree
                  node={child}
                  viewMode={viewMode}
                  onSelectNode={onSelectNode}
                  onAddSubordinate={onAddSubordinate}
                  onAddLateral={onAddLateral}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

interface StakeholderOrgMapProps {
  teamName: string;
  stakeholders: StakeholderWithRelations[];
  onOpenCreateStakeholder: (prefill?: QuickAddStakeholderPrefill) => void;
  onSelectStakeholderForReport: (stakeholderId: string) => void;
  onOpenPlanDialog?: (stakeholderId: string) => void;
  onOpenLogForStakeholder: (stakeholder: StakeholderWithRelations) => void;
}

export function StakeholderOrgMap({
  teamName,
  stakeholders,
  onOpenCreateStakeholder,
  onSelectStakeholderForReport,
  onOpenPlanDialog,
  onOpenLogForStakeholder,
}: StakeholderOrgMapProps) {
  const styles = orgMapStyles();
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const map = useStakeholderOrgMap({ teamName, stakeholders, viewportRef });

  return (
    <section className={styles.shell()} aria-label="Mapa Organizacional de Stakeholders">
      <OrgMapHeaderControls
        tree={map.tree}
        viewMode={map.viewMode}
        onViewModeChange={map.setViewMode}
        partnerFilter={map.partnerFilter}
        onPartnerFilterChange={map.setPartnerFilter}
        availablePartners={map.availablePartners}
        searchQuery={map.searchQuery}
        onSearchChange={map.setSearchQuery}
        zoom={map.zoom}
        onZoomIn={map.handleZoomIn}
        onZoomOut={map.handleZoomOut}
        onZoomReset={map.handleZoomReset}
        onOpenCreateStakeholder={() => onOpenCreateStakeholder()}
      />

      <div
        ref={viewportRef}
        {...map.canvasHandlers}
        className={`${styles.canvasViewport()} ${
          map.isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {map.tree.partners.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <Network className="h-10 w-10 text-muted-foreground" />
            <div className="space-y-1 max-w-md">
              <p className="text-sm font-bold text-foreground">Nenhum stakeholder no gráfico</p>
              <p className="text-xs text-muted-foreground">
                Cadastre parceiros (ex: SESI, SENAI, patrocinadores) e seus stakeholders para construir a árvore hierárquica de Poder e Interesse.
              </p>
            </div>
            <Button type="button" size="sm" onClick={() => onOpenCreateStakeholder()} className="gap-1.5">
              <Plus className="h-4 w-4" />Cadastrar Primeiro Stakeholder
            </Button>
          </div>
        ) : (
          <div
            role="tree"
            className={styles.treeCanvas()}
            style={{
              transform: `translate3d(${map.pan.x}px, ${map.pan.y}px, 0) scale(${map.zoom})`,
              transformOrigin: "center top",
              transition: map.isDragging ? "none" : "transform 140ms ease-out",
            }}
          >
            <RootTeamNodeCard
              teamName={map.tree.teamName}
              totalPartners={map.tree.totalPartners}
              totalStakeholders={map.tree.totalStakeholders}
              totalPlans={map.tree.totalPlans}
            />
            <div className={styles.vLine()} aria-hidden="true" />
            {map.tree.partners.length > 1 && (
              <div className="w-full px-24"><div className={styles.hBar()} /></div>
            )}

            <div className={styles.branchesRow()}>
              {map.tree.partners.map((branch) => (
                <div key={branch.partnerKey} className={styles.branchCol()}>
                  {map.tree.partners.length > 1 && <div className="h-5 w-px bg-border" />}
                  <PartnerNodeCard
                    branch={branch}
                    onAddStakeholder={(partnerName, sponsorId) =>
                      onOpenCreateStakeholder({ organization: partnerName, sponsorId })
                    }
                  />
                  {branch.rootNodes.length > 0 && (
                    <>
                      <div className={styles.vLine()} aria-hidden="true" />
                      <div className="flex items-start justify-center gap-5">
                        {branch.rootNodes.map((rootNode) => (
                          <RecursiveStakeholderSubtree
                            key={rootNode.id}
                            node={rootNode}
                            viewMode={map.viewMode}
                            onSelectNode={map.inspectNode}
                            onAddSubordinate={(n) =>
                              onOpenCreateStakeholder({
                                organization: n.partnerName,
                                sponsorId: n.stakeholder.sponsorId,
                                parentStakeholderId: n.id,
                                parentStakeholderName: n.stakeholder.name,
                              })
                            }
                            onAddLateral={(n) =>
                              onOpenCreateStakeholder({
                                organization: n.partnerName,
                                sponsorId: n.stakeholder.sponsorId,
                                parentStakeholderId: n.stakeholder.parentStakeholderId ?? null,
                              })
                            }
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dica visual de navegação no estilo quadro em branco */}
        <div className="pointer-events-none absolute left-4 bottom-4 hidden sm:flex items-center gap-1.5 rounded-lg border border-border/80 bg-card/85 backdrop-blur-xs px-2.5 py-1 text-[11px] text-muted-foreground shadow-2xs">
          <Hand className="h-3.5 w-3.5 text-primary" />
          <span>Arraste com o mouse para mover o quadro • Role para zoom</span>
        </div>

        <div className={styles.minimap()} aria-hidden="true">
          <span className="text-[10px] font-semibold text-muted-foreground">Panorama da Árvore</span>
          <div className="flex items-center justify-around gap-1 py-1">
            {map.tree.partners.slice(0, 5).map((b) => (
              <div key={b.partnerKey} className="flex flex-col items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" />
                <span className="h-3 w-px bg-border" />
                <span className="h-1.5 w-1.5 rounded-full bg-purple" />
                <span className="h-1.5 w-1.5 rounded-full bg-success" />
              </div>
            ))}
          </div>
          <span className="text-[9px] text-muted-foreground text-right">{map.tree.totalPartners} ramos ativos</span>
        </div>
      </div>

      <StakeholderInspectorDialog
        stakeholder={map.inspectedStakeholder}
        onOpenChange={(open) => !open && map.setInspectedStakeholder(null)}
        onGenerateReport={onSelectStakeholderForReport}
        onCreatePlan={onOpenPlanDialog}
        onAddSubordinate={(st) =>
          onOpenCreateStakeholder({
            organization: st.organization || undefined,
            sponsorId: st.sponsorId,
            parentStakeholderId: st.id,
            parentStakeholderName: st.name,
          })
        }
        onLogCommunication={onOpenLogForStakeholder}
      />
    </section>
  );
}
