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
  PlusCircle,
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
import { createTransactionAction } from "@/actions/financial-actions";
import { useDashboardMetrics } from "@/hooks/use-dashboard-metrics";
import { useInvalidateDashboard } from "@/hooks/use-invalidate-dashboard";
import { useSeasonMonths } from "@/providers/season-provider";
import type { AuthenticatedUserDTO } from "@/types/auth";
import type {
  BudgetResourceDTO,
  CategoryDTO,
  SponsorDTO,
} from "@/types/financial";
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

const transactionFormSchema = z.object({
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
  isBarterCounterpart: z.boolean(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface CreateTransactionDialogProps {
  categories: CategoryDTO[];
  budgetResources: BudgetResourceDTO[];
  sponsors?: SponsorDTO[];
  currentUser?: AuthenticatedUserDTO;
  triggerLabel?: string;
}

export function CreateTransactionDialog({
  categories,
  budgetResources,
  sponsors = [],
  currentUser,
  triggerLabel = "+ Lançar Transação (Realizado)",
}: CreateTransactionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const invalidateDashboard = useInvalidateDashboard();
  const { metrics } = useDashboardMetrics();
  const availableSponsors = sponsors.length > 0 ? sponsors : (metrics?.sponsors ?? []);

  const defaultGroup = currentUser?.deliveryGroup ?? "MANUFACTURING_CNC";

  const todayISO = React.useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  );

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      date: todayISO,
      type: "APPLICATION",
      deliveryGroup: defaultGroup,
      categoryId: "",
      budgetResourceId: "NONE",
      sponsorId: "NONE",
      description: "",
      trackingMethod: "NFE",
      documentRef: "",
      amountReais: "",
      isBarterCounterpart: false,
    },
  });

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

  React.useEffect(() => {
    const currentCategoryId = form.getValues("categoryId");
    const stillValid = filteredCategories.some((c) => c.id === currentCategoryId);
    if (!stillValid && filteredCategories.length > 0) {
      form.setValue("categoryId", filteredCategories[0].id);
    }
  }, [filteredCategories, form]);

  if (currentUser?.role === "AUDITOR") {
    return null;
  }

  function handleBudgetResourceChange(resourceId: string) {
    form.setValue("budgetResourceId", resourceId);
    if (resourceId !== "NONE") {
      const found = budgetResources.find((b) => b.id === resourceId);
      if (found) {
        form.setValue("deliveryGroup", found.deliveryGroup);
        form.setValue("categoryId", found.categoryId);
        if (found.acquisitionStrategy === "BARTER_PARTNERSHIP") {
          form.setValue("isBarterCounterpart", true);
          form.setValue("trackingMethod", "SPONSOR_CONTRACT");
        }
      }
    }
  }

  function onSubmit(values: TransactionFormValues) {
    const amountCents = parseReaisToCents(values.amountReais);

    startTransition(async () => {
      const result = await createTransactionAction({
        date: new Date(`${values.date}T12:00:00Z`),
        type: values.type,
        deliveryGroup: values.deliveryGroup,
        categoryId: values.categoryId,
        budgetResourceId:
          values.budgetResourceId === "NONE" ? null : values.budgetResourceId,
        sponsorId:
          values.sponsorId === "NONE" || !values.sponsorId ? null : values.sponsorId,
        description: values.description,
        trackingMethod: values.trackingMethod,
        documentRef: values.documentRef,
        amountCents,
        isBarterCounterpart: values.isBarterCounterpart,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      invalidateDashboard();
      form.reset({
        date: todayISO,
        type: "APPLICATION",
        deliveryGroup: defaultGroup,
        categoryId: filteredCategories[0]?.id ?? "",
        budgetResourceId: "NONE",
        sponsorId: "NONE",
        description: "",
        trackingMethod: "NFE",
        documentRef: "",
        amountReais: "",
        isBarterCounterpart: false,
      });
      setOpen(false);
    });
  }

  const previewCents = parseReaisToCents(watchedReais || "0");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-semibold">
          <PlusCircle className="h-4 w-4" />
          <span>{triggerLabel}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Lançar Transação</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Tabs
                      value={field.value}
                      onValueChange={(val) =>
                        field.onChange(val as "APPLICATION" | "ORIGIN")
                      }
                      className="w-full"
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger
                          value="APPLICATION"
                          className="gap-2 data-[state=active]:bg-destructive/10 data-[state=active]:text-destructive"
                        >
                          <ArrowDownCircle className="h-4 w-4 text-destructive" />
                          <span>Despesa (Aplicação)</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="ORIGIN"
                          className="gap-2 data-[state=active]:bg-success/10 data-[state=active]:text-success"
                        >
                          <ArrowUpCircle className="h-4 w-4 text-success" />
                          <span>Receita (Origem)</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="budgetResourceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vincular a Item do Orçamento (Opcional)</FormLabel>
                  <Select
                    onValueChange={handleBudgetResourceChange}
                    value={field.value ?? "NONE"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sem vínculo direto com item planejado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="NONE">
                        Sem vínculo direto (Lançamento avulso)
                      </SelectItem>
                      {budgetResources.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.code}: {b.resourceName} (
                          {formatCurrencyFromCents(b.plannedAmountCents)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                        {deliveryGroupValues.map((group) => (
                          <SelectItem key={group} value={group}>
                            {DELIVERY_GROUP_LABELS[group]}
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
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
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
                  <FormLabel>Descrição Auditável</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        watchedType === "APPLICATION"
                          ? "Ex: Aquisição de Rolamentos Cerâmicos ABEC-9"
                          : "Ex: 1ª Parcela Patrocínio Ouro - Empresa Parceira"
                      }
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Fato Gerador</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription
                      className={derivedMonthLabel ? undefined : "text-destructive"}
                    >
                      {derivedMonthLabel
                        ? `Mês do fluxo de caixa: ${derivedMonthLabel}`
                        : "Data fora da temporada da equipe"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amountReais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Realizado (R$)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 450,00"
                        inputMode="decimal"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {formatCurrencyFromCents(previewCents)}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="trackingMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Método Comprobatório</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o método" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {trackingMethodValues.map((method) => (
                        <SelectItem key={method} value={method}>
                          {TRACKING_METHOD_LABELS[method]}
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
                        + Gerenciar Empresas no ROI
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
                onClick={() => setOpen(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant={watchedType === "ORIGIN" ? "emerald" : "default"}
                disabled={isPending}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>
                  {watchedType === "ORIGIN"
                    ? "Registrar Receita (Origem)"
                    : "Registrar Despesa (Aplicação)"}
                </span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
