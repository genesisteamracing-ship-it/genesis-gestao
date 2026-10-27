"use client";

import * as React from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTeamAction } from "@/actions/auth-actions";
import { useInvalidateDashboard } from "@/hooks/use-invalidate-dashboard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface DeleteTeamDialogProps {
  teamId: string;
  teamName: string;
}

export function DeleteTeamDialog({ teamId, teamName }: DeleteTeamDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [confirmationText, setConfirmationText] = React.useState("");
  const [isPending, startTransition] = React.useTransition();
  const invalidateDashboard = useInvalidateDashboard();

  const isConfirmed = confirmationText.trim() === "EXCLUIR";

  function handleDelete() {
    if (!isConfirmed) return;

    startTransition(async () => {
      const res = await deleteTeamAction({
        teamId,
        confirmationText: confirmationText.trim(),
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      invalidateDashboard();
      setOpen(false);
      setConfirmationText("");
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setConfirmationText("");
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Excluir equipe ${teamName}`}
          title="Excluir equipe permanentemente"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-destructive hover:bg-destructive/10 hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive/30 cursor-pointer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader className="space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground">
            Excluir Equipe &quot;{teamName}&quot;?
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Esta ação é irreversível. Todos os dados associados a esta equipe,
            incluindo planejamento de recursos, transações do livro caixa, categorias e
            contas de integrantes vinculados serão excluídos permanentemente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive font-medium">
            Digite <strong className="font-bold uppercase tracking-wider">EXCLUIR</strong> no campo abaixo para confirmar:
          </div>

          <Input
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Digite EXCLUIR"
            disabled={isPending}
            className="h-10 text-sm font-semibold tracking-wider placeholder:font-normal placeholder:tracking-normal"
            autoFocus
          />
        </div>

        <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmed || isPending}
            className="w-full sm:w-auto gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span>Excluir Equipe</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
