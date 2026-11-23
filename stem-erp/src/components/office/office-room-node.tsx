"use client";

import * as React from "react";
import type { Node, NodeProps } from "@xyflow/react";
import { Coffee, Users } from "lucide-react";
import type { OfficeZoneLayout } from "@/lib/office-layout";
import { officeRoomStyles } from "./office-styles";

export type OfficeRoomNodeData = {
  zone: OfficeZoneLayout;
};

export type OfficeRoomNodeType = Node<OfficeRoomNodeData, "officeRoom">;

function PixelBriefingDecor() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4">
      {/* Quadro branco pixelado */}
      <svg
        width="104"
        height="32"
        viewBox="0 0 26 8"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <rect x="0" y="0" width="26" height="8" fill="var(--border)" />
        <rect x="1" y="1" width="24" height="6" fill="var(--card)" />
        <rect x="3" y="2" width="7" height="1" fill="var(--primary)" />
        <rect x="3" y="4" width="12" height="1" fill="var(--success)" />
        <rect x="17" y="2" width="5" height="3" fill="var(--warning)" opacity="0.8" />
      </svg>

      {/* Mesa de reunião pixelada com cadeiras */}
      <svg
        width="160"
        height="76"
        viewBox="0 0 40 19"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {/* Cadeiras superiores */}
        <rect x="8" y="1" width="4" height="3" fill="var(--muted-foreground)" opacity="0.55" />
        <rect x="18" y="1" width="4" height="3" fill="var(--muted-foreground)" opacity="0.55" />
        <rect x="28" y="1" width="4" height="3" fill="var(--muted-foreground)" opacity="0.55" />

        {/* Tampo da mesa */}
        <rect x="5" y="5" width="30" height="9" fill="var(--border)" />
        <rect x="6" y="6" width="28" height="7" fill="var(--card)" />
        {/* Laptop & caderno sobre a mesa */}
        <rect x="16" y="8" width="6" height="3" fill="var(--primary)" opacity="0.8" />
        <rect x="9" y="8" width="4" height="3" fill="var(--muted)" />
        <rect x="26" y="8" width="3" height="2" fill="var(--amber)" />

        {/* Cadeiras inferiores */}
        <rect x="8" y="15" width="4" height="3" fill="var(--muted-foreground)" opacity="0.55" />
        <rect x="18" y="15" width="4" height="3" fill="var(--muted-foreground)" opacity="0.55" />
        <rect x="28" y="15" width="4" height="3" fill="var(--muted-foreground)" opacity="0.55" />
      </svg>
    </div>
  );
}

function PixelLoungeDecor({ hasMembers }: { hasMembers: boolean }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 p-4 ${
        hasMembers ? "opacity-35" : "flex-1"
      }`}
    >
      {/* Sofá & Cafeteira pixelados */}
      <svg
        width="168"
        height="64"
        viewBox="0 0 42 16"
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        {/* Sofá */}
        <rect x="2" y="4" width="22" height="9" fill="var(--border)" />
        <rect x="3" y="5" width="20" height="4" fill="var(--primary)" opacity="0.35" />
        <rect x="3" y="9" width="20" height="3" fill="var(--primary)" opacity="0.22" />
        <rect x="2" y="6" width="2" height="7" fill="var(--primary)" opacity="0.5" />
        <rect x="22" y="6" width="2" height="7" fill="var(--primary)" opacity="0.5" />

        {/* Balcão do café */}
        <rect x="28" y="5" width="12" height="8" fill="var(--border)" />
        <rect x="29" y="6" width="10" height="6" fill="var(--card)" />
        <rect x="31" y="7" width="3" height="3" fill="var(--destructive)" opacity="0.8" />
        <rect x="35" y="8" width="2" height="2" fill="var(--amber)" />

        {/* Plantinha */}
        <rect x="25" y="10" width="2" height="3" fill="var(--warning)" opacity="0.8" />
        <rect x="24" y="7" width="4" height="3" fill="var(--success)" opacity="0.85" />
      </svg>
    </div>
  );
}

export const OfficeRoomNode = React.memo(function OfficeRoomNode({
  data,
}: NodeProps<OfficeRoomNodeType>) {
  const { zone } = data;
  const styles = officeRoomStyles({ zone: zone.id });

  return (
    <div
      className={styles.container()}
      style={{ width: zone.width, height: zone.height }}
      aria-label={`Sala ${zone.label}`}
    >
      <div className={styles.header()}>
        <span className="flex items-center gap-1.5 min-w-0">
          {zone.kind === "briefing" && (
            <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
          )}
          {zone.kind === "lounge" && (
            <Coffee className="h-3.5 w-3.5 shrink-0 text-warning" />
          )}
          <span className={styles.title()}>{zone.label}</span>
        </span>
        <span className={styles.counter()}>
          {zone.kind === "briefing"
            ? `${zone.activeCount}/${zone.memberCount} ativos`
            : `${zone.activeCount}/${zone.memberCount}`}
        </span>
      </div>

      {zone.kind === "briefing" && <PixelBriefingDecor />}

      {zone.kind === "lounge" && zone.memberCount === 0 && (
        <PixelLoungeDecor hasMembers={false} />
      )}

      {zone.kind === "sector" && zone.memberCount === 0 && (
        <div className="flex h-[calc(100%-36px)] items-center justify-center px-4 text-center">
          <span className="text-[11px] font-medium text-muted-foreground/70">
            Sem integrantes alocados
          </span>
        </div>
      )}
    </div>
  );
});
