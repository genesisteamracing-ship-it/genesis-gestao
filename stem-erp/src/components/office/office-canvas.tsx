"use client";

import * as React from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Node,
} from "@xyflow/react";
import { Building2, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OfficeFloorplanLayout } from "@/lib/office-layout";
import { OfficeMemberNode, type OfficeMemberNodeData } from "./office-member-node";
import { OfficeRoomNode, type OfficeRoomNodeData } from "./office-room-node";

const nodeTypes = {
  officeRoom: OfficeRoomNode,
  officeMember: OfficeMemberNode,
};

interface OfficeCanvasProps {
  floorplan: OfficeFloorplanLayout;
  filteredMemberIds: Set<string>;
  hasActiveFilters: boolean;
  selectedMemberId: string | null;
  focusRequestId: number;
  teamName: string;
  activeCount: number;
  totalMembers: number;
  onSelectMember: (memberId: string) => void;
}

function OfficeCanvasInner({
  floorplan,
  filteredMemberIds,
  hasActiveFilters,
  selectedMemberId,
  focusRequestId,
  teamName,
  activeCount,
  totalMembers,
  onSelectMember,
}: OfficeCanvasProps) {
  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow();

  const nodes = React.useMemo<
    Array<Node<OfficeRoomNodeData | OfficeMemberNodeData>>
  >(() => {
    const roomNodes: Array<Node<OfficeRoomNodeData>> = floorplan.zones.map(
      (zone) => ({
        id: `zone-${zone.id}`,
        type: "officeRoom",
        position: { x: zone.x, y: zone.y },
        data: { zone },
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: 0,
      })
    );

    const memberNodes: Array<Node<OfficeMemberNodeData>> =
      floorplan.placements.map((placement) => ({
        id: `member-${placement.member.id}`,
        type: "officeMember",
        position: { x: placement.x, y: placement.y },
        data: {
          member: placement.member,
          isSelected: placement.member.id === selectedMemberId,
          isDimmed:
            hasActiveFilters && !filteredMemberIds.has(placement.member.id),
          onSelect: onSelectMember,
        },
        draggable: false,
        selectable: true,
        zIndex: 10,
      }));

    return [...roomNodes, ...memberNodes];
  }, [
    floorplan,
    selectedMemberId,
    hasActiveFilters,
    filteredMemberIds,
    onSelectMember,
  ]);

  React.useEffect(() => {
    if (!selectedMemberId || focusRequestId === 0) return;
    const placement = floorplan.placements.find(
      (item) => item.member.id === selectedMemberId
    );
    if (!placement) return;

    setCenter(placement.x + 98, placement.y + 76, {
      zoom: 1.05,
      duration: 380,
    });
  }, [selectedMemberId, focusRequestId, floorplan.placements, setCenter]);

  return (
    <div className="relative flex h-[540px] sm:h-[640px] lg:h-[700px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
      {/* Toolbar superior padronizada */}
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card/95 px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-foreground truncate">
              Planta da Equipe — {teamName}
            </p>
            <p className="text-[11px] font-medium text-muted-foreground">
              {activeCount} em execução · {totalMembers} integrantes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => zoomIn({ duration: 200 })}
            aria-label="Aumentar zoom"
            title="Aumentar zoom"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => zoomOut({ duration: 200 })}
            aria-label="Diminuir zoom"
            title="Diminuir zoom"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg"
            onClick={() => fitView({ padding: 0.14, duration: 260 })}
            aria-label="Ajustar visualização"
            title="Ajustar visualização"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Área interativa React Flow */}
      <div className="relative flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.35}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          panOnScroll
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.2}
            color="var(--border)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export function OfficeCanvas(props: OfficeCanvasProps) {
  return (
    <ReactFlowProvider>
      <OfficeCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
