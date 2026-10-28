"use client";

import { useState } from "react";
import { Plus, MessageSquare, ExternalLink, CheckCircle2, AlertTriangle, Smile, Meh } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type {
  CommunicationFeedbackSummary,
  CommunicationLogSummary,
  FeedbackSentiment,
} from "@/types/communication";
import {
  COMMUNICATION_CHANNEL_LABELS,
  FEEDBACK_SENTIMENT_LABELS,
  STAKEHOLDER_GROUP_LABELS,
} from "@/lib/communication-constants";
import { updateFeedbackStatusAction } from "@/actions/communication-actions";

interface CommunicationLogsTabProps {
  logs: CommunicationLogSummary[];
  onOpenLogDialog: () => void;
  onOpenFeedbackDialog: (logId: string, subject: string) => void;
}

export function CommunicationLogsTab({
  logs,
  onOpenLogDialog,
  onOpenFeedbackDialog,
}: CommunicationLogsTabProps) {
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState<string | null>(null);

  const handleToggleAddressed = async (
    feedback: CommunicationFeedbackSummary,
    currentStatus: boolean
  ) => {
    setUpdatingFeedbackId(feedback.id);
    try {
      const res = await updateFeedbackStatusAction(feedback.id, !currentStatus);
      if (!res.success) {
        toast.error(res.message || "Erro ao atualizar.");
        return;
      }
      toast.success(res.message);
    } catch {
      toast.error("Erro inesperado ao atualizar status.");
    } finally {
      setUpdatingFeedbackId(null);
    }
  };

  const renderSentimentIcon = (sentiment: FeedbackSentiment) => {
    switch (sentiment) {
      case "POSITIVE":
        return <Smile className="h-3.5 w-3.5 text-emerald-600" />;
      case "CONSTRUCTIVE_CRITICISM":
        return <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />;
      case "NEUTRAL":
      default:
        return <Meh className="h-3.5 w-3.5 text-blue-600" />;
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="p-4 sm:p-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg">
              Histórico de Disparos & Ciclos de Feedback
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Trilha auditável de comunicações com evidências de melhoria contínua aplicada.
            </CardDescription>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={onOpenLogDialog}
            className="text-xs w-full sm:w-auto"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Registrar Disparo Avulso
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-2">
        {logs.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <MessageSquare className="h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">Nenhum registro de comunicação ainda.</p>
            <p className="text-xs">
              Gere relatórios no módulo ou registre os e-mails e contatos enviados para auditar sua régua.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => {
              const formattedDate = new Intl.DateTimeFormat("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }).format(new Date(log.sentAt));

              return (
                <div
                  key={log.id}
                  className="rounded-lg border border-border p-4 bg-muted/20 space-y-3"
                >
                  {/* Topo do Log */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/50 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base text-foreground">
                          {log.subject}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {COMMUNICATION_CHANNEL_LABELS[log.channel]}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Destinatário: <strong>{log.stakeholder?.name}</strong>{" "}
                        {log.stakeholder?.organization ? `(${log.stakeholder.organization})` : ""}{" "}
                        • {log.stakeholder ? STAKEHOLDER_GROUP_LABELS[log.stakeholder.group] : ""}
                      </span>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs text-muted-foreground block">{formattedDate}</span>
                      <span className="text-[11px] text-muted-foreground">
                        Por: <strong>{log.dispatchedByName}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Resumo do Conteúdo */}
                  <p className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                    {log.contentSummary}
                  </p>

                  {/* Links e Ações do Log */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      {log.evidenceLink && (
                        <a
                          href={log.evidenceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver Comprovante / Ata
                        </a>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenFeedbackDialog(log.id, log.subject)}
                      className="text-xs h-7"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Registrar Retorno / Feedback
                    </Button>
                  </div>

                  {/* Feedbacks Vinculados a este Disparo */}
                  {log.feedbacks && log.feedbacks.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border/60 space-y-2">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                        Ciclo de Feedback & Melhoria Contínua ({log.feedbacks.length})
                      </span>

                      <div className="grid grid-cols-1 gap-2">
                        {log.feedbacks.map((fb) => (
                          <div
                            key={fb.id}
                            className="p-2.5 rounded-md border border-border/70 bg-card text-xs space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-1.5 font-medium">
                                {renderSentimentIcon(fb.sentiment)}
                                <span>{FEEDBACK_SENTIMENT_LABELS[fb.sentiment]}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleToggleAddressed(fb, fb.isAddressed)}
                                disabled={updatingFeedbackId === fb.id}
                                className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                                  fb.isAddressed
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30"
                                }`}
                              >
                                {fb.isAddressed
                                  ? "✓ Melhoria Implementada"
                                  : "⏳ Pendente de Implementação"}
                              </button>
                            </div>

                            <p className="text-muted-foreground italic">
                              &quot;{fb.stakeholderResponse}&quot;
                            </p>

                            {fb.continuousImprovementAction && (
                              <div className="p-1.5 rounded bg-muted/40 border border-border/50 text-foreground">
                                <strong className="text-primary font-semibold">
                                  Ação de Melhoria da Equipe:{" "}
                                </strong>
                                {fb.continuousImprovementAction}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
