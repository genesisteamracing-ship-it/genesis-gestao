import { Suspense } from "react";
import { getDashboardMetricsAction } from "@/actions/financial-actions";
import { getWbsTreeAction } from "@/actions/wbs.actions";
import { requireModuleAccess } from "@/services/auth-service";
import { WbsView } from "@/components/wbs/wbs-view";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  const [currentUser, dashboardMetrics, wbsResult] = await Promise.all([
    requireModuleAccess("documents"),
    getDashboardMetricsAction(),
    getWbsTreeAction(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center p-8 text-sm text-muted-foreground">
          Carregando módulo de documentos e WBS...
        </div>
      }
    >
      <WbsView
        currentUser={currentUser}
        dashboardMetrics={dashboardMetrics}
        initialWbsData={wbsResult.data}
      />
    </Suspense>
  );
}
