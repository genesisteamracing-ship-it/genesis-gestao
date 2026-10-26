"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Settings2 } from "lucide-react";
import { toast } from "sonner";
import { DELIVERY_GROUP_LABELS, USER_ROLE_LABELS } from "@/lib/constants";
import {
  updateMemberAccessSchema,
  userRoleValues,
  type UpdateMemberAccessInput,
} from "@/lib/validations/auth";
import { deliveryGroupValues } from "@/lib/validations/financial";
import { updateTeamMemberAccessAction } from "@/actions/auth-actions";
import type { TeamDTO, TeamMemberDTO } from "@/types/auth";
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

interface EditMemberDialogProps {
  member: TeamMemberDTO;
  teams: TeamDTO[];
}

export function EditMemberDialog({ member, teams }: EditMemberDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<UpdateMemberAccessInput>({
    resolver: zodResolver(updateMemberAccessSchema),
    defaultValues: {
      userId: member.id,
      teamId: member.teamId ?? teams[0]?.id ?? "",
      role: member.role,
      deliveryGroup: member.deliveryGroup ?? "PROJECT_MANAGEMENT",
      jobTitle: member.jobTitle ?? "Integrante",
      isActive: member.isActive,
    },
  });

  function onSubmit(values: UpdateMemberAccessInput) {
    startTransition(async () => {
      const result = await updateTeamMemberAccessAction(values);

      if (!result.success) {
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
          <Settings2 className="h-3.5 w-3.5 text-[#4880FF]" />
          <span>Editar Equipe/Setor</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Acesso: {member.name}</DialogTitle>
          <DialogDescription>
            Altere a <strong>Equipe</strong>, o <strong>Setor Interno</strong> ou a
            permissão de {member.email}. Sessões ativas serão revalidadas
            automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

            <FormField
              control={form.control}
              name="jobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo no Setor</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-xl border border-[#E8E8E8] bg-[#FAFBFD] p-3.5">
                  <div className="space-y-0.5">
                    <FormLabel className="cursor-pointer">
                      Conta Ativa para Login
                    </FormLabel>
                    <p className="text-xs text-[#606060]">
                      Desmarque para revogar o acesso do integrante imediatamente.
                    </p>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-[#4880FF] cursor-pointer"
                    />
                  </FormControl>
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
                <span>Salvar Alterações</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
