"use client";

import * as React from "react";

const INK = "var(--pixel-ink, var(--foreground))";
const WOOD_MAIN = "color-mix(in srgb, var(--warning) 48%, var(--card))";
const WOOD_DARK = "color-mix(in srgb, var(--warning) 62%, var(--background))";
const WOOD_LIGHT = "color-mix(in srgb, var(--amber) 52%, var(--card))";
const LEAF_MAIN = "color-mix(in srgb, var(--success) 75%, var(--card))";
const LEAF_DARK = "color-mix(in srgb, var(--success) 55%, var(--background))";
const LEAF_LIGHT = "color-mix(in srgb, var(--success) 68%, var(--amber))";

export function PixelTree({
  size = 44,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {/* Sombra no gramado */}
      <rect x="4" y="14" width="8" height="2" fill={INK} opacity="0.32" />
      {/* Tronco */}
      <rect x="6" y="11" width="4" height="4" fill={INK} />
      <rect x="7" y="11" width="2" height="3" fill={WOOD_DARK} />
      {/* Copa pixelada 16-bit */}
      <rect x="4" y="2" width="8" height="9" fill={INK} />
      <rect x="2" y="4" width="12" height="6" fill={INK} />
      <rect x="5" y="1" width="6" height="1" fill={INK} />
      <rect x="5" y="2" width="6" height="2" fill={LEAF_LIGHT} />
      <rect x="3" y="4" width="10" height="4" fill={LEAF_MAIN} />
      <rect x="4" y="8" width="8" height="2" fill={LEAF_DARK} />
      <rect x="5" y="4" width="3" height="2" fill={LEAF_LIGHT} />
    </svg>
  );
}

export function PixelPottedPlant({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {/* Vaso de cerâmica */}
      <rect x="3" y="8" width="6" height="4" fill={INK} />
      <rect x="4" y="9" width="4" height="2" fill="var(--peach)" />
      {/* Folhagem */}
      <rect x="3" y="3" width="6" height="5" fill={INK} />
      <rect x="2" y="4" width="8" height="3" fill={INK} />
      <rect x="4" y="3" width="4" height="2" fill={LEAF_LIGHT} />
      <rect x="3" y="5" width="6" height="2" fill={LEAF_MAIN} />
    </svg>
  );
}

export function PixelParkBench({ className }: { className?: string }) {
  return (
    <svg
      width="52"
      height="24"
      viewBox="0 0 26 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      <rect x="2" y="9" width="22" height="2" fill={INK} opacity="0.25" />
      <rect x="2" y="2" width="22" height="7" fill={INK} />
      <rect x="3" y="3" width="20" height="2" fill={WOOD_LIGHT} />
      <rect x="3" y="6" width="20" height="2" fill={WOOD_MAIN} />
      <rect x="4" y="9" width="2" height="2" fill={INK} />
      <rect x="20" y="9" width="2" height="2" fill={INK} />
    </svg>
  );
}

export function PixelWallBookshelf({ className }: { className?: string }) {
  return (
    <svg
      width="60"
      height="36"
      viewBox="0 0 20 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      <rect x="0" y="0" width="20" height="12" fill={INK} />
      <rect x="1" y="1" width="18" height="10" fill={WOOD_DARK} />
      {/* Prateleira 1 */}
      <rect x="2" y="2" width="16" height="3" fill={INK} opacity="0.45" />
      <rect x="3" y="2" width="2" height="3" fill="var(--primary)" />
      <rect x="5" y="3" width="2" height="2" fill="var(--amber)" />
      <rect x="8" y="2" width="3" height="3" fill="var(--destructive)" />
      <rect x="12" y="2" width="2" height="3" fill="var(--success)" />
      <rect x="15" y="3" width="2" height="2" fill="var(--purple)" />
      {/* Prateleira 2 */}
      <rect x="2" y="7" width="16" height="3" fill={INK} opacity="0.45" />
      <rect x="3" y="7" width="3" height="3" fill="var(--magenta)" />
      <rect x="7" y="8" width="2" height="2" fill="var(--card)" />
      <rect x="10" y="7" width="2" height="3" fill="var(--warning)" />
      <rect x="13" y="7" width="4" height="3" fill="var(--chart-4)" />
    </svg>
  );
}

