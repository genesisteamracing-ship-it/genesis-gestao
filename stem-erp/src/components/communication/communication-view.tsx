"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CommunicationKpis } from "./communication-kpis";
import { StakeholderOrgMap } from "./org-map/stakeholder-org-map";
import { StakeholderMatrix } from "./stakeholder-matrix";
import { ReportGeneratorTab } from "./report-generator-tab";
import { StakeholdersListTab } from "./stakeholders-list-tab";
import { CommunicationScheduleTab } from "./communication-schedule-tab";
import { CreateStakeholderDialog } from "./create-stakeholder-dialog";
import { CreateCommunicationPlanDialog } from "./create-communication-plan-dialog";
import { LogCommunicationDialog } from "./log-communication-dialog";
import { AddFeedbackDialog } from "./add-feedback-dialog";
import type { QuickAddStakeholderPrefill } from "@/hooks/use-stakeholder-org-map";
import type { DashboardMetricsDTO } from "@/types/financial";
import type {
  CommunicationChannel,
  CommunicationLogSummary,
  CommunicationMetrics,
  StakeholderMatrixItem,
  StakeholderWithRelations,
} from "@/types/communication";

interface CommunicationViewProps {
  dashboardMetrics: DashboardMetricsDTO;
  metrics: CommunicationMetrics;
  stakeholders: StakeholderWithRelations[];
  matrixItems: StakeholderMatrixItem[];
  logs: CommunicationLogSummary[];
  sponsors: Array<{ id: string; name: string }>;
}

export function CommunicationView({
  dashboardMetrics,
  metrics,
  stakeholders,
  matrixItems,
  sponsors,
}: CommunicationViewProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams ? searchParams.get("tab") : null;
  const activeTab = tabFromUrl === "historico" ? "agendamentos" : tabFromUrl || "mapa";

  const handleTabChange = (newTab: string) => {
    router.push(`/comunicacao?tab=${newTab}`, { scroll: false });
  };

  const [isCreateStakeholderOpen, setIsCreateStakeholderOpen] = useState(false);
  const [stakeholderPrefill, setStakeholderPrefill] =
    useState<QuickAddStakeholderPrefill | null>(null);

  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [planStakeholderId, setPlanStakeholderId] = useState<string | undefined>(undefined);

  const [isLogDialogOpen, setIsLogDialogOpen] = useState(false);
  const [logPrefill, setLogPrefill] = useState<{
    stakeholderId: string;
    subject: string;
    channel: CommunicationChannel;
    contentSummary: string;
    reportTypeIncluded: string;
  } | null>(null);

  const [isFeedbackDialogOpen, setIsFeedbackDialogOpen] = useState(false);
  const [selectedLogForFeedback] = useState<{
    id: string;
    subject: string;
  } | null>(null);

  const [selectedStakeholderForReport, setSelectedStakeholderForReport] = useState<
    string | null
  >(null);

  const handleOpenCreateStakeholder = (prefill?: QuickAddStakeholderPrefill) => {
    setStakeholderPrefill(prefill ?? null);
    setIsCreateStakeholderOpen(true);
  };

  const handleSelectStakeholderForReport = (stakeholderId: string) => {
    setSelectedStakeholderForReport(stakeholderId);
    handleTabChange("relatorios");
  };

  const handleOpenPlanDialog = (stakeholderId: string) => {
    setPlanStakeholderId(stakeholderId);
    setIsCreatePlanOpen(true);
  };

  return (
    <DashboardShell
      title="Mapa Organizacional & Comunicação"
      subtitle="Árvore hierárquica de parceiros e stakeholders por nível de Poder e Interesse, réguas ativas e relatórios automatizados"
      currentUser={dashboardMetrics.currentUser}
      activeTeam={dashboardMetrics.activeTeam}
      availableTeams={dashboardMetrics.availableTeams}
      categories={dashboardMetrics.categories}
      budgetResources={dashboardMetrics.budgetResources}
      seasonMonths={dashboardMetrics.seasonMonths}
      headerAction={
        <Button
          type="button"
          onClick={() => handleOpenCreateStakeholder()}
          className="w-full sm:w-auto gap-2 font-semibold"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Stakeholder</span>
        </Button>
      }
    >
      <CommunicationKpis metrics={metrics} />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-5">
        <TabsContent value="mapa" className="space-y-4">
          <StakeholderOrgMap
            teamName={dashboardMetrics.activeTeam.name}
            stakeholders={stakeholders}
            onOpenCreateStakeholder={handleOpenCreateStakeholder}
            onSelectStakeholderForReport={handleSelectStakeholderForReport}
            onOpenPlanDialog={handleOpenPlanDialog}
            onOpenLogForStakeholder={(st) => {
              setLogPrefill({
                stakeholderId: st.id,
                subject: `Alinhamento com ${st.name}`,
                channel: st.preferredChannel,
                contentSummary: "",
                reportTypeIncluded: "COMBINED",
              });
              setIsLogDialogOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <ReportGeneratorTab
            stakeholders={stakeholders}
            onOpenLogDialog={(prefill) => (setLogPrefill(prefill), setIsLogDialogOpen(true))}
            initialStakeholderId={selectedStakeholderForReport}
          />
        </TabsContent>

        <TabsContent value="stakeholders" className="space-y-4">
          <StakeholdersListTab
            stakeholders={stakeholders}
            sponsors={sponsors}
            onOpenCreateDialog={() => handleOpenCreateStakeholder()}
            onOpenPlanDialog={handleOpenPlanDialog}
            onSelectForReport={handleSelectStakeholderForReport}
          />
        </TabsContent>

        <TabsContent value="agendamentos" className="space-y-4">
          <CommunicationScheduleTab
            stakeholders={stakeholders}
            senderEmail={dashboardMetrics.activeTeam.senderEmail}
            onSelectStakeholderForReport={handleSelectStakeholderForReport}
          />
        </TabsContent>

        <TabsContent value="matriz" className="space-y-4">
          <StakeholderMatrix items={matrixItems} onSelectStakeholder={handleSelectStakeholderForReport} />
        </TabsContent>
      </Tabs>

      <CreateStakeholderDialog
        open={isCreateStakeholderOpen}
        onOpenChange={setIsCreateStakeholderOpen}
        sponsors={sponsors}
        existingStakeholders={stakeholders}
        prefill={stakeholderPrefill}
      />

      <CreateCommunicationPlanDialog
        open={isCreatePlanOpen}
        onOpenChange={setIsCreatePlanOpen}
        stakeholders={stakeholders}
        defaultStakeholderId={planStakeholderId}
      />

      <LogCommunicationDialog
        open={isLogDialogOpen}
        onOpenChange={setIsLogDialogOpen}
        stakeholders={stakeholders}
        prefillData={logPrefill}
      />

      {selectedLogForFeedback && (
        <AddFeedbackDialog
          open={isFeedbackDialogOpen}
          onOpenChange={setIsFeedbackDialogOpen}
          communicationLogId={selectedLogForFeedback.id}
          logSubject={selectedLogForFeedback.subject}
        />
      )}
    </DashboardShell>
  );
}
