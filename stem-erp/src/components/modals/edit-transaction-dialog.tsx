"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowDownCircle, ArrowUpCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DELIVERY_GROUP_LABELS,
  PROJECT_MONTHS,
  PROJECT_MONTH_LABELS,
  TRACKING_METHOD_LABELS,
} from "@/lib/constants";
import {
  deliveryGroupValues,
  trackingMethodValues,
  transactionTypeValues,
} from "@/lib/validations/financial";
import { formatCurrencyFromCents, parseReaisToCents } from "@/lib/utils";
import { updateTransactionAction } from "@/actions/financial-actions";
import { useInvalidateDashboard } from "@/hooks/use-invalidate-dashboard";
import type {
  BudgetResourceDTO,
  CategoryDTO,
  TransactionDTO,
} from "@/types/financial";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const editTransactionFormSchema = z.object({
  date: z.string().min(1, "Informe a data do fato gerador"),
  referenceMonth: z.coerce.number().int().min(1).max(6),
  type: z.enum(transactionTypeValues),
  deliveryGroup: z.enum(deliveryGroupValues),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  budgetResourceId: z.string().optional(),
  description: z.string().min(3, "Descreva a transação (mín. 3 caracteres)"),
  trackingMethod: z.enum(trackingMethodValues),
  documentRef: z.string().optional(),
  amountReais: z
    .string()
    .min(1, "Informe o valor")
    .refine((val) => parseReaisToCents(val) > 0, "O valor deve ser maior que zero"),
});

type EditTransactionFormValues = z.infer<typeof editTransactionFormSchema>;

interface EditTransactionDialogProps {
  transaction: TransactionDTO;
  categories: CategoryDTO[];
  budgetResources: BudgetResourceDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({
  transaction,
  categories,
  budgetResources,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const [isPending, startTransition] = React.useTransition();
  const invalidateDashboard = useInvalidateDashboard();

  function getISODate(d: Date | string) {
    try {
      return new Date(d).toISOString().split("T")[0];
    } catch {
      return new Date().toISOString().split("T")[0];
    }
  }

  const form = useForm<EditTransactionFormValues>({
    resolver: zodResolver(editTransactionFormSchema),
    defaultValues: {
      date: getISODate(transaction.date),
      referenceMonth: transaction.referenceMonth,
      type: transaction.type,
      deliveryGroup: transaction.deliveryGroup,
      categoryId: transaction.categoryId,
      budgetResourceId: transaction.budgetResourceId ?? "NONE",
      description: transaction.description,
      trackingMethod: transaction.trackingMethod,
      documentRef: transaction.documentRef ?? "",
      amountReais: (transaction.amountCents / 100).toFixed(2),
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        date: getISODate(transaction.date),
        referenceMonth: transaction.referenceMonth,
        type: transaction.type,
        deliveryGroup: transaction.deliveryGroup,
        categoryId: transaction.categoryId,
        budgetResourceId: transaction.budgetResourceId ?? "NONE",
        description: transaction.description,
        trackingMethod: transaction.trackingMethod,
        documentRef: transaction.documentRef ?? "",
        amountReais: (transaction.amountCents / 100).toFixed(2),
      });
    }
  }, [open, transaction, form]);

  const watchedType = form.watch("type");
  const watchedDeliveryGroup = form.watch("deliveryGroup");
  const watchedReais = form.watch("amountReais");

  const filteredCategories = React.useMemo(() => {
    const matching = categories.filter(
      (cat) => cat.deliveryGroup === watchedDeliveryGroup
    );
    return matching.length > 0 ? matching : categories;
  }, [categories, watchedDeliveryGroup]);

  function onSubmit(values: EditTransactionFormValues) {
    const amountCents = parseReaisToCents(values.amountReais);

    startTransition(async () => {
      const result = await updateTransactionAction({
        id: transaction.id,
        date: new Date(`${values.date}T12:00:00Z`),
        referenceMonth: values.referenceMonth,
        type: values.type,
        deliveryGroup: values.deliveryGroup,
        categoryId: values.categoryId,
        budgetResourceId:
          values.budgetResourceId && values.budgetResourceId !== "NONE"
            ? values.budgetResourceId
            : null,
        description: values.description,
        trackingMethod: values.trackingMethod,
        documentRef: values.documentRef || undefined,
        amountCents,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      invalidateDashboard();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Lançamento Financeiro</DialogTitle>
          <DialogDescription className="sr-only">
            Atualize os dados da transação registrada no livro caixa
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Natureza do Lançamento</FormLabel>
                  <FormControl>
                    <Tabs
                      value={field.value}
                      onValueChange={field.onChange}
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                          value="APPLICATION"
                          className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground text-xs font-semibold gap-1.5"
                        >
                          <ArrowDownCircle className="h-4 w-4" />
                          <span>Aplicação (Despesa / Saída)</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="ORIGIN"
                          className="data-[state=active]:bg-success data-[state=active]:text-success-foreground text-xs font-semibold gap-1.5"
                        >
                          <ArrowUpCircle className="h-4 w-4" />
                          <span>Origem (Receita / Entrada)</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="amountReais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Realizado (R$)</FormLabel>
                    <FormControl>
                      <Input placeholder="0,00" {...field} />
                    </FormControl>
                    <FormDescription className="text-xs">
                      {watchedReais
                        ? formatCurrencyFromCents(parseReaisToCents(watchedReais))
                        : "R$ 0,00"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Operação</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês de Referência</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(Number(val))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PROJECT_MONTHS.map((m) => (
                          <SelectItem key={m} value={String(m)}>
                            {PROJECT_MONTH_LABELS[m]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Detalhada do Fato Gerador</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Aquisição de filamento PLA para prototipagem rápida"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="deliveryGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor / Grupo de Entrega</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {deliveryGroupValues.map((g) => (
                          <SelectItem key={g} value={g}>
                            {DELIVERY_GROUP_LABELS[g]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria Contábil</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="budgetResourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vincular a Recurso Planejado (Opcional)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value ?? "NONE"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum vínculo (despesa/receita avulsa)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NONE">
                        Nenhum vínculo direto
                      </SelectItem>
                      {budgetResources.map((res) => (
                        <SelectItem key={res.id} value={res.id}>
                          {res.code} - {res.resourceName} (Previsto:{" "}
                          {formatCurrencyFromCents(res.plannedAmountCents)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trackingMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método de Rastreabilidade / Comprovação</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {trackingMethodValues.map((tm) => (
                        <SelectItem key={tm} value={tm}>
                          {TRACKING_METHOD_LABELS[tm]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Salvar Alterações</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
