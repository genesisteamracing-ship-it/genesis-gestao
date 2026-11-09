"use client";

import * as React from "react";
import { KeyRound, Pencil, Settings, Trash2, Unlock } from "lucide-react";
import { toast } from "sonner";
import { unlockUserAccountAction } from "@/actions/auth-actions";
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
import { ResetMemberPasswordDialog } from "@/components/modals/reset-member-password-dialog";
import { DeleteMemberDialog } from "@/components/modals/delete-member-dialog";

interface MemberRowActionsProps {
  member: TeamMemberDTO;
  teams: TeamDTO[];
  onUnlock?: (memberId: string) => void | Promise<void>;
}

export function MemberRowActions({
  member,
  teams,
  onUnlock,
}: MemberRowActionsProps) {
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isUnlocking, setIsUnlocking] = React.useState(false);

  const isSuperAdmin = member.role === "SUPER_ADMIN";
  const isLockedOrFailed = member.isLocked || member.failedLoginAttempts > 0;

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      if (onUnlock) {
        await onUnlock(member.id);
      } else {
        const res = await unlockUserAccountAction(member.id);
        if (!res.success) {
          toast.error(res.message);
          return;
        }
        toast.success(res.message);
      }
    } catch {
      toast.error("Erro inesperado ao desbloquear conta.");
    } finally {
      setIsUnlocking(false);
    }
  };

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
            <Settings className="h-4 w-4 text-foreground transition-transform duration-200 hover:rotate-45" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            onClick={() => setIsEditOpen(true)}
            className="cursor-pointer gap-2 text-xs font-medium"
          >
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Editar Dados</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setIsResetPasswordOpen(true)}
            className="cursor-pointer gap-2 text-xs font-medium"
          >
            <KeyRound className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Redefinir Senha</span>
          </DropdownMenuItem>

          {isLockedOrFailed && (
            <DropdownMenuItem
              disabled={isUnlocking}
              onClick={handleUnlock}
              className="cursor-pointer gap-2 text-xs font-medium text-success focus:bg-success/10 focus:text-success"
            >
              <Unlock className="h-3.5 w-3.5 text-success" />
              <span>
                {isUnlocking ? "Desbloqueando..." : "Desbloquear Conta"}
              </span>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            disabled={isSuperAdmin}
            onClick={() => setIsDeleteOpen(true)}
            className="cursor-pointer gap-2 text-xs font-medium text-destructive focus:bg-destructive/10 focus:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Excluir Integrante</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditMemberDialog
        member={member}
        teams={teams}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      <ResetMemberPasswordDialog
        member={member}
        open={isResetPasswordOpen}
        onOpenChange={setIsResetPasswordOpen}
      />

      <DeleteMemberDialog
        member={member}
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
      />
    </>
  );
}
