"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { DELIVERY_GROUP_LABELS, USER_ROLE_LABELS } from "@/lib/constants";
import {
  createMemberSchema,
  userRoleValues,
  type CreateMemberInput,
} from "@/lib/validations/auth";
import { deliveryGroupValues } from "@/lib/validations/financial";
import { createTeamMemberAction } from "@/actions/auth-actions";
import type { TeamDTO } from "@/types/auth";
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

interface CreateMemberDialogProps {
  teams: TeamDTO[];
}

export function CreateMemberDialog({ teams }: CreateMemberDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const defaultTeamId = teams[0]?.id ?? "";

  const form = useForm<CreateMemberInput>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      teamId: defaultTeamId,
      role: "TEAM_LEAD",
      deliveryGroup: "MANUFACTURING_CNC",
      jobTitle: "",
    },
  });

  React.useEffect(() => {
    if (!form.getValues("teamId") && teams[0]?.id) {
      form.setValue("teamId", teams[0].id);
    }
  }, [teams, form]);

  function onSubmit(values: CreateMemberInput) {
    startTransition(async () => {
      const result = await createTeamMemberAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      form.reset({
        name: "",
        email: "",
        password: "",
        teamId: defaultTeamId,
        role: "TEAM_LEAD",
        deliveryGroup: "MANUFACTURING_CNC",
        jobTitle: "",
      });
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto font-semibold">
          <UserPlus className="h-4 w-4" />
          <span>+ Cadastrar Integrante</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Integrante na Plataforma</DialogTitle>
          <DialogDescription>
            Selecione a <strong>Equipe</strong> (ex: Equipe Gênesis, Equipe Alpha),
            o <strong>Setor Interno</strong> em que atua e sua permissão. Cada equipe
            visualizará exclusivamente seus próprios dados.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Rafael Oliveira" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail de Acesso</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="rafael@genesisracing.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipe (Isolamento Multi-Equipe)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a equipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      O integrante verá todos os setores desta equipe e nada de outras equipes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor Interno na Equipe</FormLabel>
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
                    <FormDescription>
                      Setor principal em que o integrante atua dentro da equipe.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissão (RBAC)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Permissão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {userRoleValues.map((role) => (
                          <SelectItem key={role} value={role}>
                            {USER_ROLE_LABELS[role]}
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
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo no Setor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Engenheiro CNC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha Inicial</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Ex: Genesis@2026"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-2 flex flex-col-reverse sm:flex-row gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>Cadastrar Integrante</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
