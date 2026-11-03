import { getDashboardMetricsAction } from "@/actions/financial-actions";
import {
  getCommunicationLogs,
  getCommunicationMetrics,
  getStakeholderMatrix,
  getStakeholders,
} from "@/services/communication-service";
import { prisma } from "@/lib/prisma";
import { CommunicationView } from "@/components/communication/communication-view";

export const dynamic = "force-dynamic";

export default async function CommunicationPage() {
  const dashboardMetrics = await getDashboardMetricsAction();
  const teamId = dashboardMetrics.activeTeam.id;

  const [metrics, stakeholders, matrixItems, logs, sponsors] = await Promise.all([
    getCommunicationMetrics(teamId),
    getStakeholders(teamId),
    getStakeholderMatrix(teamId),
    getCommunicationLogs(teamId),
    prisma.sponsor.findMany({
      where: { teamId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CommunicationView
      dashboardMetrics={dashboardMetrics}
      metrics={metrics}
      stakeholders={stakeholders}
      matrixItems={matrixItems}
      logs={logs}
      sponsors={sponsors}
    />
  );
}
