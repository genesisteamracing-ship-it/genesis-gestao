import { Suspense } from "react";
import { CheckCircle2, ShieldCheck, Users, XCircle } from "lucide-react";
import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { getTeamManagementMetricsService, requireModuleAccess } from "@/services/auth-service";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PermissionsTable } from "@/components/permissions/permissions-table";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function PermissoesPage() {
  const [currentUser, dashboardMetrics, teamMetrics] = await Promise.all([
    requireModuleAccess("team"),
    getDashboardMetricsAction(),
    getTeamManagementMetricsService(),
  ]);

  const totalMembers = teamMetrics.members.length;
  const financeAccessCount = teamMetrics.members.filter((m) => m.permissions.finance).length;
  const roiAccessCount = teamMetrics.members.filter((m) => m.permissions.roi).length;
  const commAccessCount = teamMetrics.members.filter((m) => m.permissions.communication).length;
  const teamAccessCount = teamMetrics.members.filter((m) => m.permissions.team).length;

  return (
    <DashboardShell
      title="Permissões de Acesso"
      subtitle="Configure individualmente o acesso de cada usuário aos módulos do sistema com botões SIM e NÃO"
      currentUser={dashboardMetrics.currentUser}
      activeTeam={dashboardMetrics.activeTeam}
      availableTeams={dashboardMetrics.availableTeams}
      categories={dashboardMetrics.categories}
      budgetResources={dashboardMetrics.budgetResources}
      seasonMonths={dashboardMetrics.seasonMonths}
      headerAction={null}
    >
      {/* 4 Cards de Resumo de Acesso por Módulo */}
      <section className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Acesso ao Financeiro
                </p>
                <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {financeAccessCount} / {totalMembers}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-success/15 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Integrantes com permissão SIM
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Acesso ao ROI & Cotas
                </p>
                <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {roiAccessCount} / {totalMembers}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Integrantes com permissão SIM
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Acesso à Comunicação
                </p>
                <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  {commAccessCount} / {totalMembers}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-chart-4/15 text-chart-4">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Integrantes com permissão SIM
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 bg-card shadow-[0_6px_24px_-4px_rgba(16,24,40,0.04)]">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                  Acesso Administrativo
                </p>
                <p className="mt-2 text-xl sm:text-2xl font-bold tracking-tight text-warning truncate">
                  {teamAccessCount} / {totalMembers}
                </p>
              </div>
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-warning/15 text-warning">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Gestores com permissão SIM em Equipe
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Tabela de Matriz de Permissões */}
      <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Carregando permissões...</div>}>
        <PermissionsTable
          teams={teamMetrics.teams}
          members={teamMetrics.members}
          currentUserId={currentUser.id}
        />
      </Suspense>
    </DashboardShell>
  );
}
