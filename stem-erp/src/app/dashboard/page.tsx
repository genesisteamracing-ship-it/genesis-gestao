import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { requireModuleAccess } from "@/services/auth-service";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [, initialMetrics] = await Promise.all([
    requireModuleAccess("finance"),
    getDashboardMetricsAction(),
  ]);

  return <DashboardView initialMetrics={initialMetrics} />;
}
