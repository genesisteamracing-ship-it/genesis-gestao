"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  resetMemberPasswordSchema,
  type ResetMemberPasswordInput,
} from "@/lib/validations/auth";
import { resetMemberPasswordAction } from "@/actions/auth-actions";
import type { TeamMemberDTO } from "@/types/auth";
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
import { PasswordInput } from "@/components/ui/password-input";

interface ResetMemberPasswordDialogProps {
  member: TeamMemberDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetMemberPasswordDialog({
  member,
  open,
  onOpenChange,
}: ResetMemberPasswordDialogProps) {
  const [isPending, startTransition] = React.useTransition();

  const form = useForm<ResetMemberPasswordInput>({
    resolver: zodResolver(resetMemberPasswordSchema),
    defaultValues: {
      userId: member.id,
      password: "",
      confirmPassword: "",
    },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({
        userId: member.id,
        password: "",
        confirmPassword: "",
      });
    }
  }, [open, member, form]);

  function onSubmit(values: ResetMemberPasswordInput) {
    startTransition(async () => {
      const result = await resetMemberPasswordAction(values);

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
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg">Redefinir Senha</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Defina uma nova credencial de acesso para {member.name} ({member.email})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Mínimo 8 caracteres..."
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Deve conter ao menos 8 caracteres, uma letra maiúscula, uma minúscula e um número.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar Nova Senha</FormLabel>
                  <FormControl>
                    <PasswordInput
                      placeholder="Repita a nova senha..."
                      autoComplete="new-password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-xl border border-warning/20 bg-warning/5 p-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-warning" />
                <span>Política de Segurança Ativa</span>
              </div>
              <p>
                Ao redefinir a senha, todas as sessões ativas do integrante serão revogadas imediatamente por segurança, forçando novo login.
              </p>
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
                <span>Salvar Nova Senha</span>
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
