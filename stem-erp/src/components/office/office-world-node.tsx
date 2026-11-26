"use client";

import * as React from "react";
import type { Node, NodeProps } from "@xyflow/react";
import type { OfficeFloorplanLayout } from "@/lib/office-layout";
import {
  PixelParkBench,
  PixelPottedPlant,
  PixelTree,
} from "./office-pixel-props";

export type OfficeWorldNodeData = {
  floorplan: OfficeFloorplanLayout;
};

export type OfficeWorldNodeType = Node<OfficeWorldNodeData, "officeWorld">;

const TREE_COORDS: Array<{ x: number; y: number; size: number }> = [
  { x: 18, y: 16, size: 46 },
  { x: 260, y: 14, size: 42 },
  { x: 640, y: 12, size: 48 },
  { x: 1030, y: 16, size: 42 },
  { x: 1390, y: 18, size: 46 },
  { x: 22, y: 168, size: 44 },
  { x: 26, y: 492, size: 46 },
  { x: 1418, y: 210, size: 44 },
  { x: 1412, y: 470, size: 48 },
  { x: 22, y: 650, size: 44 },
  { x: 380, y: 664, size: 42 },
  { x: 860, y: 660, size: 46 },
  { x: 1290, y: 662, size: 44 },
];

const LAMP_COORDS: Array<{ x: number; y: number }> = [
  { x: 96, y: 54 },
  { x: 1412, y: 108 },
  { x: 86, y: 590 },
  { x: 1410, y: 585 },
];

