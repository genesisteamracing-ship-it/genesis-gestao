import {
  Flag,
  KeyRound,
  ShieldAlert,
  Users,
} from "lucide-react";
import { getTeamManagementMetricsAction } from "@/actions/auth-actions";
import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CreateTeamDialog } from "@/components/modals/create-team-dialog";
import { CreateMemberDialog } from "@/components/modals/create-member-dialog";
import { DeleteTeamDialog } from "@/components/modals/delete-team-dialog";
import { TeamMembersDataTable } from "@/components/tables/team-members-data-table";
import { SecurityAuditTable } from "@/components/tables/security-audit-table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const [financialMetrics, teamMetrics] = await Promise.all([
    getDashboardMetricsAction(),
    getTeamManagementMetricsAction(),
  ]);

  return (
    <DashboardShell
      title="Equipes & Integrantes"
      currentUser={financialMetrics.currentUser}
      activeTeam={financialMetrics.activeTeam}
      availableTeams={financialMetrics.availableTeams}
      categories={financialMetrics.categories}
      budgetResources={financialMetrics.budgetResources}
      seasonMonths={financialMetrics.seasonMonths}
      headerAction={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <CreateTeamDialog />
          <CreateMemberDialog teams={teamMetrics.teams} />
        </div>
      }
    >
      {/* 4 KPI Cards de Governança Multi-Equipe no padrão DashStack */}
      <section className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Equipes Cadastradas
                </p>
                <p className="mt-2 text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-foreground truncate">
                  {teamMetrics.stats.totalTeams}
                </p>
              </div>
              <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl sm:rounded-[22px] bg-chart-4/15 text-chart-4">
                <Flag className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
            </div>
            <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-muted-foreground">
              Cada equipe isolada com 5 setores
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Integrantes Cadastrados
                </p>
                <p className="mt-2 text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-success truncate">
                  {teamMetrics.stats.totalMembers}
                </p>
              </div>
              <div className="flex h-11 w-11 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl sm:rounded-[22px] bg-chart-2/20 text-success">
                <Users className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
            </div>
            <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-muted-foreground">
              {teamMetrics.stats.activeMembers} contas ativas e liberadas
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
                  Tentativas de Invasão / Falhas
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

      {/* Painel das Equipes Competidoras */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">
            Equipes Cadastradas
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teamMetrics.teams.map((team) => (
            <Card
              key={team.id}
              className="rounded-2xl border border-border bg-card shadow-[0_4px_16px_-4px_rgba(16,24,40,0.03)]"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {team.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {team.schoolOrOrg || "Escuderia STEM Racing"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="success">Isolamento Ativo</Badge>
                    {financialMetrics.currentUser.role === "SUPER_ADMIN" && (
                      <DeleteTeamDialog teamId={team.id} teamName={team.name} />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-3 text-center">
                  <div>
                    <div className="text-sm font-bold text-foreground">
                      {team.membersCount}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Integrantes</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-primary">
                      {team.resourcesCount}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Recursos</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-success">
                      {team.transactionsCount}
                    </div>
                    <div className="text-[11px] text-muted-foreground">Lançamentos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tabela de Integrantes */}
      <TeamMembersDataTable
        teams={teamMetrics.teams}
        members={teamMetrics.members}
      />

      {/* Trilha de Auditoria de Segurança */}
      <SecurityAuditTable logs={teamMetrics.auditLogs} />
    </DashboardShell>
  );
}
