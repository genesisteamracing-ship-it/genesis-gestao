"use client";

import * as React from "react";
import type { Node, NodeProps } from "@xyflow/react";
import type { OfficeZoneLayout } from "@/lib/office-layout";
import {
  PixelCopaLoungeDecor,
  PixelFloorLamp,
  PixelPitCarPedestal,
  PixelPottedPlant,
  PixelReceptionDecor,
  PixelWallBoard,
  PixelWallBookshelf,
  PixelWorkstationDesk,
} from "./office-pixel-props";
import { officeRoomStyles } from "./office-styles";

export type OfficeRoomNodeData = {
  zone: OfficeZoneLayout;
};

export type OfficeRoomNodeType = Node<OfficeRoomNodeData, "officeRoom">;

const SECTOR_BOARD_ACCENT: Record<string, string> = {
  ENGINEERING_CAD: "var(--primary)",
  MANUFACTURING_CNC: "var(--warning)",
  PIT_DISPLAY: "var(--purple)",
  MARKETING_SPONSOR: "var(--magenta)",
  PROJECT_MANAGEMENT: "var(--success)",
  SOCIAL_PROJECT: "var(--peach)",
};

function RoomPixelFloor({ zone }: { zone: OfficeZoneLayout }) {
  const patternId = `room-floor-${zone.id}`;

  return (
    <svg
      width={zone.width}
      height={zone.height}
      className="pointer-events-none absolute inset-0"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <defs>
        {zone.floorStyle === "wood" && (
          <pattern
            id={patternId}
            width="32"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="32"
              height="16"
              fill="color-mix(in srgb, var(--warning) 28%, var(--card))"
            />
            <rect
              x="0"
              y="7"
              width="32"
              height="1"
              fill="color-mix(in srgb, var(--warning) 44%, var(--border))"
              opacity="0.7"
            />
            <rect
              x="0"
              y="15"
              width="32"
              height="1"
              fill="color-mix(in srgb, var(--warning) 44%, var(--border))"
              opacity="0.7"
            />
            <rect
              x="16"
              y="0"
              width="1"
              height="8"
              fill="color-mix(in srgb, var(--warning) 48%, var(--border))"
              opacity="0.55"
            />
            <rect
              x="6"
              y="8"
              width="1"
              height="8"
              fill="color-mix(in srgb, var(--warning) 48%, var(--border))"
              opacity="0.55"
            />
          </pattern>
        )}

        {zone.floorStyle === "tile" && (
          <pattern
            id={patternId}
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="24"
              height="24"
              fill="color-mix(in srgb, var(--chart-4) 22%, var(--card))"
            />
            <rect
              x="0"
              y="0"
              width="12"
              height="12"
              fill="color-mix(in srgb, var(--primary) 14%, var(--card))"
            />
            <rect
              x="12"
              y="12"
              width="12"
              height="12"
              fill="color-mix(in srgb, var(--primary) 14%, var(--card))"
            />
          </pattern>
        )}

        {(zone.floorStyle === "carpet" || zone.floorStyle === "showroom") && (
          <pattern
            id={patternId}
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="16"
              height="16"
              fill="color-mix(in srgb, var(--purple) 22%, var(--card))"
            />
            <rect
              x="2"
              y="2"
              width="2"
              height="2"
              fill="var(--purple)"
              opacity="0.14"
            />
            <rect
              x="10"
              y="10"
              width="2"
              height="2"
              fill="var(--chart-4)"
              opacity="0.14"
            />
          </pattern>
        )}
      </defs>

      <rect width="100%" height="100%" fill={`url(#${patternId})`} />

      {/* Rodapé / Parede superior em perspectiva 2.5D */}
      <rect
        x="0"
        y="0"
        width={zone.width}
        height="26"
        fill="color-mix(in srgb, var(--secondary) 78%, var(--border))"
      />
      <rect
        x="0"
        y="26"
        width={zone.width}
        height="3"
        fill="var(--pixel-ink)"
        opacity="0.45"
      />

      {/* Paredes divisórias laterais entre as salas */}
      <rect x="0" y="0" width="3" height={zone.height} fill="var(--pixel-ink)" />
      <rect
        x={zone.width - 3}
        y="0"
        width="3"
        height={zone.height}
        fill="var(--pixel-ink)"
      />

      {/* Abertura de Porta conectada ao Corredor Central */}
      {zone.wing === "north" ? (
        <>
          <rect
            x={zone.doorOffsetX}
            y={zone.height - 8}
            width={zone.doorWidth}
            height="8"
            fill="color-mix(in srgb, var(--amber) 24%, var(--secondary))"
          />
          <rect
            x={zone.doorOffsetX - 3}
            y={zone.height - 8}
            width="3"
            height="8"
            fill="var(--pixel-ink)"
          />
          <rect
            x={zone.doorOffsetX + zone.doorWidth}
            y={zone.height - 8}
            width="3"
            height="8"
            fill="var(--pixel-ink)"
          />
        </>
      ) : (
        <>
          <rect
            x={zone.doorOffsetX}
            y="0"
            width={zone.doorWidth}
            height="29"
            fill="color-mix(in srgb, var(--amber) 22%, var(--secondary))"
          />
          <rect
            x={zone.doorOffsetX - 3}
            y="0"
            width="3"
            height="29"
            fill="var(--pixel-ink)"
          />
          <rect
            x={zone.doorOffsetX + zone.doorWidth}
            y="0"
            width="3"
            height="29"
            fill="var(--pixel-ink)"
          />
        </>
      )}
    </svg>
  );
}

