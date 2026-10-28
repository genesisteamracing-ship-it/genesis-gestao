"use client";

import { useState } from "react";
import { Plus, Trash2, CalendarPlus, FileText, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StakeholderGroup, StakeholderWithRelations } from "@/types/communication";
import {
  COMMUNICATION_CHANNEL_LABELS,
  COMMUNICATION_FREQUENCY_LABELS,
  ENGAGEMENT_LEVEL_LABELS,
  STAKEHOLDER_GROUP_LABELS,
  STAKEHOLDER_POWER_LABELS,
} from "@/lib/communication-constants";
import { deleteStakeholderAction } from "@/actions/communication-actions";

interface StakeholdersListTabProps {
  stakeholders: StakeholderWithRelations[];
  onOpenCreateDialog: () => void;
  onOpenPlanDialog: (stakeholderId: string) => void;
  onSelectForReport: (stakeholderId: string) => void;
}

export function StakeholdersListTab({
  stakeholders,
  onOpenCreateDialog,
  onOpenPlanDialog,
  onSelectForReport,
}: StakeholdersListTabProps) {
  const [filterGroup, setFilterGroup] = useState<string>("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredStakeholders = stakeholders.filter((s) => {
    if (filterGroup === "ALL") return true;
    return s.group === filterGroup;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja remover o stakeholder "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await deleteStakeholderAction(id);
      if (!res.success) {
        toast.error(res.message || "Erro ao excluir.");
        return;
      }
      toast.success(res.message);
    } catch {
      toast.error("Erro inesperado ao excluir.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader className="p-4 sm:p-6 pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base sm:text-lg">
              Diretório de Stakeholders & Estratégias
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Gestão de relacionamento com patrocinadores, direção escolar, pais e mentores.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={filterGroup} onValueChange={setFilterGroup}>
              <SelectTrigger className="w-[180px] text-xs">
                <SelectValue placeholder="Filtrar por grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  Todos os Grupos ({stakeholders.length})
                </SelectItem>
                {(Object.keys(STAKEHOLDER_GROUP_LABELS) as StakeholderGroup[]).map((g) => (
                  <SelectItem key={g} value={g} className="text-xs">
                    {STAKEHOLDER_GROUP_LABELS[g]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              size="sm"
              onClick={onOpenCreateDialog}
              className="text-xs"
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Novo Stakeholder
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 pt-2">
        {filteredStakeholders.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <p className="text-sm font-medium">Nenhum stakeholder encontrado.</p>
            <p className="text-xs">
              Cadastre partes interessadas para organizar réguas e emitir relatórios de prestação de contas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Stakeholder / Empresa</TableHead>
                  <TableHead className="min-w-[140px]">Grupo & Contato</TableHead>
                  <TableHead className="min-w-[110px]">Poder / Interesse</TableHead>
                  <TableHead className="min-w-[120px]">Engajamento</TableHead>
                  <TableHead className="min-w-[130px]">Canal / Frequência</TableHead>
                  <TableHead className="text-right min-w-[130px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStakeholders.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div>
                        <span className="text-foreground text-xs sm:text-sm font-semibold">
                          {s.name}
                        </span>
                        {s.organization && (
                          <span className="block text-xs text-muted-foreground">
                            {s.organization} {s.roleOrJobTitle ? `• ${s.roleOrJobTitle}` : ""}
                          </span>
                        )}
                        {s.sponsor && (
                          <Badge variant="secondary" className="mt-1 text-[10px]">
                            Patrocinador {s.sponsor.tier}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-[11px] font-normal">
                          {STAKEHOLDER_GROUP_LABELS[s.group]}
                        </Badge>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {s.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {s.phone}
                            </span>
                          )}
                          {s.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {s.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1 text-[11px]">
                        <span className="text-muted-foreground">
                          Poder: <strong>{STAKEHOLDER_POWER_LABELS[s.power]}</strong>
                        </span>
                        <span className="text-muted-foreground">
                          Interesse: <strong>{s.interest === "HIGH" ? "Alto" : "Baixo"}</strong>
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {ENGAGEMENT_LEVEL_LABELS[s.currentEngagement]}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      <div className="space-y-0.5">
                        <span className="font-medium text-foreground block">
                          {COMMUNICATION_CHANNEL_LABELS[s.preferredChannel]}
                        </span>
                        <span>{COMMUNICATION_FREQUENCY_LABELS[s.preferredFrequency]}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onSelectForReport(s.id)}
                          title="Gerar Relatório"
                          className="h-8 w-8 text-primary"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onOpenPlanDialog(s.id)}
                          title="Criar Régua de Comunicação"
                          className="h-8 w-8 text-foreground"
                        >
                          <CalendarPlus className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id, s.name)}
                          disabled={deletingId === s.id}
                          title="Excluir Stakeholder"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
