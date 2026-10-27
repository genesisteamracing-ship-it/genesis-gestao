"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import {
  ACQUISITION_STRATEGY_LABELS,
  DELIVERY_GROUP_LABELS,
} from "@/lib/constants";
import {
  acquisitionStrategyValues,
  deliveryGroupValues,
} from "@/lib/validations/financial";
import { formatCurrencyFromCents, parseReaisToCents } from "@/lib/utils";
import {
  createCategoryAction,
  updateBudgetResourceAction,
} from "@/actions/financial-actions";
import { useInvalidateDashboard } from "@/hooks/use-invalidate-dashboard";
import { useSeasonMonths } from "@/providers/season-provider";
import type {
  BudgetResourceDTO,
  CategoryDTO,
  TeamMemberOptionDTO,
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

const NEW_CATEGORY_SENTINEL = "__NEW_CATEGORY__";

const budgetFormSchema = z.object({
  deliveryGroup: z.enum(deliveryGroupValues, {
    required_error: "Selecione um setor / grupo de entrega",
  }),
  categoryId: z.string().min(1, "Selecione uma categoria"),
  resourceName: z.string().min(3, "Informe ao menos 3 caracteres"),
  acquisitionStrategy: z.enum(acquisitionStrategyValues, {
    required_error: "Selecione uma estratégia de aquisição",
  }),
  allocatedTo: z.string().min(2, "Selecione o responsável pela alocação"),
  plannedMonth: z.coerce.number().int().min(1).max(24),
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
  teamMembers?: TeamMemberOptionDTO[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBudgetResourceDialog({
  resource,
  categories,
  teamMembers = [],
  open,
  onOpenChange,
}: EditBudgetResourceDialogProps) {
  const [isPending, startTransition] = React.useTransition();
  const invalidateDashboard = useInvalidateDashboard();
  const seasonMonths = useSeasonMonths();

  const [localCategories, setLocalCategories] =
    React.useState<CategoryDTO[]>(categories);
  const [isCreatingCategory, setIsCreatingCategory] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [isSavingCategory, startCategoryTransition] = React.useTransition();

  React.useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const memberOptions = React.useMemo(() => {
    const map = new Map<string, { name: string; label: string }>();
    for (const m of teamMembers) {
      map.set(m.name, {
        name: m.name,
        label: m.jobTitle ? `${m.name} (${m.jobTitle})` : m.name,
      });
    }
    if (resource.allocatedTo && !map.has(resource.allocatedTo)) {
      map.set(resource.allocatedTo, {
        name: resource.allocatedTo,
        label: resource.allocatedTo,
      });
    }
    return Array.from(map.values());
  }, [teamMembers, resource.allocatedTo]);

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
      setIsCreatingCategory(false);
      setNewCategoryName("");
    }
  }, [open, resource, form]);

  const selectedDeliveryGroup = form.watch("deliveryGroup");
  const watchedReais = form.watch("plannedAmountReais");

  const filteredCategories = React.useMemo(() => {
    const matching = localCategories.filter(
      (cat) => cat.deliveryGroup === selectedDeliveryGroup
    );
    return matching.length > 0 ? matching : localCategories;
  }, [localCategories, selectedDeliveryGroup]);

  function handleCreateCategory() {
    const trimmed = newCategoryName.trim();
    if (trimmed.length < 2) {
      toast.error("Informe um nome válido para a nova categoria.");
      return;
    }

    startCategoryTransition(async () => {
      const res = await createCategoryAction({
        name: trimmed,
        deliveryGroup: selectedDeliveryGroup,
      });

      if (!res.success || !res.data) {
        toast.error(res.message);
        return;
      }

      const createdCat = res.data;
      setLocalCategories((prev) => [...prev, createdCat]);
      form.setValue("categoryId", createdCat.id, { shouldValidate: true });
      setNewCategoryName("");
      setIsCreatingCategory(false);
      toast.success(res.message);
      invalidateDashboard();
    });
  }

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
      invalidateDashboard();
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
                    <div className="flex items-center justify-between">
                      <FormLabel>Categoria Orçamentária</FormLabel>
                      <button
                        type="button"
                        onClick={() => setIsCreatingCategory((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                      >
                        {isCreatingCategory ? (
                          <>
                            <X className="h-3 w-3" />
                            <span>Cancelar</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3 w-3" />
                            <span>Nova categoria</span>
                          </>
                        )}
                      </button>
                    </div>

                    {isCreatingCategory ? (
                      <div className="flex items-center gap-1.5">
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Nome da nova categoria..."
                          className="h-10 text-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleCreateCategory();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleCreateCategory}
                          disabled={
                            isSavingCategory ||
                            newCategoryName.trim().length < 2
                          }
                          className="h-10 px-3 shrink-0"
                        >
                          {isSavingCategory ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          <span>Criar</span>
                        </Button>
                      </div>
                    ) : (
                      <Select
                        onValueChange={(val) => {
                          if (val === NEW_CATEGORY_SENTINEL) {
                            setIsCreatingCategory(true);
                            return;
                          }
                          field.onChange(val);
                        }}
                        value={field.value}
                      >
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
                          <SelectItem
                            value={NEW_CATEGORY_SENTINEL}
                            className="font-semibold text-primary focus:text-primary"
                          >
                            + Cadastrar nova categoria...
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
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
                    <FormLabel>Responsável (Alocação)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o integrante da equipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {memberOptions.map((member) => (
                          <SelectItem key={member.name} value={member.name}>
                            {member.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <FormLabel>Mês Previsto (Temporada)</FormLabel>
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
                        {seasonMonths.map((m) => (
                          <SelectItem key={m.index} value={String(m.index)}>
                            {m.label} (Mês {m.index})
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

            <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
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
