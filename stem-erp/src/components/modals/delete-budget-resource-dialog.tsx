"use client";

import * as React from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteBudgetResourceAction } from "@/actions/financial-actions";
import { formatCurrencyFromCents } from "@/lib/utils";
import type { BudgetResourceDTO } from "@/types/financial";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteBudgetResourceDialogProps {
  resource: BudgetResourceDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteBudgetResourceDialog({
  resource,
  open,
  onOpenChange,
}: DeleteBudgetResourceDialogProps) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteBudgetResourceAction({ id: resource.id });

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
                Excluir Recurso Orçamentário
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Remoção de item do plano orçamentário
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            Tem certeza que deseja excluir o recurso{" "}
            <strong className="text-foreground">
              {resource.code} - {resource.resourceName}
            </strong>{" "}
            no valor de{" "}
            <strong className="text-foreground">
              {formatCurrencyFromCents(resource.plannedAmountCents)}
            </strong>
            ?
          </p>
          <p className="rounded-xl border border-border bg-muted/40 p-2.5 text-[11px]">
            <strong>Nota:</strong> Caso existam lançamentos no livro caixa vinculados
            a este item, eles permanecerão registrados, porém com o vínculo desfeito.
          </p>
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
                <span>Excluir Recurso</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
