import { getRiskModuleData } from "@/actions/risk-actions";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RisksView } from "@/components/risks/risks-view";
import { requireModuleAccess } from "@/services/auth-service";
import {
  getSeasonMonthsFromTeam,
  resolveActiveTeam,
} from "@/services/financial-service";

export const dynamic = "force-dynamic";

export default async function RiscosPage() {
  const user = await requireModuleAccess("risks");
  const { activeTeam, availableTeams } = await resolveActiveTeam(user);
  const season = activeTeam.season?.label ?? "2025/2026";
  const initialData = await getRiskModuleData(season);

  return (
    <DashboardShell
      currentUser={user}
      activeTeam={activeTeam}
      availableTeams={availableTeams}
      categories={[]}
      budgetResources={[]}
      seasonMonths={
        activeTeam ? getSeasonMonthsFromTeam(activeTeam) : undefined
      }
      title="Gestão de Riscos & Oportunidades"
      subtitle="Registro, análise cartesiana, planos proativos, contingência e revisões ao longo do projeto."
    >
      <RisksView
        season={season}
        initialItems={initialData.data?.items}
        initialMembers={initialData.data?.members}
        initialCanEdit={initialData.data?.canEdit ?? user.role !== "AUDITOR"}
      />
    </DashboardShell>
  );
}
