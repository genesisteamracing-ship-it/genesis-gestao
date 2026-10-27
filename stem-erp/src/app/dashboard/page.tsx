import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const initialMetrics = await getDashboardMetricsAction();

  return <DashboardView initialMetrics={initialMetrics} />;
}
