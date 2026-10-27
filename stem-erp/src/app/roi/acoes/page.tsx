import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { ReturnActionsView } from "@/components/roi/return-actions-view";

export const dynamic = "force-dynamic";

export default async function ReturnActionsPage() {
  const initialMetrics = await getDashboardMetricsAction();

  return <ReturnActionsView initialMetrics={initialMetrics} />;
}
