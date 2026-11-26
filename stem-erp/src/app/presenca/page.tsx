import { DashboardShell } from "@/components/layout/dashboard-shell";
import { OfficeAttendanceTable } from "@/components/office/office-attendance-table";
import { requireModuleAccess } from "@/services/auth-service";
import {
  getSeasonMonthsFromTeam,
  resolveActiveTeam,
} from "@/services/financial-service";
import { getOfficeSnapshotService } from "@/services/office-service";

export const dynamic = "force-dynamic";

export default async function PresencaTreinosPage() {
  const user = await requireModuleAccess("team");
  const { activeTeam, availableTeams } = await resolveActiveTeam(user);
  const snapshot = await getOfficeSnapshotService(
    user,
    activeTeam.id,
    activeTeam.name
  );

  return (
    <DashboardShell
      title="Presença nos Treinos"
      subtitle="Acompanhe o registro diário de presença dos integrantes nos treinos da equipe."
      currentUser={user}
      activeTeam={activeTeam}
      availableTeams={availableTeams}
      categories={[]}
      budgetResources={[]}
      seasonMonths={
        activeTeam ? getSeasonMonthsFromTeam(activeTeam) : undefined
      }
    >
      <OfficeAttendanceTable
        attendances={snapshot.attendances ?? []}
        todayIso={snapshot.todayIso}
      />
    </DashboardShell>
  );
}
