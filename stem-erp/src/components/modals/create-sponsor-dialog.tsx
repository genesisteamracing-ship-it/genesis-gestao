"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { SPONSOR_TIER_LABELS } from "@/lib/constants";
import {
  createSponsorSchema,
  sponsorTierValues,
  type CreateSponsorInput,
} from "@/lib/validations/financial";
import { createSponsorAction } from "@/actions/financial-actions";
import { useInvalidateDashboard } from "@/hooks/use-invalidate-dashboard";
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

interface CreateSponsorDialogProps {
  triggerLabel?: string;
  variant?: "default" | "outline";
}

export function CreateSponsorDialog({
  triggerLabel = "+ Adicionar Empresa Patrocinadora",
  variant = "default",
}: CreateSponsorDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const invalidateDashboard = useInvalidateDashboard();

  const form = useForm<CreateSponsorInput>({
    resolver: zodResolver(createSponsorSchema),
    defaultValues: {
      name: "",
      tier: "SILVER",
      contactName: "",
      notes: "",
    },
  });

  function onSubmit(values: CreateSponsorInput) {
    startTransition(async () => {
      const result = await createSponsorAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      invalidateDashboard();
      form.reset({
        name: "",
        tier: "SILVER",
        contactName: "",
        notes: "",
      });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className="font-semibold gap-2">
          <Plus className="h-4 w-4" />
          <span>{triggerLabel}</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Building2 className="h-5 w-5" />
            <DialogTitle>Nova Empresa Patrocinadora</DialogTitle>
          </div>
          <DialogDescription>
            Cadastre a empresa parceira e defina a cota de patrocínio. Os
            lançamentos financeiros conectados a esta empresa formarão seu
            investimento real.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Empresa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Bosch, SENAI, Metalúrgica Alpha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cota de Patrocínio</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a cota" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sponsorTierValues.map((tier) => (
                        <SelectItem key={tier} value={tier}>
                          {SPONSOR_TIER_LABELS[tier]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-xs">
                    Classificação da parceria (Bronze, Prata, Ouro ou Diamante).
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato / Ponto Focal (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Carlos Mendes (Diretor de Marketing)"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contrapartidas & Observações (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Logo no bico do carro, 3 postagens no feed e estande conjunto"
                      className="resize-none"
                      rows={3}
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
                <span>Salvar Empresa</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
