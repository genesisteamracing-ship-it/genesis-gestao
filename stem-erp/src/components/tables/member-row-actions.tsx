"use client";

import * as React from "react";
import { Pencil, Settings, Trash2 } from "lucide-react";
import type { TeamDTO, TeamMemberDTO } from "@/types/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditMemberDialog } from "@/components/modals/edit-member-dialog";
import { DeleteMemberDialog } from "@/components/modals/delete-member-dialog";

interface MemberRowActionsProps {
  member: TeamMemberDTO;
  teams: TeamDTO[];
}

export function MemberRowActions({ member, teams }: MemberRowActionsProps) {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const isSuperAdmin = member.role === "SUPER_ADMIN";

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-lg border-border/80 bg-card hover:bg-muted/80 hover:text-foreground"
            aria-label={`Ações de gerenciamento para ${member.name}`}
          >
            <Settings className="h-4 w-4 text-muted-foreground transition-transform duration-200 hover:rotate-45" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem
            onClick={() => setIsEditOpen(true)}
            className="cursor-pointer gap-2 text-xs font-medium"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Editar</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={isSuperAdmin}
            onClick={() => setIsDeleteOpen(true)}
            className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Excluir</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditMemberDialog
        member={member}
        teams={teams}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <DeleteMemberDialog
        member={member}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
