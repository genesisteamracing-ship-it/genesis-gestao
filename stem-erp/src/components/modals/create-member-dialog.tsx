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

export function CreateMemberDialog() {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<CreateMemberInput>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "TEAM_LEAD",
      deliveryGroup: "MANUFACTURING_CNC",
      jobTitle: "",
    },
  });

  function onSubmit(values: CreateMemberInput) {
    startTransition(async () => {
      const result = await createTeamMemberAction(values);

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
        <Button className="font-semibold">
          <UserPlus className="h-4 w-4" />
          <span>+ Cadastrar Integrante</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Cadastrar Novo Integrante na Plataforma</DialogTitle>
          <DialogDescription>
            Atribua a equipe (Grupo de Entrega) e a função do integrante. Cada equipe
            visualizará estritamente os dados do seu próprio grupo.
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
                name="deliveryGroup"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipe (Escopo de Dados)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a equipe" />
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
                      O integrante verá apenas informações desta equipe.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissão na Plataforma</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a permissão" />
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
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo / Função na Equipe</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Engenheiro de Manufatura CNC"
                        {...field}
                      />
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
                        placeholder="Mín. 8 caracteres (Ex: Genesis@2026)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Deve conter maiúscula, minúscula e número.
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
                <span>Cadastrar Integrante</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
