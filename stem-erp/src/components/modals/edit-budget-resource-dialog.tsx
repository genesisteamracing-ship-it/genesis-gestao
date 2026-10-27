"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { updateBudgetResourceAction } from "@/actions/financial-actions";
import type { BudgetResourceDTO, CategoryDTO } from "@/types/financial";
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

interface EditBudgetResourceDialogProps {
  resource: BudgetResourceDTO;
  categories: CategoryDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBudgetResourceDialog({
  resource,
  categories,
  open,
  onOpenChange,
}: EditBudgetResourceDialogProps) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      deliveryGroup: resource.deliveryGroup,
      categoryId: resource.categoryId,
      resourceName: resource.resourceName,
      acquisitionStrategy: resource.acquisitionStrategy,
      allocatedTo: resource.allocatedTo,
      plannedMonth: resource.plannedMonth,
      utilizationForecast: resource.utilizationForecast,
      plannedAmountReais: (resource.plannedAmountCents / 100).toFixed(2),
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        deliveryGroup: resource.deliveryGroup,
        categoryId: resource.categoryId,
        resourceName: resource.resourceName,
        acquisitionStrategy: resource.acquisitionStrategy,
        allocatedTo: resource.allocatedTo,
        plannedMonth: resource.plannedMonth,
        utilizationForecast: resource.utilizationForecast,
        plannedAmountReais: (resource.plannedAmountCents / 100).toFixed(2),
      });
    }
  }, [open, resource, form]);

  const selectedDeliveryGroup = form.watch("deliveryGroup");
  const watchedReais = form.watch("plannedAmountReais");

  const filteredCategories = React.useMemo(() => {
    const matching = categories.filter(
      (cat) => cat.deliveryGroup === selectedDeliveryGroup
    );
    return matching.length > 0 ? matching : categories;
  }, [categories, selectedDeliveryGroup]);

  function onSubmit(values: BudgetFormValues) {
    const plannedAmountCents = parseReaisToCents(values.plannedAmountReais);

    startTransition(async () => {
      const result = await updateBudgetResourceAction({
        id: resource.id,
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
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Editar Recurso: {resource.code}</DialogTitle>
          <DialogDescription className="sr-only">
            Atualize as informações do item orçamentário
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="resourceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Recurso / Item</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Bloco de Poliuretano Oficial"
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
                    <FormLabel>Grupo / Setor de Entrega</FormLabel>
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
                    <FormLabel>Categoria Contábil</FormLabel>
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
                          <SelectValue placeholder="Selecione a estratégia" />
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
                    <FormLabel>Responsável Direto</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Mariana Santos (Líder CAD)"
                        {...field}
                      />
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
                    <FormLabel>Mês Previsto</FormLabel>
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

              <FormField
                control={form.control}
                name="utilizationForecast"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Uso Previsto (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={100} {...field} />
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
            </div>

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
