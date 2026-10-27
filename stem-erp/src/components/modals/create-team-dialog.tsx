"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarRange, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  buildSeasonMonths,
  buildSeasonOptions,
  countSeasonMonths,
  parseSeasonDate,
} from "@/lib/season";
import {
  createTeamSchema,
  type CreateTeamInput,
} from "@/lib/validations/auth";
import { createTeamAction } from "@/actions/auth-actions";
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

export function CreateTeamDialog() {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const seasonOptions = React.useMemo(() => buildSeasonOptions(), []);
  const defaultSeason = seasonOptions[1] ?? seasonOptions[0] ?? "2025/2026";
  const [startYear] = defaultSeason.split("/").map(Number);

  const form = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      schoolOrOrg: "",
      season: defaultSeason,
      seasonStartDate: `${startYear}-08-01`,
      seasonEndDate: `${startYear + 1}-07-31`,
    },
  });

  const watchedSeason = form.watch("season");
  const watchedStartDate = form.watch("seasonStartDate");
  const watchedEndDate = form.watch("seasonEndDate");

  // Ajusta automaticamente as datas padrão ao mudar a temporada, caso o usuário ainda não tenha customizado
  const handleSeasonChange = (nextSeason: string) => {
    form.setValue("season", nextSeason, { shouldValidate: true });
    const [y] = nextSeason.split("/").map(Number);
    if (Number.isFinite(y)) {
      form.setValue("seasonStartDate", `${y}-08-01`, { shouldValidate: true });
      form.setValue("seasonEndDate", `${y + 1}-07-31`, { shouldValidate: true });
    }
  };

  const seasonDurationMonths = React.useMemo(() => {
    const s = parseSeasonDate(watchedStartDate);
    const e = parseSeasonDate(watchedEndDate);
    if (!s || !e || e < s) return 0;
    return countSeasonMonths(s, e);
  }, [watchedStartDate, watchedEndDate]);

  function onSubmit(values: CreateTeamInput) {
    startTransition(async () => {
      const result = await createTeamAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      form.reset();
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-border font-semibold">
          <Flag className="h-4 w-4 text-primary" />
          <span>+ Nova Equipe</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Equipe na Plataforma</DialogTitle>
          <DialogDescription>
            Crie uma nova equipe competidora. Defina a temporada oficial e o
            período de vigência para geração automática do fluxo de caixa e
            cronograma.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Equipe</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Equipe Beta Racing" {...field} />
                  </FormControl>
                  <FormDescription>
                    Cada equipe possui orçamento, livro caixa e cronograma 100%
                    independentes das demais equipes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="schoolOrOrg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Escola / Instituição / Escuderia</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: SESI / SENAI, Escuderia Beta"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border border-border bg-card p-3.5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <CalendarRange className="h-4 w-4 text-primary" />
                <span>Configuração da Temporada & Ciclo de Caixa</span>
              </div>

              <FormField
                control={form.control}
                name="season"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporada Oficial</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={handleSeasonChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a temporada" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {seasonOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            Temporada {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="seasonStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seasonEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Fim</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="text-xs text-muted-foreground flex items-center justify-between pt-1 border-t border-border">
                <span>Duração calculada:</span>
                <span
                  className={
                    seasonDurationMonths > 0 && seasonDurationMonths <= 24
                      ? "font-semibold text-primary"
                      : "font-semibold text-destructive"
                  }
                >
                  {seasonDurationMonths > 0
                    ? `${seasonDurationMonths} ${seasonDurationMonths === 1 ? "mês" : "meses"} de fluxo de caixa`
                    : "Intervalo inválido"}
                </span>
              </div>
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
                <span>Criar Equipe + 5 Setores</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
