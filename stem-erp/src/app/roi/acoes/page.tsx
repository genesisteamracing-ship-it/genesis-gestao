import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { requireModuleAccess } from "@/services/auth-service";
import { ReturnActionsView } from "@/components/roi/return-actions-view";

export const dynamic = "force-dynamic";

export default async function ReturnActionsPage() {
  const [, initialMetrics] = await Promise.all([
    requireModuleAccess("roi"),
    getDashboardMetricsAction(),
  ]);

  return <ReturnActionsView initialMetrics={initialMetrics} />;
}
