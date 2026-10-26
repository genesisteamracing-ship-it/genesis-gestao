"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

export function CreateTeamDialog() {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<CreateTeamInput>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: "",
      schoolOrOrg: "",
    },
  });

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
        <Button variant="outline" className="border-[#D5D5D5] font-semibold">
          <Flag className="h-4 w-4 text-[#4880FF]" />
          <span>+ Nova Equipe</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cadastrar Nova Equipe na Plataforma</DialogTitle>
          <DialogDescription>
            Crie uma nova equipe competidora (ex: Equipe Beta, Equipe Ômega). A
            plataforma criará automaticamente os 5 setores internos isolados para
            esta equipe.
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
                      placeholder="Ex: SESI / SENAI — Escuderia Beta"
                      {...field}
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
                <span>Criar Equipe + 5 Setores</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
