"use client";

import * as React from "react";
import type { Node, NodeProps } from "@xyflow/react";
import { AlertTriangle, Coffee, Pencil } from "lucide-react";
import type { OfficeMemberDTO } from "@/types/office";
import { PixelWorkstationDesk } from "./office-pixel-props";
import { officeDeskNodeStyles, officeRaciBadgeStyles } from "./office-styles";
import { PixelAvatar } from "./pixel-avatar";

export type OfficeMemberNodeData = {
  member: OfficeMemberDTO;
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: (memberId: string) => void;
};

export type OfficeMemberNodeType = Node<OfficeMemberNodeData, "officeMember">;

export const OfficeMemberNode = React.memo(function OfficeMemberNode({
  data,
}: NodeProps<OfficeMemberNodeType>) {
  const { member, isSelected, isDimmed, onSelect } = data;
  const styles = officeDeskNodeStyles({
    status: member.status,
    selected: isSelected,
    dimmed: isDimmed,
  });

  const isActive = member.status === "WORKING" || member.status === "OVERDUE";
  const isOverdue = member.status === "OVERDUE";

  const firstName = member.name.split(" ")[0] ?? member.name;
  const activeRole = member.activeTask?.role ?? member.tasks[0]?.role ?? null;
  const taskLabel = member.activeTask
    ? member.activeTask.title
    : member.todoTasksCount > 0
      ? `${member.todoTasksCount} na fila`
      : "Disponível";

  return (
    <button
      type="button"
      onClick={() => onSelect(member.id)}
      className={styles.card()}
      aria-label={`${member.name} — ${taskLabel}`}
      aria-pressed={isSelected}
    >
      {/* Balão de fala/alerta estilo quadrinhos acima da cabeça */}
      <div className={styles.speechBubble()} title={taskLabel}>
        {isOverdue ? (
          <AlertTriangle className="h-3 w-3 shrink-0" />
        ) : isActive ? (
          <Pencil className="h-2.5 w-2.5 shrink-0 text-warning" />
        ) : (
          <Coffee className="h-2.5 w-2.5 shrink-0" />
        )}
        <span className="truncate max-w-[122px]">{taskLabel}</span>
        {member.activeTasksCount > 1 && (
          <span className="shrink-0 rounded bg-primary/20 px-1 text-[9px] font-black text-primary">
            +{member.activeTasksCount - 1}
          </span>
        )}
        <span className={styles.speechTail()} aria-hidden="true" />
      </div>

      {/* Estação Pixel-Art direto no piso (Avatar + Bancada 2.5D sem caixa externa) */}
      <div className={styles.stage()}>
        <span className={styles.selectionRing()} aria-hidden="true" />

        {/* Encosto da cadeira ergonômica atrás do avatar */}
        <svg
          width="36"
          height="20"
          viewBox="0 0 18 10"
          shapeRendering="crispEdges"
          aria-hidden="true"
          className="pointer-events-none absolute top-1 left-1/2 -translate-x-1/2 opacity-90"
        >
          <rect x="2" y="0" width="14" height="9" fill="var(--pixel-ink)" />
          <rect x="3" y="1" width="12" height="7" fill="var(--secondary)" />
        </svg>

        <div className="relative -mt-4 z-10 transition-transform duration-150 group-hover:-translate-y-0.5">
          <PixelAvatar
            seed={member.id}
            deliveryGroup={member.deliveryGroup}
            status={member.status}
            size={48}
          />
        </div>

        <PixelWorkstationDesk
          isActive={isActive}
          isOverdue={isOverdue}
          className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 z-20"
        />
      </div>

      {/* Plaqueta estilo RPG nos pés com papel RACI + Nome */}
      <div className={styles.nameTag()}>
        {activeRole ? (
          <span className={officeRaciBadgeStyles({ role: activeRole })}>
            {activeRole}
          </span>
        ) : (
          <span className={styles.statusDot()} />
        )}
        <span className="truncate">{firstName}</span>
        {member.isCurrentUser && (
          <span className="text-[8px] font-black uppercase text-primary">
            VOCÊ
          </span>
        )}
      </div>
    </button>
  );
});
