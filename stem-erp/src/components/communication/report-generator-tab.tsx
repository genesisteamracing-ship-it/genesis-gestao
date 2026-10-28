"use client";

import { useState } from "react";
import { MessageSquare, Mail, Copy, Check, ExternalLink, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type {
  GeneratedCommunicationMessage,
  StakeholderGroup,
  StakeholderWithRelations,
} from "@/types/communication";
import { generateReportMessageAction } from "@/actions/communication-actions";
import { STAKEHOLDER_GROUP_LABELS } from "@/lib/communication-constants";

interface ReportGeneratorTabProps {
  stakeholders: StakeholderWithRelations[];
  onOpenLogDialog: (prefill: {
    stakeholderId: string;
    subject: string;
    channel: "WHATSAPP" | "EMAIL" | "MEETING" | "REPORT_PDF";
    contentSummary: string;
    reportTypeIncluded: string;
  }) => void;
  initialStakeholderId?: string | null;
}

export function ReportGeneratorTab({
  stakeholders,
  onOpenLogDialog,
  initialStakeholderId,
}: ReportGeneratorTabProps) {
  const [selectedStakeholderId, setSelectedStakeholderId] = useState<string>(
    initialStakeholderId || (stakeholders[0]?.id ?? "")
  );

  const selectedStakeholder = stakeholders.find((s) => s.id === selectedStakeholderId);

  const [recipientName, setRecipientName] = useState(selectedStakeholder?.name || "");
  const [recipientPhone, setRecipientPhone] = useState(selectedStakeholder?.phone || "");
  const [group, setGroup] = useState<StakeholderGroup>(
    selectedStakeholder?.group || "SPONSORS"
  );
  const [reportType, setReportType] = useState<"FINANCIAL" | "ROI" | "COMBINED">("COMBINED");
  const [customMessage, setCustomMessage] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] =
    useState<GeneratedCommunicationMessage | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleStakeholderChange = (id: string) => {
    setSelectedStakeholderId(id);
    const found = stakeholders.find((s) => s.id === id);
    if (found) {
      setRecipientName(found.name);
      setRecipientPhone(found.phone || "");
      setGroup(found.group);
      if (found.group === "SPONSORS") {
        setReportType("ROI");
      } else if (found.group === "SCHOOL_LEADERSHIP") {
        setReportType("FINANCIAL");
      } else {
        setReportType("COMBINED");
      }
    }
  };

  const handleGenerate = async () => {
    if (!recipientName.trim()) {
      toast.error("Informe o nome do destinatário.");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await generateReportMessageAction({
        recipientName,
        recipientPhone,
        group,
        reportType,
        customMessage,
      });

      if (!res.success || !res.data) {
        toast.error(res.message || "Falha ao gerar o relatório.");
        return;
      }

      setGeneratedResult(res.data);
      toast.success("Mensagem e relatório gerados com sucesso!");
    } catch {
      toast.error("Ocorreu um erro ao gerar o relatório.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.success("Copiado para a área de transferência!");
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  };

  const handleOpenWhatsApp = () => {
    if (!generatedResult) return;
    window.open(generatedResult.whatsappLink, "_blank", "noopener,noreferrer");
  };

  const handleLogDispatched = (channel: "WHATSAPP" | "EMAIL") => {
    if (!generatedResult || !selectedStakeholderId) {
      toast.error("Gere um relatório e selecione um stakeholder primeiro.");
      return;
    }

    onOpenLogDialog({
      stakeholderId: selectedStakeholderId,
      subject: generatedResult.subject,
      channel,
      contentSummary:
        channel === "WHATSAPP"
          ? generatedResult.whatsappText.slice(0, 180) + "..."
          : generatedResult.emailPlainText.slice(0, 180) + "...",
      reportTypeIncluded: reportType,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Painel Esquerdo: Configuração do Relatório e Destinatário */}
        <Card className="lg:col-span-5 border-border bg-card">
          <CardHeader className="p-4 sm:p-5">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Configurar Comunicação
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Selecione o destinatário e o tipo de prestação de contas que deseja emitir com dados em tempo real.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
            {/* Seleção rápida de Stakeholder cadastrado */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Stakeholder Cadastrado</Label>
              <Select value={selectedStakeholderId} onValueChange={handleStakeholderChange}>
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue placeholder="Selecione um stakeholder" />
                </SelectTrigger>
                <SelectContent>
                  {stakeholders.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs sm:text-sm">
                      {s.name} {s.organization ? `(${s.organization})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nome do Contato */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome do Destinatário</Label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Ex: Carlos Mendes"
                className="text-xs sm:text-sm"
              />
            </div>

            {/* Grupo / Perfil */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Grupo de Stakeholder</Label>
                <Select
                  value={group}
                  onValueChange={(val) => setGroup(val as StakeholderGroup)}
                >
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STAKEHOLDER_GROUP_LABELS) as StakeholderGroup[]).map((g) => (
                      <SelectItem key={g} value={g} className="text-xs">
                        {STAKEHOLDER_GROUP_LABELS[g]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">WhatsApp (com DDD)</Label>
                <Input
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Tipo de Relatório */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Módulo de Dados a Incluir</Label>
              <Select
                value={reportType}
                onValueChange={(val) => setReportType(val as "FINANCIAL" | "ROI" | "COMBINED")}
              >
                <SelectTrigger className="w-full text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMBINED" className="text-xs sm:text-sm">
                    Executivo Completo (Financeiro + ROI e Entregas)
                  </SelectItem>
                  <SelectItem value="FINANCIAL" className="text-xs sm:text-sm">
                    Balanço Financeiro (Caixa, Entradas, Saídas, Runway)
                  </SelectItem>
                  <SelectItem value="ROI" className="text-xs sm:text-sm">
                    Prestação de Contas de Patrocínio (ROI e Entregas)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recado / Nota personalizada */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Mensagem Personalizada da Equipe (Opcional)
              </Label>
              <Textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Ex: Concluímos a usinagem do chassi nesta semana com sucesso e convidamos vocês para uma visita técnica!"
                rows={3}
                className="text-xs resize-none"
              />
            </div>

            <Button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto mt-2"
            >
              {isGenerating ? "Compilando Dados..." : "Gerar Relatório de Comunicação"}
            </Button>
          </CardContent>
        </Card>

        {/* Painel Direito: Pré-visualização & Disparo */}
        <Card className="lg:col-span-7 border-border bg-card">
          <CardHeader className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Pré-visualização da Mensagem
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Formatada de forma nativa para WhatsApp (negrito, marcadores) e E-mail.
                </CardDescription>
              </div>
              {generatedResult && (
                <Badge variant="outline" className="text-xs shrink-0 w-fit">
                  Pronto para Envio
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0">
            {!generatedResult ? (
              <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3 border border-dashed border-border rounded-lg p-6">
                <MessageSquare className="h-10 w-10 opacity-30" />
                <p className="text-sm font-medium">Nenhum relatório compilado ainda.</p>
                <p className="text-xs max-w-sm">
                  Selecione o destinatário ao lado e clique em &quot;Gerar Relatório de Comunicação&quot; para visualizar os dados atualizados de caixa e contrapartidas.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Tabs defaultValue="whatsapp" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="whatsapp" className="flex items-center gap-1.5 text-xs">
                      <MessageSquare className="h-3.5 w-3.5" />
                      WhatsApp (Mobile)
                    </TabsTrigger>
                    <TabsTrigger value="email" className="flex items-center gap-1.5 text-xs">
                      <Mail className="h-3.5 w-3.5" />
                      E-mail Institucional
                    </TabsTrigger>
                  </TabsList>

                  {/* Aba WhatsApp */}
                  <TabsContent value="whatsapp" className="space-y-3 mt-3">
                    <div className="rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs text-foreground whitespace-pre-wrap max-h-[360px] overflow-y-auto leading-relaxed">
                      {generatedResult.whatsappText}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleOpenWhatsApp}
                        className="w-full sm:w-auto"
                      >
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Abrir no WhatsApp
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(generatedResult.whatsappText, "wa")}
                        className="w-full sm:w-auto"
                      >
                        {copiedKey === "wa" ? (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copiar Texto
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleLogDispatched("WHATSAPP")}
                        className="w-full sm:w-auto"
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Registrar Envio no Histórico
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Aba E-mail */}
                  <TabsContent value="email" className="space-y-3 mt-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Assunto do E-mail</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={generatedResult.emailSubject}
                          className="text-xs font-medium"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(generatedResult.emailSubject, "subj")}
                          className="shrink-0 text-xs"
                        >
                          {copiedKey === "subj" ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Corpo do E-mail</Label>
                      <div className="rounded-lg border border-border bg-muted/40 p-4 font-mono text-xs text-foreground whitespace-pre-wrap max-h-[260px] overflow-y-auto leading-relaxed">
                        {generatedResult.emailPlainText}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(generatedResult.emailPlainText, "emailText")}
                        className="w-full sm:w-auto"
                      >
                        {copiedKey === "emailText" ? (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copiar Texto do E-mail
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopy(generatedResult.emailHtml, "emailHtml")}
                        className="w-full sm:w-auto"
                      >
                        {copiedKey === "emailHtml" ? (
                          <>
                            <Check className="mr-1.5 h-3.5 w-3.5 text-green-600" />
                            HTML Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1.5 h-3.5 w-3.5" />
                            Copiar HTML do E-mail
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleLogDispatched("EMAIL")}
                        className="w-full sm:w-auto"
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Registrar Envio no Histórico
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
