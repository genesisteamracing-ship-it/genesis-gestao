"use client";

import { useState } from "react";
import { Sparkles, Grid3X3, MessageSquare, Users, History, Plus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { CommunicationKpis } from "./communication-kpis";
import { StakeholderMatrix } from "./stakeholder-matrix";
import { ReportGeneratorTab } from "./report-generator-tab";
import { StakeholdersListTab } from "./stakeholders-list-tab";
import { CommunicationLogsTab } from "./communication-logs-tab";
import { CreateStakeholderDialog } from "./create-stakeholder-dialog";
import { CreateCommunicationPlanDialog } from "./create-communication-plan-dialog";
import { LogCommunicationDialog } from "./log-communication-dialog";
import { AddFeedbackDialog } from "./add-feedback-dialog";
import type {
  CommunicationChannel,
  CommunicationLogSummary,
  CommunicationMetrics,
  StakeholderMatrixItem,
  StakeholderWithRelations,
} from "@/types/communication";

interface CommunicationViewProps {
  metrics: CommunicationMetrics;
  stakeholders: StakeholderWithRelations[];
  matrixItems: StakeholderMatrixItem[];
  logs: CommunicationLogSummary[];
  sponsors: Array<{ id: string; name: string }>;
}

export function CommunicationView({
  metrics,
  stakeholders,
  matrixItems,
  logs,
  sponsors,
}: CommunicationViewProps) {
  const [activeTab, setActiveTab] = useState<string>("matriz");

  // Modais
  const [isCreateStakeholderOpen, setIsCreateStakeholderOpen] = useState(false);
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
  const [selectedLogForFeedback, setSelectedLogForFeedback] = useState<{
    id: string;
    subject: string;
  } | null>(null);

  const [selectedStakeholderForReport, setSelectedStakeholderForReport] = useState<
    string | null
  >(null);

  const handleSelectStakeholderForReport = (stakeholderId: string) => {
    setSelectedStakeholderForReport(stakeholderId);
    setActiveTab("relatorios");
  };

  const handleOpenPlanDialog = (stakeholderId: string) => {
    setPlanStakeholderId(stakeholderId);
    setIsCreatePlanOpen(true);
  };

  const handleOpenLogWithPrefill = (prefill: {
    stakeholderId: string;
    subject: string;
    channel: CommunicationChannel;
    contentSummary: string;
    reportTypeIncluded: string;
  }) => {
    setLogPrefill(prefill);
    setIsLogDialogOpen(true);
  };

  const handleOpenFeedback = (logId: string, subject: string) => {
    setSelectedLogForFeedback({ id: logId, subject });
    setIsFeedbackDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl lg:text-[28px] font-bold tracking-tight text-foreground">
              Comunicação & Engajamento
            </h1>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="h-3 w-3" />
              Gestão STEM
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Estratégia de comunicação personalizada para stakeholders, matriz de engajamento, prestação de contas automatizada e melhoria contínua.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => setIsCreateStakeholderOpen(true)}
            className="text-xs w-full sm:w-auto"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Novo Stakeholder
          </Button>
        </div>
      </div>

      {/* KPIs Gerais */}
      <CommunicationKpis metrics={metrics} />

      {/* Abas do Módulo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1">
          <TabsTrigger
            value="matriz"
            className="flex items-center gap-1.5 py-2 text-xs sm:text-sm"
          >
            <Grid3X3 className="h-4 w-4" />
            Matriz & Estratégia
          </TabsTrigger>

          <TabsTrigger
            value="relatorios"
            className="flex items-center gap-1.5 py-2 text-xs sm:text-sm"
          >
            <MessageSquare className="h-4 w-4" />
            Gerador de Relatórios
          </TabsTrigger>

          <TabsTrigger
            value="stakeholders"
            className="flex items-center gap-1.5 py-2 text-xs sm:text-sm"
          >
            <Users className="h-4 w-4" />
            Stakeholders ({stakeholders.length})
          </TabsTrigger>

          <TabsTrigger
            value="historico"
            className="flex items-center gap-1.5 py-2 text-xs sm:text-sm"
          >
            <History className="h-4 w-4" />
            Histórico & Feedback ({logs.length})
          </TabsTrigger>
        </TabsList>

        {/* Aba 1: Matriz de Poder x Interesse & Gap */}
        <TabsContent value="matriz" className="space-y-4">
          <StakeholderMatrix
            items={matrixItems}
            onSelectStakeholder={handleSelectStakeholderForReport}
          />
        </TabsContent>

        {/* Aba 2: Gerador de Relatórios WhatsApp / E-mail */}
        <TabsContent value="relatorios" className="space-y-4">
          <ReportGeneratorTab
            stakeholders={stakeholders}
            onOpenLogDialog={handleOpenLogWithPrefill}
            initialStakeholderId={selectedStakeholderForReport}
          />
        </TabsContent>

        {/* Aba 3: Diretório de Stakeholders */}
        <TabsContent value="stakeholders" className="space-y-4">
          <StakeholdersListTab
            stakeholders={stakeholders}
            onOpenCreateDialog={() => setIsCreateStakeholderOpen(true)}
            onOpenPlanDialog={handleOpenPlanDialog}
            onSelectForReport={handleSelectStakeholderForReport}
          />
        </TabsContent>

        {/* Aba 4: Histórico de Disparos e Feedbacks */}
        <TabsContent value="historico" className="space-y-4">
          <CommunicationLogsTab
            logs={logs}
            onOpenLogDialog={() => {
              setLogPrefill(null);
              setIsLogDialogOpen(true);
            }}
            onOpenFeedbackDialog={handleOpenFeedback}
          />
        </TabsContent>
      </Tabs>

      {/* Diálogos */}
      <CreateStakeholderDialog
        open={isCreateStakeholderOpen}
        onOpenChange={setIsCreateStakeholderOpen}
        sponsors={sponsors}
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
    </div>
  );
}
