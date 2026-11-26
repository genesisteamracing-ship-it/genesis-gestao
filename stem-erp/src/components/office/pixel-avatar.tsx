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
  size = 48,
  className,
}: PixelAvatarProps) {
  const traits = React.useMemo(
    () => getAvatarTraits(seed, deliveryGroup),
    [seed, deliveryGroup]
  );

  const hairFill = TONE_VAR_MAP[traits.hairTone];
  const hairShade = `color-mix(in srgb, ${hairFill} 72%, var(--pixel-ink, var(--foreground)))`;
  const outfitFill = TONE_VAR_MAP[traits.outfitTone];
  const outfitShade = `color-mix(in srgb, ${outfitFill} 70%, var(--pixel-ink, var(--foreground)))`;
  const skinBase = `color-mix(in srgb, var(--peach) 55%, var(--amber) 45%)`;
  const skinShade = `color-mix(in srgb, var(--peach) 72%, var(--warning) 28%)`;
  const ink = "var(--pixel-ink, var(--foreground))";
  const eyeWhite = "var(--card)";
  const isActive = status === "WORKING" || status === "OVERDUE";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`[--pixel-ink:var(--foreground)] dark:[--pixel-ink:var(--background)] ${className ?? ""}`}
    >
      {/* Sombra ovalada no piso */}
      <rect x="6" y="21" width="12" height="2" fill={ink} opacity="0.28" />
      <rect x="7" y="22" width="10" height="1" fill={ink} opacity="0.18" />

      {/* Cabelo longo traseiro (bob / ponytail / curly) */}
      {(traits.hairStyle === "bob" || traits.hairStyle === "curly") && (
        <>
          <rect x="5" y="6" width="14" height="9" fill={ink} />
          <rect x="6" y="7" width="12" height="7" fill={hairShade} />
        </>
      )}
      {traits.hairStyle === "ponytail" && (
        <>
          <rect x="16" y="6" width="4" height="7" fill={ink} />
          <rect x="17" y="7" width="2" height="5" fill={hairShade} />
        </>
      )}

      {/* Contorno do tronco / ombros */}
      <rect x="5" y="14" width="14" height="7" fill={ink} />
      <rect x="6" y="15" width="12" height="5" fill={outfitFill} />
      {/* Sombra lateral da camisa */}
      <rect x="6" y="18" width="12" height="2" fill={outfitShade} />
      {/* Mangas */}
      <rect x="5" y="15" width="2" height="4" fill={outfitShade} />
      <rect x="17" y="15" width="2" height="4" fill={outfitShade} />

      {/* Gola V / Crachá da equipe */}
      <rect x="10" y="15" width="4" height="1" fill={eyeWhite} />
      <rect x="11" y="16" width="2" height="3" fill={eyeWhite} opacity="0.75" />
      {traits.hasBadgePin && (
        <rect x="14" y="16" width="2" height="2" fill="var(--amber)" />
      )}

      {/* Braços / Mãos */}
      {isActive ? (
        <>
          <rect x="5" y="18" width="3" height="2" fill={skinBase} />
          <rect x="16" y="18" width="3" height="2" fill={skinBase} />
        </>
      ) : (
        <>
          <rect x="5" y="19" width="2" height="2" fill={skinBase} />
          <rect x="17" y="19" width="2" height="2" fill={skinBase} />
        </>
      )}

      {/* Contorno da cabeça (Chibi RPG 16-bit) */}
      <rect x="6" y="4" width="12" height="11" fill={ink} />
      <rect x="5" y="6" width="14" height="7" fill={ink} />

      {/* Rosto + Sombra do queixo/bochechas */}
      <rect x="7" y="6" width="10" height="8" fill={skinBase} />
      <rect x="6" y="7" width="12" height="5" fill={skinBase} />
      <rect x="7" y="13" width="10" height="1" fill={skinShade} />
      {/* Blush sutil */}
      <rect x="7" y="11" width="2" height="1" fill="var(--peach)" opacity="0.7" />
      <rect x="15" y="11" width="2" height="1" fill="var(--peach)" opacity="0.7" />

      {/* Cabelo frontal / Boné */}
      {traits.hairStyle === "short" && (
        <>
          <rect x="6" y="3" width="12" height="4" fill={ink} />
          <rect x="7" y="4" width="10" height="3" fill={hairFill} />
          <rect x="7" y="6" width="3" height="1" fill={hairShade} />
          <rect x="6" y="6" width="1" height="3" fill={hairShade} />
          <rect x="17" y="6" width="1" height="3" fill={hairShade} />
        </>
      )}
      {traits.hairStyle === "spiky" && (
        <>
          <rect x="7" y="2" width="3" height="2" fill={ink} />
          <rect x="11" y="1" width="3" height="3" fill={ink} />
          <rect x="15" y="2" width="2" height="2" fill={ink} />
          <rect x="6" y="3" width="12" height="4" fill={ink} />
          <rect x="8" y="3" width="2" height="1" fill={hairFill} />
          <rect x="12" y="2" width="2" height="2" fill={hairFill} />
          <rect x="7" y="4" width="10" height="3" fill={hairFill} />
          <rect x="10" y="6" width="2" height="1" fill={hairShade} />
        </>
      )}
      {traits.hairStyle === "bob" && (
        <>
          <rect x="6" y="3" width="12" height="4" fill={ink} />
          <rect x="7" y="4" width="10" height="3" fill={hairFill} />
          <rect x="6" y="6" width="2" height="6" fill={hairFill} />
          <rect x="16" y="6" width="2" height="6" fill={hairFill} />
        </>
      )}
      {traits.hairStyle === "ponytail" && (
        <>
          <rect x="6" y="3" width="12" height="4" fill={ink} />
          <rect x="7" y="4" width="10" height="3" fill={hairFill} />
          <rect x="7" y="6" width="4" height="1" fill={hairShade} />
        </>
      )}
      {traits.hairStyle === "curly" && (
        <>
          <rect x="6" y="2" width="12" height="5" fill={ink} />
          <rect x="7" y="3" width="10" height="4" fill={hairFill} />
          <rect x="6" y="5" width="2" height="5" fill={hairFill} />
          <rect x="16" y="5" width="2" height="5" fill={hairFill} />
          <rect x="9" y="4" width="2" height="1" fill={hairShade} />
          <rect x="13" y="4" width="2" height="1" fill={hairShade} />
        </>
      )}
      {traits.hairStyle === "cap" && (
        <>
          <rect x="6" y="3" width="12" height="4" fill={ink} />
          <rect x="7" y="4" width="10" height="2" fill={outfitFill} />
          <rect x="10" y="4" width="3" height="1" fill={eyeWhite} opacity="0.85" />
          <rect x="5" y="6" width="15" height="2" fill={ink} />
          <rect x="6" y="6" width="13" height="1" fill={outfitShade} />
        </>
      )}

      {/* Olhos estilo RPG 16-bit com brilho */}
      <rect x="8" y="9" width="2" height="2" fill={ink} />
      <rect x="14" y="9" width="2" height="2" fill={ink} />
      <rect x="8" y="9" width="1" height="1" fill={eyeWhite} />
      <rect x="14" y="9" width="1" height="1" fill={eyeWhite} />

      {/* Óculos pixelados */}
      {traits.hasGlasses && (
        <>
          <rect x="7" y="8" width="4" height="1" fill={ink} opacity="0.75" />
          <rect x="13" y="8" width="4" height="1" fill={ink} opacity="0.75" />
          <rect x="11" y="9" width="2" height="1" fill={ink} opacity="0.75" />
        </>
      )}

      {/* Headset gamer / rádio de pista */}
      {traits.hasHeadset && traits.hairStyle !== "cap" && (
        <>
          <rect x="5" y="8" width="1" height="4" fill="var(--primary)" />
          <rect x="18" y="8" width="1" height="4" fill="var(--primary)" />
        </>
      )}

      {/* Boca / Expressão */}
      {status === "OVERDUE" ? (
        <>
          <rect x="10" y="12" width="4" height="1" fill="var(--destructive)" />
          {/* Gotinha de suor pixelada */}
          <rect x="16" y="7" width="1" height="2" fill="var(--primary)" />
        </>
      ) : status === "WORKING" ? (
        <rect x="11" y="12" width="2" height="1" fill={ink} opacity="0.75" />
      ) : (
        <>
          <rect x="10" y="11" width="1" height="1" fill={ink} opacity="0.7" />
          <rect x="11" y="12" width="2" height="1" fill={ink} opacity="0.7" />
          <rect x="13" y="11" width="1" height="1" fill={ink} opacity="0.7" />
        </>
      )}

      {/* Caneca de café na mão quando disponível (IDLE) */}
      {status === "IDLE" && (
        <>
          <rect x="18" y="16" width="4" height="4" fill={ink} />
          <rect x="19" y="17" width="2" height="2" fill="var(--amber)" />
          <rect x="19" y="14" width="1" height="2" fill={eyeWhite} opacity="0.55" />
        </>
      )}
    </svg>
  );
}
