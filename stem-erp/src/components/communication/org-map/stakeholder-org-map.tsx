"use client";

import * as React from "react";
import { Building2, Network, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildStakeholderHierarchyTree,
  resolvePartnerInfo,
} from "@/lib/communication-hierarchy";
import type {
  OrgMapStakeholderNode,
  StakeholderOrgMapTree,
  StakeholderWithRelations,
} from "@/types/communication";
import type { QuickAddStakeholderPrefill } from "@/hooks/use-stakeholder-org-map";
import { FlowCanvasShell } from "@/components/canvas/flow-canvas-shell";
import { stakeholdersToFlowElements } from "./stakeholder-flow.adapter";
import {
  StakeholderFlowNodeComponent,
  StakeholderPartnerNodeComponent,
  StakeholderTeamRootNodeComponent,
} from "./stakeholder-flow-node";
import { StakeholderInspectorDialog } from "./stakeholder-inspector-dialog";
import { OrgMapHeaderControls } from "./org-map-controls";

const nodeTypes = {
  stakeholderTeamRoot: StakeholderTeamRootNodeComponent,
  stakeholderPartner: StakeholderPartnerNodeComponent,
  stakeholderNode: StakeholderFlowNodeComponent,
};

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
  const [partnerFilter, setPartnerFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [inspectedStakeholder, setInspectedStakeholder] =
    React.useState<StakeholderWithRelations | null>(null);

  const availablePartners = React.useMemo(() => {
    const map = new Map<string, { key: string; name: string; count: number }>();
    for (const s of stakeholders) {
      const { partnerKey, partnerName } = resolvePartnerInfo(s);
      const curr = map.get(partnerKey);
      if (!curr) {
        map.set(partnerKey, { key: partnerKey, name: partnerName, count: 1 });
      } else {
        curr.count += 1;
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR")
    );
  }, [stakeholders]);

  const tree: StakeholderOrgMapTree = React.useMemo(
    () =>
      buildStakeholderHierarchyTree({
        teamName,
        stakeholders,
        searchQuery,
        partnerFilter,
      }),
    [teamName, stakeholders, searchQuery, partnerFilter]
  );

  const handleSelectNode = React.useCallback((node: OrgMapStakeholderNode) => {
    setInspectedStakeholder(node.stakeholder);
  }, []);

  const handleAddSubordinate = React.useCallback(
    (node: OrgMapStakeholderNode) => {
      onOpenCreateStakeholder({
        organization: node.partnerName,
        sponsorId: node.stakeholder.sponsorId,
        parentStakeholderId: node.id,
        parentStakeholderName: node.stakeholder.name,
      });
    },
    [onOpenCreateStakeholder]
  );

  const handleAddLateral = React.useCallback(
    (node: OrgMapStakeholderNode) => {
      onOpenCreateStakeholder({
        organization: node.partnerName,
        sponsorId: node.stakeholder.sponsorId,
        parentStakeholderId: node.stakeholder.parentStakeholderId ?? null,
      });
    },
    [onOpenCreateStakeholder]
  );

  const handleAddStakeholderToPartner = React.useCallback(
    (partnerName: string, sponsorId: string | null) => {
      onOpenCreateStakeholder({
        organization: partnerName,
        sponsorId,
      });
    },
    [onOpenCreateStakeholder]
  );

  const { nodes, edges } = React.useMemo(() => {
    return stakeholdersToFlowElements({
      tree,
      onSelectNode: handleSelectNode,
      onAddSubordinate: handleAddSubordinate,
      onAddLateral: handleAddLateral,
      onAddStakeholderToPartner: handleAddStakeholderToPartner,
    });
  }, [
    tree,
    handleSelectNode,
    handleAddSubordinate,
    handleAddLateral,
    handleAddStakeholderToPartner,
  ]);

  const emptyState = (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <Network className="h-10 w-10 text-muted-foreground" />
      <div className="space-y-1 max-w-md">
        <p className="text-sm font-bold text-foreground">
          Nenhum stakeholder cadastrado no mapa
        </p>
        <p className="text-xs text-muted-foreground">
          Cadastre organizações parceiras e seus representantes para construir a hierarquia de influência e relacionamento.
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => onOpenCreateStakeholder()}
        className="gap-1.5 cursor-pointer"
      >
        <Plus className="h-4 w-4" />
        <span>Cadastrar Primeiro Stakeholder</span>
      </Button>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Barra de Filtros e Busca de Stakeholders */}
      <OrgMapHeaderControls
        tree={tree}
        partnerFilter={partnerFilter}
        onPartnerFilterChange={setPartnerFilter}
        availablePartners={availablePartners}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        zoom={1}
        onZoomIn={() => {}}
        onZoomOut={() => {}}
        onZoomReset={() => {}}
        onOpenCreateStakeholder={() => onOpenCreateStakeholder()}
      />

      {/* Canvas React Flow Padronizado */}
      <FlowCanvasShell
        title="Organograma de Poder & Interesse"
        icon={<Network className="h-4 w-4 text-primary" />}
        metricsText={`${tree.totalPartners} parceiros • ${tree.totalStakeholders} stakeholders`}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        showTableToggle={false}
        emptyState={emptyState}
      />

      <StakeholderInspectorDialog
        stakeholder={inspectedStakeholder}
        onOpenChange={(open) => !open && setInspectedStakeholder(null)}
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
    </div>
  );
}