export function PixelWallBoard({
  accent = "var(--primary)",
  className,
}: {
  accent?: string;
  className?: string;
}) {
  return (
    <svg
      width="68"
      height="30"
      viewBox="0 0 34 15"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      <rect x="0" y="0" width="34" height="15" fill={INK} />
      <rect x="1" y="1" width="32" height="13" fill="var(--card)" />
      {/* Colunas Kanban / Gráficos CAD */}
      <rect x="3" y="3" width="8" height="2" fill={accent} />
      <rect x="3" y="6" width="6" height="2" fill="var(--amber)" />
      <rect x="3" y="9" width="7" height="2" fill="var(--success)" />
      <rect x="13" y="3" width="8" height="8" fill="var(--muted)" />
      <rect x="14" y="5" width="6" height="2" fill={accent} opacity="0.8" />
      <rect x="23" y="3" width="8" height="4" fill="var(--peach)" opacity="0.85" />
      <rect x="23" y="8" width="6" height="3" fill="var(--chart-4)" opacity="0.85" />
    </svg>
  );
}

export function PixelFloorLamp({ className }: { className?: string }) {
  return (
    <div className={`pointer-events-none relative flex items-center justify-center ${className ?? ""}`}>
      <div
        className="absolute h-16 w-16 rounded-full opacity-45"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--amber) 55%, transparent) 0%, transparent 72%)",
        }}
      />
      <svg
        width="20"
        height="36"
        viewBox="0 0 10 18"
        shapeRendering="crispEdges"
        aria-hidden="true"
        className="relative"
      >
        <rect x="2" y="1" width="6" height="5" fill={INK} />
        <rect x="3" y="2" width="4" height="3" fill="var(--amber)" />
        <rect x="4" y="6" width="2" height="9" fill={INK} />
        <rect x="2" y="15" width="6" height="2" fill={INK} />
      </svg>
    </div>
  );
}

export function PixelWorkstationDesk({
  isActive = false,
  isOverdue = false,
  unoccupied = false,
  className,
}: {
  isActive?: boolean;
  isOverdue?: boolean;
  unoccupied?: boolean;
  className?: string;
}) {
  const screenFill = isOverdue
    ? "var(--destructive)"
    : isActive
      ? "var(--primary)"
      : "var(--muted-foreground)";

  return (
    <svg
      width="116"
      height="46"
      viewBox="0 0 29 12"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {/* Sombra da bancada no piso */}
      <rect x="1" y="10" width="27" height="2" fill={INK} opacity="0.28" />

      {/* Cadeira quando vazia */}
      {unoccupied && (
        <>
          <rect x="10" y="0" width="9" height="4" fill={INK} />
          <rect x="11" y="1" width="7" height="2" fill="var(--secondary)" />
        </>
      )}

      {/* Tampo de madeira 2.5D com borda pixelada */}
      <rect x="1" y="3" width="27" height="7" fill={INK} />
      <rect x="2" y="4" width="25" height="4" fill={WOOD_LIGHT} />
      <rect x="2" y="8" width="25" height="1" fill={WOOD_DARK} />

      {/* Pés laterais da mesa */}
      <rect x="2" y="9" width="2" height="2" fill={INK} />
      <rect x="25" y="9" width="2" height="2" fill={INK} />

      {/* Monitor widescreen na bancada */}
      <rect x="9" y="1" width="11" height="5" fill={INK} />
      <rect
        x="10"
        y="2"
        width="9"
        height="3"
        fill={screenFill}
        opacity={isActive ? "0.95" : "0.35"}
      />
      {isActive && (
        <>
          <rect x="11" y="2" width="4" height="1" fill="var(--card)" opacity="0.85" />
          <rect x="11" y="4" width="6" height="1" fill="var(--amber)" opacity="0.9" />
        </>
      )}
      <rect x="13" y="6" width="3" height="1" fill={INK} />

      {/* Teclado / Caderno & Caneca */}
      <rect x="4" y="5" width="4" height="2" fill="var(--card)" opacity="0.85" />
      <rect x="22" y="4" width="3" height="3" fill={INK} />
      <rect x="23" y="5" width="1" height="1" fill="var(--amber)" />
    </svg>
  );
}

