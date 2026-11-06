import Link from "next/link";
import {
  Flag,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
import { getTeamManagementMetricsAction } from "@/actions/auth-actions";
import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { requireModuleAccess } from "@/services/auth-service";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CreateMemberDialog } from "@/components/modals/create-member-dialog";
import { TeamMembersDataTable } from "@/components/tables/team-members-data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function IntegrantesPage() {
  const [, financialMetrics, teamMetrics] = await Promise.all([
    requireModuleAccess("team"),
    getDashboardMetricsAction(),
    getTeamManagementMetricsAction(),
  ]);

  return (
    <DashboardShell
      title="Integrantes"
      subtitle="Gestão de membros por equipe, redefinição de senhas, credenciais e governança de acessos"
      currentUser={financialMetrics.currentUser}
      activeTeam={financialMetrics.activeTeam}
      availableTeams={financialMetrics.availableTeams}
      categories={financialMetrics.categories}
      budgetResources={financialMetrics.budgetResources}
      seasonMonths={financialMetrics.seasonMonths}
      headerAction={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Link href="/equipe">
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2 text-xs sm:text-sm font-semibold border-border hover:bg-muted"
            >
              <Flag className="h-4 w-4 text-primary" />
              <span>Gerenciar Equipes</span>
            </Button>
          </Link>
          <Link href="/permissoes">
            <Button
              variant="outline"
              className="w-full sm:w-auto gap-2 text-xs sm:text-sm font-semibold border-border hover:bg-muted"
            >
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Matriz de Permissões</span>
            </Button>
          </Link>
          <CreateMemberDialog teams={teamMetrics.teams} />
        </div>
      }
    >
      {/* 4 KPI Cards de Integrantes e Segurança */}
      <section className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Total de Integrantes
                </p>
                <p className="mt-2 text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-foreground truncate">
                  {teamMetrics.stats.totalMembers}
                </p>
              </div>
              <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl sm:rounded-[22px] bg-chart-4/15 text-chart-4">
                <Users className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
            </div>
            <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-muted-foreground">
              Distribuídos em {teamMetrics.stats.totalTeams} equipe(s)
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Contas Ativas
                </p>
                <p className="mt-2 text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-success truncate">
                  {teamMetrics.stats.activeMembers}
                </p>
              </div>
              <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl sm:rounded-[22px] bg-chart-2/20 text-success">
                <UserCheck className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
            </div>
            <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-muted-foreground">
              Credenciais liberadas para acesso
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Sessões httpOnly Ativas
                </p>
                <p className="mt-2 text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-primary truncate">
                  {teamMetrics.stats.activeSessions}
                </p>
              </div>
              <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl sm:rounded-[22px] bg-warning/20 text-warning">
                <KeyRound className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
            </div>
            <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-muted-foreground">
              Protegidas contra XSS e CSRF
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Contas Bloqueadas / Falhas
                </p>
                <p className="mt-2 text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-destructive truncate">
                  {teamMetrics.stats.blockedInvasionAttempts}
                </p>
              </div>
              <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl sm:rounded-[22px] bg-peach/20 text-peach">
                <ShieldAlert className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
            </div>
            <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-muted-foreground">
              Bloqueio automático após 5 falhas
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Tabela de Integrantes com Gestão por Equipe e Menu de Engrenagem */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Quadro Geral de Integrantes por Equipe
          </h2>
        </div>

        <TeamMembersDataTable
          teams={teamMetrics.teams}
          members={teamMetrics.members}
        />
      </section>
    </DashboardShell>
  );
}
