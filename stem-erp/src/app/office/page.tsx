import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OfficeView } from "@/components/office/office-view";
import { requireAuthUser } from "@/services/auth-service";
import {
  getSeasonMonthsFromTeam,
  resolveActiveTeam,
} from "@/services/financial-service";
import { getOfficeSnapshotService } from "@/services/office-service";

export const dynamic = "force-dynamic";

export default async function OfficePage() {
  const user = await requireAuthUser();
  const { activeTeam, availableTeams } = await resolveActiveTeam(user);
  const initialSnapshot = await getOfficeSnapshotService(
    user,
    activeTeam.id,
    activeTeam.name
  );

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
      title="Escritório Virtual"
      subtitle="Acompanhe em tempo real onde cada integrante está alocado e qual tarefa está executando."
    >
      <OfficeView initialSnapshot={initialSnapshot} />
    </DashboardShell>
  );
}
