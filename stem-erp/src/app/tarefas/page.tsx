import { TasksView } from "@/components/tasks/tasks-view";
import { requireModuleAccess } from "@/services/auth-service";
import { getSeasonMonthsFromTeam, resolveActiveTeam } from "@/services/financial-service";
import { getTaskWorkspace, resolveTaskScope } from "@/services/task-service";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const user = await requireModuleAccess("tasks");
  const scope = await resolveTaskScope(user);
  const [workspace, teams] = await Promise.all([
    scope ? getTaskWorkspace(scope) : null,
    scope || user.role === "SUPER_ADMIN" ? resolveActiveTeam(user) : null,
  ]);
  const activeTeam = teams?.availableTeams.find((team) => team.id === scope?.teamId);
  return <TasksView key={scope?.teamId ?? "none"} workspace={workspace} shell={{
    currentUser: user, activeTeam, availableTeams: teams?.availableTeams,
    categories: [], budgetResources: [], seasonMonths: activeTeam ? getSeasonMonthsFromTeam(activeTeam) : undefined,
  }} />;
}
