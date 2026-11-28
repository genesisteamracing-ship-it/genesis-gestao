import { TrainingAttendanceView } from "@/components/attendance/training-attendance-view";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireTrainingAttendanceAccess } from "@/services/auth-service";
import {
  getSeasonMonthsFromTeam,
  resolveActiveTeam,
} from "@/services/financial-service";
import { getOfficeSnapshotService } from "@/services/office-service";

export const dynamic = "force-dynamic";

export default async function PresencaTreinosPage() {
  const user = await requireTrainingAttendanceAccess();
  const { activeTeam, availableTeams } = await resolveActiveTeam(user);
  const snapshot = await getOfficeSnapshotService(
    user,
    activeTeam.id,
    activeTeam.name
  );

  return (
    <DashboardShell
      title="Presença nos Treinos"
      subtitle="Acompanhe presenças, faltas automáticas, dashboards de frequência e relatórios individuais nos treinos da equipe."
      currentUser={user}
      activeTeam={activeTeam}
      availableTeams={availableTeams}
      categories={[]}
      budgetResources={[]}
      seasonMonths={
        activeTeam ? getSeasonMonthsFromTeam(activeTeam) : undefined
      }
    >
      <TrainingAttendanceView
        members={snapshot.members}
        attendances={snapshot.attendances ?? []}
        todayIso={snapshot.todayIso}
        teamName={activeTeam.name}
        seasonLabel={activeTeam.season?.label}
      />
    </DashboardShell>
  );
}
