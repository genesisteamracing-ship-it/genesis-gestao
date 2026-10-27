"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Loader2,
  PlusCircle,
} from "lucide-react";
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
import { createTransactionAction } from "@/actions/financial-actions";
import type { AuthenticatedUserDTO } from "@/types/auth";
import type { BudgetResourceDTO, CategoryDTO } from "@/types/financial";
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
  isBarterCounterpart: z.boolean(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface CreateTransactionDialogProps {
  categories: CategoryDTO[];
  budgetResources: BudgetResourceDTO[];
  currentUser?: AuthenticatedUserDTO;
  triggerLabel?: string;
}

export function CreateTransactionDialog({
  categories,
  budgetResources,
  currentUser,
  triggerLabel = "+ Lançar Transação (Realizado)",
}: CreateTransactionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const defaultGroup = currentUser?.deliveryGroup ?? "MANUFACTURING_CNC";

  const todayISO = React.useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  );

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      date: todayISO,
      referenceMonth: 1,
      type: "APPLICATION",
      deliveryGroup: defaultGroup,
      categoryId: "",
      budgetResourceId: "NONE",
      description: "",
      trackingMethod: "NFE",
      documentRef: "",
      amountReais: "",
      isBarterCounterpart: false,
    },
  });

  const watchedType = form.watch("type");
  const watchedDeliveryGroup = form.watch("deliveryGroup");
  const watchedReais = form.watch("amountReais");

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
        form.setValue("referenceMonth", found.plannedMonth);
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
        referenceMonth: values.referenceMonth,
        type: values.type,
        deliveryGroup: values.deliveryGroup,
        categoryId: values.categoryId,
        budgetResourceId:
          values.budgetResourceId === "NONE" ? null : values.budgetResourceId,
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
      form.reset({
        date: todayISO,
        referenceMonth: 1,
        type: "APPLICATION",
        deliveryGroup: defaultGroup,
        categoryId: filteredCategories[0]?.id ?? "",
        budgetResourceId: "NONE",
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data do Fato Gerador</FormLabel>
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
                    <FormLabel>Mês de Referência (1-6)</FormLabel>
                    <Select
                      onValueChange={(v) => field.onChange(Number(v))}
                      value={String(field.value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Mês" />
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <FormField
                control={form.control}
                name="documentRef"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Documento / Comprovante</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: NFe-004921, PIX-E8910, CONT-01"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
