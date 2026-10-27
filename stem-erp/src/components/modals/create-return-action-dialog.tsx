"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Megaphone, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  RETURN_ACTION_CATEGORY_LABELS,
  SPONSOR_TIER_LABELS,
} from "@/lib/constants";
import {
  returnActionCategoryValues,
} from "@/lib/validations/financial";
import { formatCurrencyFromCents, parseReaisToCents } from "@/lib/utils";
import { createReturnActionAction } from "@/actions/financial-actions";
import { useInvalidateDashboard } from "@/hooks/use-invalidate-dashboard";
import type { SponsorDTO } from "@/types/financial";
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
import { Textarea } from "@/components/ui/textarea";

const returnActionFormSchema = z.object({
  sponsorId: z.string().min(1, "Selecione a empresa patrocinadora"),
  date: z.string().min(1, "Informe a data da ação"),
  title: z
    .string()
    .trim()
    .min(3, "Informe ao menos 3 caracteres")
    .max(150, "Título muito longo"),
  category: z.enum(returnActionCategoryValues, {
    required_error: "Selecione a categoria da ação",
  }),
  reachCount: z.coerce.number().int().nonnegative().optional().nullable(),
  returnAmountReais: z
    .string()
    .min(1, "Informe o valor do retorno gerado")
    .refine((val) => parseReaisToCents(val) > 0, "O valor deve ser maior que zero"),
  description: z.string().trim().max(500).optional().nullable(),
});

type ReturnActionFormValues = z.infer<typeof returnActionFormSchema>;

interface CreateReturnActionDialogProps {
  sponsors: SponsorDTO[];
  triggerLabel?: string;
}

export function CreateReturnActionDialog({
  sponsors,
  triggerLabel = "+ Registrar Ação de Retorno",
}: CreateReturnActionDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const invalidateDashboard = useInvalidateDashboard();

  const todayISO = React.useMemo(
    () => new Date().toISOString().split("T")[0],
    []
  );

  const form = useForm<ReturnActionFormValues>({
    resolver: zodResolver(returnActionFormSchema),
    defaultValues: {
      sponsorId: sponsors[0]?.id ?? "",
      date: todayISO,
      title: "",
      category: "CAR_UNIFORM_BRANDING",
      reachCount: null,
      returnAmountReais: "",
      description: "",
    },
  });

  const watchedReais = form.watch("returnAmountReais");
  const previewCents = parseReaisToCents(watchedReais || "0");

  function onSubmit(values: ReturnActionFormValues) {
    const returnCents = parseReaisToCents(values.returnAmountReais);

    startTransition(async () => {
      const result = await createReturnActionAction({
        sponsorId: values.sponsorId,
        date: new Date(`${values.date}T12:00:00Z`),
        title: values.title,
        category: values.category,
        reachCount: values.reachCount ?? null,
        returnCents,
        description: values.description,
      });

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      invalidateDashboard();
      form.reset({
        sponsorId: sponsors[0]?.id ?? "",
        date: todayISO,
        title: "",
        category: "CAR_UNIFORM_BRANDING",
        reachCount: null,
        returnAmountReais: "",
        description: "",
      });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-semibold gap-2">
          <Plus className="h-4 w-4" />
          <span>{triggerLabel}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Megaphone className="h-5 w-5" />
            <DialogTitle>Registrar Ação de Retorno</DialogTitle>
          </div>
          <DialogDescription>
            Registre contrapartidas, exposições de marca e métricas geradas pela
            equipe para comprovar o valor entregue aos patrocinadores.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sponsorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa Patrocinadora Beneficiada</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a empresa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sponsors.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({SPONSOR_TIER_LABELS[s.tier]})
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título / Descrição da Ação</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Exposição de Logo no Bico do Carro + 3 Postagens no Instagram"
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Ativação / Ação</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {returnActionCategoryValues.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {RETURN_ACTION_CATEGORY_LABELS[cat]}
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
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Realização</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="returnAmountReais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor de Retorno Gerado (R$)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 1500,00"
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

              <FormField
                control={form.control}
                name="reachCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alcance / Público (Opcional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        placeholder="Ex: 8500"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : null
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>Visualizações ou público presente</FormDescription>
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
                  <FormLabel>Evidência / Detalhes (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Links de postagens, fotos do carro no evento, clipping de matérias..."
                      className="resize-none"
                      rows={2}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                <span>Registrar Retorno</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
