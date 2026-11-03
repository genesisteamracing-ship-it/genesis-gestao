"use client";

import { useMemo, useState } from "react";
import {
  buildStakeholderHierarchyTree,
  resolvePartnerInfo,
} from "@/lib/communication-hierarchy";
import type {
  OrgMapStakeholderNode,
  StakeholderWithRelations,
} from "@/types/communication";

export type OrgMapViewMode = "hierarchy" | "structure" | "relations";

export interface QuickAddStakeholderPrefill {
  organization?: string;
  sponsorId?: string | null;
  parentStakeholderId?: string | null;
  parentStakeholderName?: string | null;
}

interface UseStakeholderOrgMapParams {
  teamName: string;
  stakeholders: StakeholderWithRelations[];
}

export function useStakeholderOrgMap({
  teamName,
  stakeholders,
}: UseStakeholderOrgMapParams) {
  const [viewMode, setViewMode] = useState<OrgMapViewMode>("hierarchy");
  const [partnerFilter, setPartnerFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [zoom, setZoom] = useState<number>(1);
  const [collapsedPartners, setCollapsedPartners] = useState<Record<string, boolean>>({});
  const [inspectedStakeholder, setInspectedStakeholder] =
    useState<StakeholderWithRelations | null>(null);

  const availablePartners = useMemo(() => {
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

  const tree = useMemo(
    () =>
      buildStakeholderHierarchyTree({
        teamName,
        stakeholders,
        searchQuery,
        partnerFilter,
      }),
    [teamName, stakeholders, searchQuery, partnerFilter]
  );

  const handleZoomIn = () =>
    setZoom((prev) => Math.min(1.35, Number((prev + 0.1).toFixed(2))));

  const handleZoomOut = () =>
    setZoom((prev) => Math.max(0.65, Number((prev - 0.1).toFixed(2))));

  const handleZoomReset = () => setZoom(1);

  const togglePartnerCollapse = (partnerKey: string) => {
    setCollapsedPartners((prev) => ({
      ...prev,
      [partnerKey]: !prev[partnerKey],
    }));
  };

  const inspectNode = (node: OrgMapStakeholderNode) => {
    setInspectedStakeholder(node.stakeholder);
  };

  return {
    viewMode,
    setViewMode,
    partnerFilter,
    setPartnerFilter,
    searchQuery,
    setSearchQuery,
    zoom,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    collapsedPartners,
    togglePartnerCollapse,
    availablePartners,
    tree,
    inspectedStakeholder,
    setInspectedStakeholder,
    inspectNode,
  };
}
