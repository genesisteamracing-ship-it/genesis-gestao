import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { RoiView } from "@/components/roi/roi-view";

export const dynamic = "force-dynamic";

export default async function RoiPage() {
  const initialMetrics = await getDashboardMetricsAction();

  return <RoiView initialMetrics={initialMetrics} />;
}