export function PixelReceptionDecor() {
  return (
    <div className="pointer-events-none absolute inset-x-4 bottom-4 top-14 flex flex-col justify-between">
      {/* Balcão de recepção em L + Atendente virtual / terminal */}
      <div className="flex items-center justify-between px-2">
        <svg
          width="136"
          height="58"
          viewBox="0 0 34 15"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          {/* Tapete de entrada */}
          <rect x="1" y="2" width="14" height="10" fill={INK} opacity="0.35" />
          <rect
            x="2"
            y="3"
            width="12"
            height="8"
            fill="color-mix(in srgb, var(--chart-4) 45%, var(--card))"
          />
          {/* Balcão de madeira da recepção */}
          <rect x="17" y="3" width="16" height="10" fill={INK} />
          <rect x="18" y="4" width="14" height="5" fill={WOOD_LIGHT} />
          <rect x="18" y="9" width="14" height="3" fill={WOOD_MAIN} />
          <rect x="21" y="2" width="6" height="3" fill={INK} />
          <rect x="22" y="3" width="4" height="1" fill="var(--primary)" />
          <rect x="29" y="5" width="2" height="2" fill="var(--amber)" />
        </svg>

        {/* Bebedouro pixelado */}
        <svg
          width="28"
          height="52"
          viewBox="0 0 7 13"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <rect x="1" y="0" width="5" height="5" fill={INK} />
          <rect x="2" y="1" width="3" height="3" fill="var(--primary)" opacity="0.65" />
          <rect x="1" y="5" width="5" height="7" fill={INK} />
          <rect x="2" y="6" width="3" height="5" fill="var(--card)" />
          <rect x="2" y="7" width="1" height="1" fill="var(--destructive)" />
          <rect x="4" y="7" width="1" height="1" fill="var(--primary)" />
        </svg>
      </div>

      {/* Área de espera com sofá e mesa de centro */}
      <div className="flex items-end justify-between px-3">
        <PixelParkBench />
        <svg
          width="96"
          height="44"
          viewBox="0 0 24 11"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <rect x="1" y="1" width="22" height="9" fill={INK} />
          <rect x="2" y="2" width="20" height="7" fill={WOOD_DARK} />
          <rect x="6" y="4" width="12" height="4" fill={WOOD_LIGHT} />
          <rect x="10" y="5" width="4" height="2" fill="var(--amber)" />
        </svg>
      </div>
    </div>
  );
}

export function PixelCopaLoungeDecor({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-3 ${
        compact ? "bottom-2 h-14 opacity-75" : "bottom-3 top-12"
      } flex flex-col justify-between`}
    >
      {!compact && (
        <div className="flex items-center justify-between px-2">
          {/* Bancada de café, pia e máquina de espresso */}
          <svg
            width="156"
            height="48"
            viewBox="0 0 39 12"
            shapeRendering="crispEdges"
            aria-hidden="true"
          >
            <rect x="0" y="1" width="28" height="10" fill={INK} />
            <rect x="1" y="2" width="26" height="4" fill="var(--card)" />
            <rect x="1" y="6" width="26" height="4" fill="var(--secondary)" />
            {/* Cafeteira vermelha */}
            <rect x="4" y="1" width="5" height="4" fill="var(--destructive)" />
            <rect x="12" y="2" width="6" height="3" fill="var(--muted-foreground)" opacity="0.4" />
            <rect x="21" y="2" width="4" height="3" fill="var(--amber)" />
            {/* Vending machine / Geladeira */}
            <rect x="30" y="0" width="8" height="11" fill={INK} />
            <rect x="31" y="1" width="6" height="9" fill="var(--destructive)" opacity="0.85" />
            <rect x="32" y="2" width="4" height="4" fill="var(--card)" opacity="0.85" />
          </svg>

          <PixelPottedPlant size={30} />
        </div>
      )}

      {/* Sofá do Lounge + Mesa de Ping-Pong igual à referência */}
      <div className="flex items-end justify-between px-2">
        <svg
          width="112"
          height="42"
          viewBox="0 0 28 11"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <rect x="1" y="2" width="24" height="8" fill={INK} />
          <rect x="2" y="3" width="22" height="3" fill="var(--primary)" opacity="0.85" />
          <rect x="2" y="6" width="22" height="3" fill="var(--chart-4)" opacity="0.75" />
        </svg>

        {/* Mesa de Ping-Pong azul */}
        <svg
          width="96"
          height="46"
          viewBox="0 0 24 12"
          shapeRendering="crispEdges"
          aria-hidden="true"
        >
          <rect x="1" y="1" width="22" height="9" fill={INK} />
          <rect x="2" y="2" width="20" height="7" fill="var(--primary)" />
          <rect x="2" y="5" width="20" height="1" fill="var(--card)" opacity="0.85" />
          <rect x="11" y="1" width="2" height="9" fill="var(--card)" />
          <rect x="4" y="10" width="2" height="2" fill={INK} />
          <rect x="18" y="10" width="2" height="2" fill={INK} />
        </svg>
      </div>
    </div>
  );
}

export function PixelPitCarPedestal({ className }: { className?: string }) {
  return (
    <svg
      width="108"
      height="40"
      viewBox="0 0 27 10"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {/* Pedestal de exposição */}
      <rect x="1" y="3" width="25" height="6" fill={INK} />
      <rect x="2" y="4" width="23" height="4" fill="var(--secondary)" />
      {/* Miniatura F1 Gênesis Racing */}
      <rect x="6" y="2" width="15" height="3" fill="var(--primary)" />
      <rect x="4" y="3" width="3" height="2" fill="var(--amber)" />
      <rect x="20" y="1" width="3" height="3" fill="var(--magenta)" />
      <rect x="7" y="4" width="3" height="2" fill={INK} />
      <rect x="17" y="4" width="3" height="2" fill={INK} />
    </svg>
  );
}
