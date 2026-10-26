"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  ACQUISITION_STRATEGY_LABELS,
  DELIVERY_GROUP_LABELS,
  PROJECT_MONTHS,
  PROJECT_MONTH_LABELS,
} from "@/lib/constants";
import {
  acquisitionStrategyValues,
  deliveryGroupValues,
} from "@/lib/validations/financial";
import { formatCurrencyFromCents, parseReaisToCents } from "@/lib/utils";
import { createBudgetResourceAction } from "@/actions/financial-actions";
import type { AuthenticatedUserDTO } from "@/types/auth";
import type { CategoryDTO } from "@/types/financial";
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

const budgetFormSchema = z.object({
  deliveryGroup: z.enum(deliveryGroupValues, {
    required_error: "Selecione um setor / grupo de entrega",
  }),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  resourceName: z.string().min(3, "Informe ao menos 3 caracteres"),
  acquisitionStrategy: z.enum(acquisitionStrategyValues, {
    required_error: "Selecione uma estratégia de aquisição",
  }),
  allocatedTo: z.string().min(2, "Informe o responsável pela alocação"),
  plannedMonth: z.coerce.number().int().min(1).max(6),
  utilizationForecast: z.coerce.number().int().min(1).max(100),
  plannedAmountReais: z
    .string()
    .min(1, "Informe o valor previsto")
    .refine((val) => parseReaisToCents(val) >= 0, "Valor inválido"),
});

type BudgetFormValues = z.infer<typeof budgetFormSchema>;

interface CreateBudgetResourceDialogProps {
  categories: CategoryDTO[];
  currentUser?: AuthenticatedUserDTO;
  triggerLabel?: string;
}

export function CreateBudgetResourceDialog({
  categories,
  currentUser,
  triggerLabel = "+ Planejar Recurso (Orçamento)",
}: CreateBudgetResourceDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const defaultGroup = currentUser?.deliveryGroup ?? "MANUFACTURING_CNC";

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      deliveryGroup: defaultGroup,
      categoryId: "",
      resourceName: "",
      acquisitionStrategy: "DIRECT_PURCHASE",
      allocatedTo: currentUser?.name ?? "",
      plannedMonth: 1,
      utilizationForecast: 100,
      plannedAmountReais: "",
    },
  });

  const selectedDeliveryGroup = form.watch("deliveryGroup");
  const watchedReais = form.watch("plannedAmountReais");

  const filteredCategories = React.useMemo(() => {
    const matching = categories.filter(
      (cat) => cat.deliveryGroup === selectedDeliveryGroup
    );
    return matching.length > 0 ? matching : categories;
  }, [categories, selectedDeliveryGroup]);

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

  function onSubmit(values: BudgetFormValues) {
    const plannedAmountCents = parseReaisToCents(values.plannedAmountReais);

    startTransition(async () => {
      const result = await createBudgetResourceAction({
        deliveryGroup: values.deliveryGroup,
        categoryId: values.categoryId,
        resourceName: values.resourceName,
        acquisitionStrategy: values.acquisitionStrategy,
        allocatedTo: values.allocatedTo,
        plannedMonth: values.plannedMonth,
        utilizationForecast: values.utilizationForecast,
        plannedAmountCents,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      form.reset({
        deliveryGroup: defaultGroup,
        categoryId: filteredCategories[0]?.id ?? "",
        resourceName: "",
        acquisitionStrategy: "DIRECT_PURCHASE",
        allocatedTo: currentUser?.name ?? "",
        plannedMonth: 1,
        utilizationForecast: 100,
        plannedAmountReais: "",
      });
      setOpen(false);
    });
  }

  const previewCents = parseReaisToCents(watchedReais || "0");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-[#D5D5D5] font-semibold">
          <CalendarPlus className="h-4 w-4 text-[#4880FF]" />
          <span>{triggerLabel}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Planejar Recurso</DialogTitle>
          <DialogDescription>
            Cadastre um recurso previsto nos setores da sua equipe. O código sequencial{" "}
            <span className="font-mono font-semibold text-slate-700">ORC-XXX</span> será
            gerado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <FormLabel>Categoria Orçamentária</FormLabel>
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
              name="resourceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especificação do Recurso</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Blocos de Poliuretano Oficial / Rolamentos Cerâmicos"
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
                name="acquisitionStrategy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estratégia de Aquisição</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Como será adquirido?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {acquisitionStrategyValues.map((strategy) => (
                          <SelectItem key={strategy} value={strategy}>
                            {ACQUISITION_STRATEGY_LABELS[strategy]}
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
                name="allocatedTo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável (Alocação)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Líder de Manufatura" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="plannedMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês Planejado (1 a 6)</FormLabel>
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
                name="utilizationForecast"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previsão de Uso (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        placeholder="100"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plannedAmountReais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Previsto (R$)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 1200,00"
                        inputMode="decimal"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {formatCurrencyFromCents(previewCents)} ({previewCents} centavos)
                    </FormDescription>
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
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Salvar no Planejamento</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
