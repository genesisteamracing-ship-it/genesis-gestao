"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Building2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  DELIVERY_GROUP_LABELS,
  SPONSOR_TIER_LABELS,
  TRACKING_METHOD_LABELS,
} from "@/lib/constants";
import {
  deliveryGroupValues,
  trackingMethodValues,
  transactionTypeValues,
} from "@/lib/validations/financial";
import { formatCurrencyFromCents, parseReaisToCents } from "@/lib/utils";
import { updateTransactionAction } from "@/actions/financial-actions";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { useInvalidateDashboard } from "@/hooks/use-invalidate-dashboard";
import { useSeasonMonths } from "@/providers/season-provider";
import type {
  BudgetResourceDTO,
  CategoryDTO,
  SponsorDTO,
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
  type: z.enum(transactionTypeValues),
  deliveryGroup: z.enum(deliveryGroupValues),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  budgetResourceId: z.string().optional(),
  sponsorId: z.string().optional().nullable(),
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
  sponsors?: SponsorDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTransactionDialog({
  transaction,
  categories,
  budgetResources,
  sponsors = [],
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const [isPending, startTransition] = React.useTransition();
  const invalidateDashboard = useInvalidateDashboard();
  const { metrics } = useDashboardMetrics();
  const availableSponsors = sponsors.length > 0 ? sponsors : (metrics?.sponsors ?? []);

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
      type: transaction.type,
      deliveryGroup: transaction.deliveryGroup,
      categoryId: transaction.categoryId,
      budgetResourceId: transaction.budgetResourceId ?? "NONE",
      sponsorId: transaction.sponsorId ?? "NONE",
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
        type: transaction.type,
        deliveryGroup: transaction.deliveryGroup,
        categoryId: transaction.categoryId,
        budgetResourceId: transaction.budgetResourceId ?? "NONE",
        sponsorId: transaction.sponsorId ?? "NONE",
        description: transaction.description,
        trackingMethod: transaction.trackingMethod,
        documentRef: transaction.documentRef ?? "",
        amountReais: (transaction.amountCents / 100).toFixed(2),
      });
    }
  }, [open, transaction, form]);

  const seasonMonths = useSeasonMonths();
  const watchedDate = form.watch("date");
  const derivedMonthLabel = React.useMemo(
    () => seasonMonths.find((m) => m.key === watchedDate?.slice(0, 7))?.label ?? null,
    [seasonMonths, watchedDate]
  );
  const watchedType = form.watch("type");
  const watchedDeliveryGroup = form.watch("deliveryGroup");
  const watchedReais = form.watch("amountReais");
  const watchedTrackingMethod = form.watch("trackingMethod");
  const watchedBudgetResourceId = form.watch("budgetResourceId");

  const selectedResource = React.useMemo(
    () => budgetResources.find((b) => b.id === watchedBudgetResourceId),
    [budgetResources, watchedBudgetResourceId]
  );

  const isSponsorRelated =
    watchedTrackingMethod === "SPONSOR_CONTRACT" ||
    watchedDeliveryGroup === "MARKETING_SPONSOR" ||
    selectedResource?.acquisitionStrategy === "FINANCIAL_SPONSOR" ||
    selectedResource?.acquisitionStrategy === "BARTER_PARTNERSHIP";

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
        type: values.type,
        deliveryGroup: values.deliveryGroup,
        categoryId: values.categoryId,
        budgetResourceId:
          values.budgetResourceId && values.budgetResourceId !== "NONE"
            ? values.budgetResourceId
            : null,
        sponsorId:
          values.sponsorId && values.sponsorId !== "NONE"
            ? values.sponsorId
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <FormDescription
                      className={derivedMonthLabel ? "text-xs" : "text-xs text-destructive"}
                    >
                      {derivedMonthLabel
                        ? `Mês do fluxo de caixa: ${derivedMonthLabel}`
                        : "Data fora da temporada da equipe"}
                    </FormDescription>
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

            {isSponsorRelated && (
              <FormField
                control={form.control}
                name="sponsorId"
                render={({ field }) => (
                  <FormItem className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-primary" />
                        <span>
                          Empresa Patrocinadora{" "}
                          {watchedTrackingMethod === "SPONSOR_CONTRACT" && (
                            <span className="text-destructive">*</span>
                          )}
                        </span>
                      </FormLabel>
                      <Link
                        href="/roi"
                        target="_blank"
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        + Gerenciar no ROI
                      </Link>
                    </div>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value ?? "NONE"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-card">
                          <SelectValue placeholder="Selecione a empresa patrocinadora" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">
                          {watchedTrackingMethod === "SPONSOR_CONTRACT"
                            ? "Selecione uma empresa..."
                            : "Sem empresa vinculada (Lançamento comum)"}
                        </SelectItem>
                        {availableSponsors.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name} ({SPONSOR_TIER_LABELS[s.tier]})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-[11px] text-muted-foreground">
                      O valor deste lançamento alimentará automaticamente o investimento
                      da empresa para apuração do ROI e contrapartidas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

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
