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
      title="Equipes, Integrantes & Segurança (SuperAdmin)"
      subtitle="Cadastre novas equipes (ex: Equipe Gênesis, Equipe Alpha), atribua integrantes a cada equipe e setor interno, e monitore sessões httpOnly"
      currentUser={financialMetrics.currentUser}
      activeTeam={financialMetrics.activeTeam}
      availableTeams={financialMetrics.availableTeams}
      categories={financialMetrics.categories}
      budgetResources={financialMetrics.budgetResources}
      headerAction={
        <div className="flex flex-wrap items-center gap-3">
          <CreateTeamDialog />
          <CreateMemberDialog teams={teamMetrics.teams} />
        </div>
      }
    >
      {/* 4 KPI Cards de Governança Multi-Equipe no padrão DashStack */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-0 bg-white shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#202224]/70">
                  Equipes Cadastradas
                </p>
                <p className="mt-2.5 text-[28px] font-bold tracking-tight text-[#202224]">
                  {teamMetrics.stats.totalTeams}
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[#8280FF]/18 text-[#8280FF]">
                <Flag className="h-7 w-7" />
              </div>
            </div>
            <p className="mt-5 text-sm text-[#606060]">
              Cada equipe isolada com 5 setores
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-white shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#202224]/70">
                  Integrantes Cadastrados
                </p>
                <p className="mt-2.5 text-[28px] font-bold tracking-tight text-[#00B69B]">
                  {teamMetrics.stats.totalMembers}
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[#4AD991]/20 text-[#00B69B]">
                <Users className="h-7 w-7" />
              </div>
            </div>
            <p className="mt-5 text-sm text-[#606060]">
              {teamMetrics.stats.activeMembers} contas ativas e liberadas
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-white shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#202224]/70">
                  Sessões httpOnly Ativas
                </p>
                <p className="mt-2.5 text-[28px] font-bold tracking-tight text-[#4880FF]">
                  {teamMetrics.stats.activeSessions}
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[#FEC53D]/22 text-[#E5A400]">
                <KeyRound className="h-7 w-7" />
              </div>
            </div>
            <p className="mt-5 text-sm text-[#606060]">
              Protegidas contra XSS e CSRF
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-white shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#202224]/70">
                  Tentativas de Invasão / Falhas
                </p>
                <p className="mt-2.5 text-[28px] font-bold tracking-tight text-[#EF3826]">
                  {teamMetrics.stats.blockedInvasionAttempts}
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[#FF9066]/20 text-[#FF9066]">
                <ShieldAlert className="h-7 w-7" />
              </div>
            </div>
            <p className="mt-5 text-sm text-[#606060]">
              Bloqueio automático após 5 falhas
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Painel das Equipes Competidoras (Isolamento Multi-Tenant) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#202224]">
              Equipes na Plataforma (Isolamento de Dados)
            </h2>
            <p className="text-xs text-[#606060]">
              Cada equipe vê somente seus próprios recursos, lançamentos e cronograma. Dentro da mesma equipe, todos os 5 setores se veem.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teamMetrics.teams.map((team) => (
            <Card
              key={team.id}
              className="rounded-2xl border border-[#D5D5D5]/70 bg-white shadow-[0_4px_16px_-4px_rgba(16,24,40,0.03)]"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#202224]">
                      {team.name}
                    </h3>
                    <p className="text-xs text-[#606060]">
                      {team.schoolOrOrg || "Escuderia STEM Racing"}
                    </p>
                  </div>
                  <Badge variant="success">Isolamento Ativo</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-xl bg-[#F5F6FA] p-3 text-center">
                  <div>
                    <div className="text-sm font-bold text-[#202224]">
                      {team.membersCount}
                    </div>
                    <div className="text-[11px] text-[#606060]">Integrantes</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#4880FF]">
                      {team.resourcesCount}
                    </div>
                    <div className="text-[11px] text-[#606060]">Recursos</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#00B69B]">
                      {team.transactionsCount}
                    </div>
                    <div className="text-[11px] text-[#606060]">Lançamentos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Tabela de Integrantes estilo tabela.png */}
      <TeamMembersDataTable
        teams={teamMetrics.teams}
        members={teamMetrics.members}
      />

      {/* Trilha de Auditoria de Segurança */}
      <SecurityAuditTable logs={teamMetrics.auditLogs} />
    </DashboardShell>
  );
}
