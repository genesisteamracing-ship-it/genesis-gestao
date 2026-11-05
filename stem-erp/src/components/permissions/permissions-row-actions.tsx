"use client";

import * as React from "react";
import { CheckCircle2, Settings, ShieldBan } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TeamMemberDTO } from "@/types/auth";

export interface PermissionsRowActionsProps {
  member: TeamMemberDTO;
  isSelf: boolean;
  onGrantAll: () => void;
  onRestrictOperational: () => void;
}

export function PermissionsRowActions({
  member,
  isSelf,
  onGrantAll,
  onRestrictOperational,
}: PermissionsRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-lg border-border/80 bg-card hover:bg-muted/80 hover:text-foreground"
          aria-label={`Ações de permissão para ${member.name}`}
        >
          <Settings className="h-4 w-4 text-foreground transition-transform duration-200 hover:rotate-45" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem
          onClick={onGrantAll}
          className="cursor-pointer gap-2 text-xs font-medium text-success focus:text-success"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Liberar Todos os Módulos (SIM)</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={onRestrictOperational}
          className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <ShieldBan className="h-3.5 w-3.5" />
          <span>Restringir Operacionais (NÃO)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
