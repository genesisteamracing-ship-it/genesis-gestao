"use client";

import * as React from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTeamMemberAction } from "@/actions/auth-actions";
import type { TeamMemberDTO } from "@/types/auth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteMemberDialogProps {
  member: TeamMemberDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteMemberDialog({
  member,
  open,
  onOpenChange,
}: DeleteMemberDialogProps) {
  const [isPending, startTransition] = React.useTransition();

  const isSuperAdmin = member.role === "SUPER_ADMIN";

  function handleDelete() {
    if (isSuperAdmin) {
      toast.error("Contas com permissão de SuperAdmin não podem ser excluídas.");
      return;
    }

    startTransition(async () => {
      const res = await deleteTeamMemberAction({ userId: member.id });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/10 text-destructive shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold">
                Excluir Integrante
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Revogação de acesso e exclusão definitiva da conta
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-sm">
          {isSuperAdmin ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <strong>Atenção:</strong> O usuário <strong>{member.name}</strong> é
              um SuperAdmin. Por motivos de segurança e governança, sua conta não
              pode ser excluída por este menu.
            </div>
          ) : (
            <p className="text-muted-foreground text-xs leading-relaxed">
              Tem certeza que deseja excluir o integrante{" "}
              <strong className="text-foreground">{member.name}</strong> (
              <span className="text-muted-foreground">{member.email}</span>)?
              Todas as sessões ativas serão canceladas e o usuário não poderá mais
              acessar a plataforma.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="text-xs"
          >
            Cancelar
          </Button>
          {!isSuperAdmin && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="text-xs gap-1.5"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Excluindo...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Excluir Integrante</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
