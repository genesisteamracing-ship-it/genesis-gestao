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

const TAB_HEADER_METADATA: Record<string, { title: string; subtitle: string }> = {
  mapa: {
    title: "Mapa Organizacional & Comunicação",
    subtitle:
      "Árvore hierárquica de parceiros e stakeholders por nível de Poder e Interesse, réguas ativas e relatórios automatizados",
  },
  relatorios: {
    title: "Gerador de Relatórios",
    subtitle:
      "Criação, exportação e envio de relatórios executivos, técnicos e combinados para stakeholders",
  },
  stakeholders: {
    title: "Diretório de Stakeholders",
    subtitle:
      "Gerenciamento completo de contatos, organizações parceiras, cargos e preferências de comunicação",
  },
  agendamentos: {
    title: "Agendamentos de Comunicação",
    subtitle:
      "Programação de envios, calendário de contatos e histórico consolidado de interações com parceiros",
  },
  matriz: {
    title: "Matriz Poder x Interesse",
    subtitle:
      "Mapeamento estratégico de engajamento para direcionar a comunicação e governança dos stakeholders",
  },
};

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

  const currentHeader = TAB_HEADER_METADATA[activeTab] ?? TAB_HEADER_METADATA.mapa;

  const handleTabChange = (newTab: string) => {
    router.push(`/comunicacao?tab=${newTab}`, { scroll: false });
  };

  const [isCreateStakeholderOpen, setIsCreateStakeholderOpen] = useState(false);
  const [stakeholderPrefill, setStakeholderPrefill] =
    useState<QuickAddStakeholderPrefill | null>(null);

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

  return (
    <DashboardShell
      title={currentHeader.title}
      subtitle={currentHeader.subtitle}
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