export const OfficeWorldNode = React.memo(function OfficeWorldNode({
  data,
}: NodeProps<OfficeWorldNodeType>) {
  const { floorplan } = data;
  const { building, corridor } = floorplan;

  return (
    <div
      className="pointer-events-none relative select-none overflow-hidden rounded-3xl [--pixel-ink:var(--foreground)] dark:[--pixel-ink:var(--background)]"
      style={{
        width: floorplan.width,
        height: floorplan.height,
        backgroundColor:
          "color-mix(in srgb, var(--success) 16%, var(--background))",
      }}
      aria-hidden="true"
    >
      {/* Textura pixelada de gramado externo */}
      <svg
        width={floorplan.width}
        height={floorplan.height}
        className="absolute inset-0"
        shapeRendering="crispEdges"
      >
        <defs>
          <pattern
            id="office-pixel-lawn"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <rect
              x="4"
              y="6"
              width="2"
              height="2"
              fill="var(--success)"
              opacity="0.18"
            />
            <rect
              x="18"
              y="14"
              width="3"
              height="2"
              fill="var(--success)"
              opacity="0.14"
            />
            <rect
              x="10"
              y="25"
              width="2"
              height="2"
              fill="var(--amber)"
              opacity="0.1"
            />
          </pattern>
          <pattern
            id="office-corridor-stone"
            width="24"
            height="24"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="24"
              height="24"
              fill="color-mix(in srgb, var(--amber) 14%, var(--secondary))"
            />
            <rect
              x="0"
              y="0"
              width="24"
              height="1"
              fill="var(--border)"
              opacity="0.55"
            />
            <rect
              x="0"
              y="0"
              width="1"
              height="24"
              fill="var(--border)"
              opacity="0.45"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#office-pixel-lawn)" />

        {/* Calçada de pedra levando até o Hub de entrada */}
        <rect
          x="0"
          y={corridor.y + 16}
          width={building.x}
          height={corridor.height - 32}
          fill="color-mix(in srgb, var(--muted-foreground) 32%, var(--card))"
        />
        <rect
          x="0"
          y={corridor.y + 16}
          width={building.x}
          height="4"
          fill="var(--border)"
        />
        <rect
          x="0"
          y={corridor.y + corridor.height - 20}
          width={building.x}
          height="4"
          fill="var(--border)"
        />
      </svg>

      {/* Postes de jardim com halo quente igual à referência */}
      {LAMP_COORDS.map((lamp, idx) => (
        <div
          key={`lamp-${idx}`}
          className="absolute"
          style={{ left: lamp.x - 42, top: lamp.y - 42 }}
        >
          <div
            className="h-24 w-24 rounded-full"
            style={{
              background:
                "radial-gradient(circle, color-mix(in srgb, var(--amber) 34%, transparent) 0%, transparent 70%)",
            }}
          />
          <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-xs border border-border bg-amber shadow-xs" />
        </div>
      ))}

      {/* Árvores pixel-art distribuídas no jardim */}
      {TREE_COORDS.filter((t) => t.y < floorplan.height - 36).map((tree, idx) => (
        <div
          key={`tree-${idx}`}
          className="absolute"
          style={{ left: tree.x, top: tree.y }}
        >
          <PixelTree size={tree.size} />
        </div>
      ))}

      {/* Sombra externa e alvenaria estrutural do prédio */}
      <div
        className="absolute rounded-md"
        style={{
          left: building.x - 8,
          top: building.y - 8,
          width: building.width + 16,
          height: building.height + 20,
          backgroundColor: "var(--pixel-ink)",
          opacity: 0.45,
        }}
      />
      <div
        className="absolute border-4 border-[var(--pixel-ink)] shadow-lg"
        style={{
          left: building.x - 4,
          top: building.y - 4,
          width: building.width + 8,
          height: building.height + 8,
          backgroundColor: "var(--card)",
        }}
      />

      {/* Portaria / Hub lateral à esquerda do Corredor Central */}
      <div
        className="absolute flex items-center justify-center border-y-4 border-l-4 border-[var(--pixel-ink)]"
        style={{
          left: corridor.x - corridor.entranceWidth,
          top: corridor.y + 6,
          width: corridor.entranceWidth + 4,
          height: corridor.height - 12,
          backgroundColor:
            "color-mix(in srgb, var(--primary) 18%, var(--secondary))",
        }}
      >
        {/* Tapete escuro de boas-vindas + Plaqueta Hub */}
        <div className="h-12 w-6 rounded-xs border-2 border-[var(--pixel-ink)] bg-popover/90" />
        <span className="absolute -top-5 left-1 rounded border border-border bg-popover px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-primary shadow-2xs">
          Hub
        </span>
      </div>

      {/* Corredor Central Iluminado conectando Ala Norte e Ala Sul */}
      <div
        className="absolute overflow-hidden border-y-4 border-[var(--pixel-ink)]"
        style={{
          left: corridor.x,
          top: corridor.y,
          width: corridor.width,
          height: corridor.height,
        }}
      >
        <svg
          width={corridor.width}
          height={corridor.height}
          className="absolute inset-0"
          shapeRendering="crispEdges"
        >
          <rect
            width="100%"
            height="100%"
            fill="url(#office-corridor-stone)"
          />
          {/* Passadeiras centrais estilo tapete de corredor */}
          {[76, 468, 860].map((rugX) => (
            <g key={`rug-${rugX}`}>
              <rect
                x={rugX}
                y={Math.round(corridor.height / 2) - 13}
                width="280"
                height="26"
                fill="var(--pixel-ink)"
                opacity="0.28"
              />
              <rect
                x={rugX + 2}
                y={Math.round(corridor.height / 2) - 11}
                width="276"
                height="22"
                fill="color-mix(in srgb, var(--muted-foreground) 32%, var(--card))"
              />
            </g>
          ))}
        </svg>

        {/* Bancos de madeira e vasos de plantas ao longo do corredor */}
        <div className="relative flex h-full w-full items-center justify-around px-16">
          <PixelPottedPlant size={28} />
          <PixelParkBench />
          <PixelPottedPlant size={30} />
          <PixelParkBench />
          <PixelPottedPlant size={28} />
        </div>
      </div>
    </div>
  );
});
