"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { loginAction } from "@/actions/auth-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const DEMO_ACCOUNTS = [
  {
    label: "SuperAdmin (Gerencia Equipes em /equipe)",
    email: "superadmin@genesisracing.com",
    team: "Acesso Global",
    badge: "default" as const,
  },
  {
    label: "Carlos Eduardo (Finanças & Gestão)",
    email: "carlos@alpharacing.com",
    team: "Equipe Alpha",
    badge: "magenta" as const,
  },
  {
    label: "Marina Santos (Engenharia & CAD)",
    email: "marina@alpharacing.com",
    team: "Equipe Alpha",
    badge: "magenta" as const,
  },
] as const;

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [errorBanner, setErrorBanner] = React.useState<string | null>(null);

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

  function fillDemoCredentials(email: string) {
    form.setValue("email", email);
    form.setValue("password", "Genesis@2026");
    setErrorBanner(null);
  }

  return (
    <div className="w-full max-w-[460px] space-y-5">
      <Card className="rounded-2xl border-0 bg-card shadow-[0_12px_40px_-8px_rgba(16,24,40,0.08)]">
        <CardHeader className="space-y-3 p-8 pb-4 text-center">
          <div className="mx-auto flex items-center justify-center gap-1 text-2xl font-extrabold tracking-tight">
            <span className="text-primary">Genesis</span>
            <span className="text-foreground">Gestão</span>
          </div>

          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-foreground">
              Acesso Seguro à Plataforma
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Informe seu e-mail corporativo e senha para acessar os dados e setores
              da sua equipe.
            </CardDescription>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <Badge variant="success" className="gap-1.5 px-3 py-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Cookie httpOnly + Anti-Brute Force Ativo</span>
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 p-8 pt-4">
          {errorBanner && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs font-medium text-destructive"
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
                    <FormLabel>E-mail do Integrante</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="nome@genesisracing.com"
                          className="h-11 rounded-xl border-input bg-muted/40 pl-10 focus:bg-card"
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
                    <FormLabel>Senha de Acesso</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="••••••••••••"
                          className="h-11 rounded-xl border-input bg-muted/40 pl-10 focus:bg-card"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isPending}
                className="h-11 w-full rounded-xl text-sm font-bold shadow-md"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4" />
                )}
                <span>Entrar com Sessão Protegida</span>
              </Button>
            </form>
          </Form>

          {/* Painel de Contas Seed */}
          <div className="space-y-2.5 border-t border-border pt-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" />
                Testar Equipe Gênesis vs Equipe Alpha
              </span>
              <span className="font-mono text-[11px] text-muted-foreground/80">
                Senha: Genesis@2026
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemoCredentials(acc.email)}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-left text-xs transition-colors hover:border-primary hover:bg-primary/5 cursor-pointer"
                >
                  <div>
                    <div className="font-bold text-foreground">{acc.label}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {acc.email}
                    </div>
                  </div>
                  <Badge variant={acc.badge} className="text-[10px] px-2 py-0.5">
                    {acc.team}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
