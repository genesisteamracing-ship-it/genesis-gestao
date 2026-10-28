import { requireAuthUser } from "@/services/auth-service";
import { resolveActiveTeam } from "@/services/financial-service";
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
  const user = await requireAuthUser();
  const { activeTeam } = await resolveActiveTeam(user);

  const [metrics, stakeholders, matrixItems, logs, sponsors] = await Promise.all([
    getCommunicationMetrics(activeTeam.id),
    getStakeholders(activeTeam.id),
    getStakeholderMatrix(activeTeam.id),
    getCommunicationLogs(activeTeam.id),
    prisma.sponsor.findMany({
      where: { teamId: activeTeam.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <CommunicationView
      metrics={metrics}
      stakeholders={stakeholders}
      matrixItems={matrixItems}
      logs={logs}
      sponsors={sponsors}
    />
  );
}
