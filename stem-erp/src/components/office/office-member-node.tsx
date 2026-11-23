"use client";

import * as React from "react";
import type { Node, NodeProps } from "@xyflow/react";
import { AlertTriangle, Coffee, Terminal } from "lucide-react";
import type { OfficeMemberDTO } from "@/types/office";
import { officeDeskNodeStyles } from "./office-styles";
import { PixelAvatar } from "./pixel-avatar";

export type OfficeMemberNodeData = {
  member: OfficeMemberDTO;
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: (memberId: string) => void;
};

export type OfficeMemberNodeType = Node<OfficeMemberNodeData, "officeMember">;

function PixelWorkstationDesk({
  isActive,
  isOverdue,
}: {
  isActive: boolean;
  isOverdue: boolean;
}) {
  const screenFill = isOverdue
    ? "var(--destructive)"
    : isActive
      ? "var(--primary)"
      : "var(--muted-foreground)";

  return (
    <svg
      width="104"
      height="26"
      viewBox="0 0 26 7"
      shapeRendering="crispEdges"
      aria-hidden="true"
      className="absolute bottom-0.5 left-1/2 -translate-x-1/2"
    >
      {/* Tampo da mesa */}
      <rect x="0" y="3" width="26" height="4" fill="var(--border)" />
      <rect x="1" y="4" width="24" height="2" fill="var(--card)" />
      {/* Monitor central */}
      <rect x="9" y="0" width="8" height="4" fill="var(--foreground)" opacity="0.85" />
      <rect
        x="10"
        y="1"
        width="6"
        height="2"
        fill={screenFill}
        opacity={isActive ? "0.95" : "0.25"}
      />
      {/* Base do monitor */}
      <rect x="12" y="4" width="2" height="1" fill="var(--foreground)" opacity="0.6" />
      {/* Caneca / acessório na mesa */}
      <rect x="20" y="2" width="2" height="2" fill="var(--amber)" opacity="0.9" />
      {/* Caderno */}
      <rect x="3" y="3" width="4" height="2" fill="var(--muted-foreground)" opacity="0.35" />
    </svg>
  );
}

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
      {/* Plaqueta com nome + indicador de status */}
      <div className={styles.nameTag()}>
        <span className={styles.statusDot()} />
        <span className="truncate">{firstName}</span>
        {member.isCurrentUser && (
          <span className="text-[9px] font-extrabold text-primary">VOCÊ</span>
        )}
      </div>

      {/* Palco pixel-art: Avatar + Mesa + Monitor */}
      <div className={styles.stage()}>
        {isActive && (
          <span className={styles.typingBubble()} aria-hidden="true">
            <span className="h-1 w-1 rounded-full bg-primary animate-bounce" />
            <span className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:120ms]" />
            <span className="h-1 w-1 rounded-full bg-primary animate-bounce [animation-delay:240ms]" />
          </span>
        )}

        <div className="relative -mt-2 z-10 transition-transform duration-150 group-hover:-translate-y-0.5">
          <PixelAvatar
            seed={member.id}
            deliveryGroup={member.deliveryGroup}
            status={member.status}
            size={44}
          />
        </div>

        <PixelWorkstationDesk isActive={isActive} isOverdue={isOverdue} />
      </div>

      {/* Balão da tarefa atual */}
      <div className={styles.taskPill()} title={taskLabel}>
        {isOverdue ? (
          <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" />
        ) : isActive ? (
          <Terminal className="h-3 w-3 shrink-0 text-primary" />
        ) : (
          <Coffee className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate text-left flex-1">{taskLabel}</span>
        {member.activeTasksCount > 1 && (
          <span className="shrink-0 rounded bg-primary/15 px-1 text-[9px] font-bold text-primary">
            +{member.activeTasksCount - 1}
          </span>
        )}
      </div>
    </button>
  );
});
