import { TasksView } from "@/components/tasks/tasks-view";
import { getTaskView } from "@/lib/task-navigation";
import { requireModuleAccess } from "@/services/auth-service";
import { getSeasonMonthsFromTeam, resolveActiveTeam } from "@/services/financial-service";
import { getTaskWorkspace, resolveTaskScope } from "@/services/task-service";

export const dynamic = "force-dynamic";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const { tab } = await searchParams;
  const view = getTaskView(Array.isArray(tab) ? tab[0] : tab);
  const user = await requireModuleAccess("tasks");
  const scope = await resolveTaskScope(user);
  const [workspace, teams] = await Promise.all([
    scope ? getTaskWorkspace(scope) : null,
    scope || user.role === "SUPER_ADMIN" ? resolveActiveTeam(user) : null,
  ]);
  const activeTeam = teams?.availableTeams.find((team) => team.id === scope?.teamId);
  return <TasksView key={scope?.teamId ?? "none"} viewId={view.id} workspace={workspace} shell={{
    currentUser: user, activeTeam, availableTeams: teams?.availableTeams,
    categories: [], budgetResources: [], seasonMonths: activeTeam ? getSeasonMonthsFromTeam(activeTeam) : undefined,
  }} />;
}
