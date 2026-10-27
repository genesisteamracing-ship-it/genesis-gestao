"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Flag,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth-actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { F1TrackIllustration } from "@/components/auth/f1-track-illustration";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [errorBanner, setErrorBanner] = React.useState<string | null>(null);
  const [rememberMe, setRememberMe] = React.useState(true);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: LoginInput) {
    setErrorBanner(null);
    startTransition(async () => {
      const result = await loginAction(values);
      if (!result.success) {
        setErrorBanner(result.message);
        toast.error(result.message);
        return;
      }

      toast.success(result.message);
      router.push("/dashboard");
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-[1040px] overflow-hidden rounded-2xl sm:rounded-[32px] border border-border bg-card shadow-[0_20px_60px_-15px_rgba(0,0,0,0.07)] dark:shadow-none">
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Coluna da Esquerda (Branding + Pista de Asfalto com Carro F1) */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-muted/40 p-6 sm:p-8 lg:p-12 md:col-span-5 border-b md:border-b-0 md:border-r border-border/70">
          {/* Topo: Logo & Identidade */}
          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Flag className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-primary">
                Genesis<span className="text-foreground">Gestão</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-[27px] font-extrabold leading-snug tracking-tight text-foreground">
              Acelere a alta performance da sua equipe STEM!
            </h1>
          </div>

          {/* Ilustração da Pista de Asfalto vindo de cima para baixo com Carro de F1 em miniatura */}
          <div className="relative my-auto flex items-center justify-center pt-4">
            <F1TrackIllustration />
          </div>

          {/* Rodapé sutil da coluna visual */}
          <div className="relative z-10 pt-4 text-xs font-medium text-muted-foreground">
            Escuderia Gênesis • F1 in Schools STEM Racing
          </div>
        </div>

        {/* Coluna da Direita (Formulário de Acesso Limpo) */}
        <div className="flex flex-col justify-between p-6 sm:p-8 lg:p-12 md:col-span-7 bg-card">
          <div className="hidden md:block h-6" />

          {/* Bloco Central do Formulário */}
          <div className="my-auto mx-auto w-full max-w-[390px] space-y-6 py-4">
            <div className="space-y-1.5 text-left">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                Entrar na plataforma
              </h2>
              <p className="text-xs text-muted-foreground">
                Informe suas credenciais para gerenciar recursos e livro caixa.
              </p>
            </div>

            {errorBanner && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
              >
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{errorBanner}</span>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                          <Input
                            type="email"
                            autoComplete="email"
                            placeholder="E-mail de acesso"
                            className="h-12 rounded-xl border-border bg-muted/30 pl-10 text-sm focus:bg-card"
                            {...field}
                          />
                        </div>
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
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                          <Input
                            type="password"
                            autoComplete="current-password"
                            placeholder="Senha"
                            className="h-12 rounded-xl border-border bg-muted/30 pl-10 text-sm focus:bg-card"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Lembrar-me no padrão da imagem de referência */}
                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 rounded border-border text-primary focus:ring-ring cursor-pointer accent-success"
                    />
                    <span>Lembrar de mim</span>
                  </label>
                </div>

                {/* Botão de Submit com tokens semânticos */}
                <Button
                  type="submit"
                  disabled={isPending}
                  className="h-12 w-full rounded-xl bg-success hover:bg-success/90 text-success-foreground text-sm font-bold shadow-md shadow-success/20 transition-all cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  <span>Entrar na plataforma</span>
                </Button>
              </form>
            </Form>
          </div>

          {/* Rodapé da Coluna Direita */}
          <div className="text-center text-xs text-muted-foreground pt-4">
            <span>Dúvidas de acesso? </span>
            <span className="font-semibold text-primary">Contate o SuperAdmin da equipe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
