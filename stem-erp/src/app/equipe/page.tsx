import {
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getTeamManagementMetricsAction } from "@/actions/auth-actions";
import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CreateMemberDialog } from "@/components/modals/create-member-dialog";
import { TeamMembersDataTable } from "@/components/tables/team-members-data-table";
import { SecurityAuditTable } from "@/components/tables/security-audit-table";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const [financialMetrics, teamMetrics] = await Promise.all([
    getDashboardMetricsAction(),
    getTeamManagementMetricsAction(),
  ]);

  return (
    <DashboardShell
      title="Gestão de Equipe & Segurança (SuperAdmin)"
      subtitle="Cadastre integrantes, atribua a equipe (escopo isolado de dados) e monitore sessões httpOnly"
      currentUser={financialMetrics.currentUser}
      categories={financialMetrics.categories}
      budgetResources={financialMetrics.budgetResources}
      headerAction={<CreateMemberDialog />}
    >
      {/* 4 KPI Cards de Governança e Segurança no padrão DashStack */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-0 bg-white shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#202224]/70">
                  Total de Integrantes
                </p>
                <p className="mt-2.5 text-[28px] font-bold tracking-tight text-[#202224]">
                  {teamMetrics.stats.totalMembers}
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[#8280FF]/18 text-[#8280FF]">
                <Users className="h-7 w-7" />
              </div>
            </div>
            <p className="mt-5 text-sm text-[#606060]">
              Distribuídos nos 5 Grupos de Entrega
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-white shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#202224]/70">
                  Contas Ativas & Liberadas
                </p>
                <p className="mt-2.5 text-[28px] font-bold tracking-tight text-[#00B69B]">
                  {teamMetrics.stats.activeMembers}
                </p>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-[#4AD991]/20 text-[#00B69B]">
                <ShieldCheck className="h-7 w-7" />
              </div>
            </div>
            <p className="mt-5 text-sm text-[#606060]">
              Com isolamento de dados por equipe
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

      {/* Tabela de Integrantes estilo tabela.png */}
      <TeamMembersDataTable members={teamMetrics.members} />

      {/* Trilha de Auditoria de Segurança */}
      <SecurityAuditTable logs={teamMetrics.auditLogs} />
    </DashboardShell>
  );
}
