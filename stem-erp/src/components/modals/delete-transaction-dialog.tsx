"use client";

import * as React from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteTransactionAction } from "@/actions/financial-actions";
import { formatCurrencyFromCents, formatDateBR } from "@/lib/utils";
import type { TransactionDTO } from "@/types/financial";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteTransactionDialogProps {
  transaction: TransactionDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: DeleteTransactionDialogProps) {
  const [isPending, startTransition] = React.useTransition();

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteTransactionAction({ id: transaction.id });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      onOpenChange(false);
    });
  }

  const isOrigin = transaction.type === "ORIGIN";

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
                Excluir Lançamento
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Remoção de transação do livro caixa
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 text-xs text-muted-foreground leading-relaxed">
          <p>
            Tem certeza que deseja excluir o lançamento{" "}
            <strong className="text-foreground">
              "{transaction.description}"
            </strong>{" "}
            realizado em {formatDateBR(transaction.date)} no valor de{" "}
            <strong
              className={isOrigin ? "text-success font-bold" : "text-destructive font-bold"}
            >
              {isOrigin ? "+ " : "- "}
              {formatCurrencyFromCents(transaction.amountCents)}
            </strong>
            ?
          </p>
          <p className="rounded-xl border border-destructive/20 bg-destructive/5 p-2.5 text-[11px] text-destructive">
            Esta operação recalculá o saldo total do fluxo de caixa e os custos
            realizados dos recursos vinculados imediatamente.
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
                <span>Excluir Lançamento</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