export const OfficeRoomNode = React.memo(function OfficeRoomNode({
  data,
}: NodeProps<OfficeRoomNodeType>) {
  const { zone } = data;
  const styles = officeRoomStyles({ zone: zone.id });
  const boardAccent = SECTOR_BOARD_ACCENT[zone.id] ?? "var(--primary)";

  return (
    <div
      className={styles.container()}
      style={{ width: zone.width, height: zone.height }}
      aria-label={`Sala ${zone.label}`}
    >
      <RoomPixelFloor zone={zone} />

      {/* Placa de porta flutuante estilo pixel-art de alto contraste */}
      <div className={styles.sign()}>
        <span className={styles.signAccentDot()} />
        <span>{zone.label}</span>
        {zone.activeCount > 0 && (
          <span
            className={`h-2 w-2 rounded-full ${
              zone.overdueCount > 0
                ? "bg-destructive animate-pulse"
                : "bg-success animate-pulse"
            }`}
            title={`${zone.activeCount} em atividade`}
          />
        )}
        {zone.kind === "sector" && (
          <span className={styles.countPill()}>{zone.memberCount}</span>
        )}
      </div>

      {/* Mobiliário de parede superior (Estantes, Quadros Kanban/CAD e Plantas) */}
      <div className="pointer-events-none absolute inset-x-3 top-2 flex items-start justify-between">
        <PixelWallBookshelf />
        {zone.wing === "north" && <PixelWallBoard accent={boardAccent} />}
        <PixelPottedPlant size={26} />
      </div>

      {/* Luminária quente de canto */}
      <PixelFloorLamp className="absolute bottom-3 right-2" />
      <PixelPottedPlant
        size={26}
        className="pointer-events-none absolute bottom-3 left-2.5"
      />

      {/* Cenografia dedicada para Recepção */}
      {zone.kind === "briefing" && <PixelReceptionDecor />}

      {/* Cenografia dedicada para Copa & Lounge */}
      {zone.kind === "lounge" && (
        <PixelCopaLoungeDecor compact={zone.memberCount > 0} />
      )}

      {/* Bancadas vazias esperando alocação nos setores */}
      {zone.kind === "sector" &&
        zone.emptyDeskSlots.map((slot, idx) => (
          <div
            key={`empty-desk-${zone.id}-${idx}`}
            className="pointer-events-none absolute opacity-85"
            style={{ left: slot.x + 10, top: slot.y + 34 }}
          >
            <PixelWorkstationDesk unoccupied />
          </div>
        ))}

      {/* Destaque temático do carro F1 na sala Pit Display */}
      {zone.id === "PIT_DISPLAY" && (
        <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2">
          <PixelPitCarPedestal />
        </div>
      )}
    </div>
  );
});
