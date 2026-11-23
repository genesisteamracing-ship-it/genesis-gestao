"use client";

import * as React from "react";
import type { DeliveryGroup } from "@prisma/client";
import {
  getAvatarTraits,
  type PixelSemanticTone,
} from "@/lib/office-layout";
import type { OfficeMemberStatus } from "@/types/office";

interface PixelAvatarProps {
  seed: string;
  deliveryGroup: DeliveryGroup | null;
  status: OfficeMemberStatus;
  size?: number;
  className?: string;
}

const TONE_VAR_MAP: Record<PixelSemanticTone, string> = {
  primary: "var(--primary)",
  success: "var(--success)",
  warning: "var(--warning)",
  purple: "var(--purple)",
  magenta: "var(--magenta)",
  peach: "var(--peach)",
  "chart-4": "var(--chart-4)",
};

export function PixelAvatar({
  seed,
  deliveryGroup,
  status,
  size = 44,
  className,
}: PixelAvatarProps) {
  const traits = React.useMemo(
    () => getAvatarTraits(seed, deliveryGroup),
    [seed, deliveryGroup]
  );

  const hairFill = TONE_VAR_MAP[traits.hairTone];
  const outfitFill = TONE_VAR_MAP[traits.outfitTone];
  const isActive = status === "WORKING" || status === "OVERDUE";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={className}
    >
      {/* Sombra sutil no piso */}
      <rect x="4" y="14" width="8" height="1" fill="var(--border)" />

      {/* Corpo / Camiseta do Setor */}
      <rect x="4" y="9" width="8" height="5" fill={outfitFill} />
      <rect x="3" y="10" width="1" height="3" fill={outfitFill} />
      <rect x="12" y="10" width="1" height="3" fill={outfitFill} />

      {/* Gola e detalhe do crachá */}
      <rect x="6" y="9" width="4" height="1" fill="var(--card)" opacity="0.85" />
      {traits.hasBadgePin && (
        <rect x="9" y="11" width="2" height="1" fill="var(--amber)" />
      )}

      {/* Mãos (levantadas digitando quando em execução) */}
      {isActive ? (
        <>
          <rect x="3" y="12" width="2" height="1" fill="var(--peach)" />
          <rect x="11" y="12" width="2" height="1" fill="var(--peach)" />
        </>
      ) : (
        <>
          <rect x="3" y="13" width="1" height="1" fill="var(--peach)" />
          <rect x="12" y="13" width="1" height="1" fill="var(--peach)" />
        </>
      )}

      {/* Cabeça */}
      <rect x="5" y="3" width="6" height="6" fill="var(--peach)" opacity="0.85" />
      <rect x="4" y="4" width="8" height="4" fill="var(--peach)" opacity="0.85" />

      {/* Cabelo / Boné */}
      {traits.hairStyle === "short" && (
        <>
          <rect x="4" y="2" width="8" height="2" fill={hairFill} />
          <rect x="4" y="4" width="1" height="1" fill={hairFill} />
          <rect x="11" y="4" width="1" height="1" fill={hairFill} />
        </>
      )}
      {traits.hairStyle === "spiky" && (
        <>
          <rect x="5" y="1" width="2" height="2" fill={hairFill} />
          <rect x="8" y="1" width="2" height="2" fill={hairFill} />
          <rect x="4" y="2" width="8" height="2" fill={hairFill} />
        </>
      )}
      {traits.hairStyle === "bob" && (
        <>
          <rect x="4" y="2" width="8" height="2" fill={hairFill} />
          <rect x="3" y="3" width="1" height="5" fill={hairFill} />
          <rect x="12" y="3" width="1" height="5" fill={hairFill} />
        </>
      )}
      {traits.hairStyle === "ponytail" && (
        <>
          <rect x="4" y="2" width="8" height="2" fill={hairFill} />
          <rect x="12" y="3" width="2" height="3" fill={hairFill} />
          <rect x="13" y="6" width="1" height="2" fill={hairFill} />
        </>
      )}
      {traits.hairStyle === "curly" && (
        <>
          <rect x="4" y="1" width="8" height="2" fill={hairFill} />
          <rect x="3" y="2" width="1" height="4" fill={hairFill} />
          <rect x="12" y="2" width="1" height="4" fill={hairFill} />
        </>
      )}
      {traits.hairStyle === "cap" && (
        <>
          <rect x="4" y="2" width="8" height="2" fill={outfitFill} />
          <rect x="3" y="3" width="10" height="1" fill="var(--foreground)" opacity="0.85" />
        </>
      )}

      {/* Olhos */}
      <rect x="6" y="5" width="1" height="1" fill="var(--foreground)" />
      <rect x="9" y="5" width="1" height="1" fill="var(--foreground)" />

      {/* Óculos */}
      {traits.hasGlasses && (
        <>
          <rect x="5" y="5" width="3" height="1" fill="var(--foreground)" opacity="0.35" />
          <rect x="8" y="5" width="3" height="1" fill="var(--foreground)" opacity="0.35" />
          <rect x="7" y="5" width="2" height="1" fill="var(--foreground)" opacity="0.6" />
        </>
      )}

      {/* Expressão facial */}
      {status === "OVERDUE" ? (
        <rect x="7" y="7" width="2" height="1" fill="var(--destructive)" />
      ) : status === "WORKING" ? (
        <rect x="7" y="7" width="2" height="1" fill="var(--foreground)" opacity="0.7" />
      ) : (
        <>
          <rect x="6" y="7" width="1" height="1" fill="var(--foreground)" opacity="0.6" />
          <rect x="7" y="8" width="2" height="1" fill="var(--foreground)" opacity="0.6" />
          <rect x="9" y="7" width="1" height="1" fill="var(--foreground)" opacity="0.6" />
        </>
      )}

      {/* Caneca de café na mão quando disponível (IDLE) */}
      {status === "IDLE" && (
        <rect x="13" y="11" width="2" height="2" fill="var(--amber)" />
      )}
    </svg>
  );
}
