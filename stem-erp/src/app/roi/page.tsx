import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { requireModuleAccess } from "@/services/auth-service";
import { RoiView } from "@/components/roi/roi-view";

export const dynamic = "force-dynamic";

export default async function RoiPage() {
  const [, initialMetrics] = await Promise.all([
    requireModuleAccess("roi"),
    getDashboardMetricsAction(),
  ]);

  return <RoiView initialMetrics={initialMetrics} />;
}
