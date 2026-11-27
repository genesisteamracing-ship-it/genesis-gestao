"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import {
  RISK_CONSEQUENCE_LABELS,
  RISK_CONSEQUENCE_ORDER,
  RISK_ENTRY_TYPE_LABELS,
  RISK_PROBABILITY_LABELS,
  RISK_PROBABILITY_ORDER,
  RISK_STATUS_LABELS,
} from "@/lib/risk-matrix";
import {
  ensureMinimumContingencyPlans,
  MAX_CONTINGENCY_PLANS,
  MIN_CONTINGENCY_PLANS,
  parseContingencyPlans,
  serializeContingencyPlans,
} from "@/lib/risk-contingency-plans";
import {
  createRiskItemSchema,
  type CreateRiskItemInput,
  type UpdateRiskItemInput,
} from "@/lib/risk-schemas";
import type { RiskItemDTO, RiskTeamMemberOption } from "@/types/risks";
import { RiskContingencyPlansField } from "./risk-contingency-plans-field";

interface RiskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  season: string;
  editingItem: RiskItemDTO | null;
  members: RiskTeamMemberOption[];
  isSaving: boolean;
  onSubmit: (
    values: CreateRiskItemInput | UpdateRiskItemInput
  ) => Promise<boolean>;
}

const SECTORS = Object.entries(DELIVERY_GROUP_LABELS);
const STATUS_OPTIONS = Object.entries(RISK_STATUS_LABELS);

export function RiskFormDialog({
  open,
  onOpenChange,
  season,
  editingItem,
  members,
  isSaving,
  onSubmit,
}: RiskFormDialogProps) {
  const form = useForm<
    z.input<typeof createRiskItemSchema>,
    unknown,
    CreateRiskItemInput
  >({
    resolver: zodResolver(createRiskItemSchema),
    defaultValues: {
      season,
      entryType: "RISK",
      title: "",
      description: "",
      sector: "PROJECT_MANAGEMENT",
      probability: "NONE",
      consequence: "NONE",
      proactiveStrategy: "",
      contingencyPlan: "",
      contingencyPlans: ["", ""],
      observations: "",
      evidenceNotes: "",
      evidenceUrl: "",
      status: "IDENTIFIED",
      ownerUserId: "",
    },
  });

  React.useEffect(() => {
    if (!open) return;
    if (editingItem) {
      form.reset({
        season: editingItem.season,
        entryType: editingItem.entryType,
        title: editingItem.title,
        description: editingItem.description ?? "",
        sector: editingItem.sector,
        probability: editingItem.probability,
        consequence: editingItem.consequence,
        proactiveStrategy: editingItem.proactiveStrategy ?? "",
        contingencyPlan: editingItem.contingencyPlan ?? "",
        contingencyPlans: ensureMinimumContingencyPlans(
          parseContingencyPlans(editingItem.contingencyPlan)
        ),
        observations: editingItem.observations ?? "",
        evidenceNotes: editingItem.evidenceNotes ?? "",
        evidenceUrl: editingItem.evidenceUrl ?? "",
        status: editingItem.status,
        ownerUserId: editingItem.ownerUserId ?? "",
      });
    } else {
      form.reset({
        season,
        entryType: "RISK",
        title: "",
        description: "",
        sector: "PROJECT_MANAGEMENT",
        probability: "NONE",
        consequence: "NONE",
        proactiveStrategy: "",
        contingencyPlan: "",
        contingencyPlans: ["", ""],
        observations: "",
        evidenceNotes: "",
        evidenceUrl: "",
        status: "IDENTIFIED",
        ownerUserId: "",
      });
    }
  }, [open, editingItem, season, form]);

  const entryType = form.watch("entryType");
  const watchedPlans = form.watch("contingencyPlans");
  const contingencyPlans = ensureMinimumContingencyPlans(watchedPlans ?? []);

  const handleChangePlan = (index: number, value: string) => {
    const next = [...contingencyPlans];
    next[index] = value;
    form.setValue("contingencyPlans", next, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
  };

  const handleAddPlan = () => {
    if (contingencyPlans.length >= MAX_CONTINGENCY_PLANS) return;
    form.setValue("contingencyPlans", [...contingencyPlans, ""], {
      shouldDirty: true,
    });
  };

  const handleRemovePlan = (index: number) => {
    if (index < MIN_CONTINGENCY_PLANS) return;
    const next = contingencyPlans.filter((_, idx) => idx !== index);
    form.setValue("contingencyPlans", next, {
      shouldDirty: true,
      shouldValidate: form.formState.isSubmitted,
    });
  };

  const rawContingencyErrors = form.formState.errors.contingencyPlans;
  const contingencyRootError =
    rawContingencyErrors && !Array.isArray(rawContingencyErrors)
      ? rawContingencyErrors.message
      : undefined;
  const contingencyItemErrors = Array.isArray(rawContingencyErrors)
    ? rawContingencyErrors.map((err) => err?.message)
    : undefined;

  const handleFormSubmit = form.handleSubmit(async (values) => {
    const normalizedPlans = values.contingencyPlans ?? [];
    const payload: CreateRiskItemInput = {
      ...values,
      contingencyPlans: normalizedPlans,
      contingencyPlan: serializeContingencyPlans(normalizedPlans),
    };

    if (editingItem) {
      await onSubmit({ ...payload, id: editingItem.id });
    } else {
      await onSubmit(payload);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? "Editar Registro" : "Novo Registro de Risco"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="risk-entry-type"
                className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
              >
                Classificação
              </Label>
              <div className="mt-auto">
                <Select
                  value={form.watch("entryType")}
                  onValueChange={(v) =>
                    form.setValue(
                      "entryType",
                      v as CreateRiskItemInput["entryType"]
                    )
                  }
                >
                  <SelectTrigger id="risk-entry-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(RISK_ENTRY_TYPE_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="risk-sector"
                className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
              >
                Setor Responsável
              </Label>
              <div className="mt-auto">
                <Select
                  value={form.watch("sector")}
                  onValueChange={(v) =>
                    form.setValue("sector", v as CreateRiskItemInput["sector"])
                  }
                >
                  <SelectTrigger id="risk-sector">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SECTORS.map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="risk-status"
                className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
              >
                Status
              </Label>
              <div className="mt-auto">
                <Select
                  value={form.watch("status")}
                  onValueChange={(v) =>
                    form.setValue("status", v as CreateRiskItemInput["status"])
                  }
                >
                  <SelectTrigger id="risk-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(([k, label]) => (
                      <SelectItem key={k} value={k}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-1.5">
            <Label
              htmlFor="risk-title"
              className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
            >
              Risco ou Oportunidade
            </Label>
            <div className="mt-auto">
              <Input
                id="risk-title"
                placeholder="Ex.: Atraso na entrega da usinagem CNC"
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="risk-probability"
                className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
              >
                Chance de Acontecer
              </Label>
              <div className="mt-auto">
                <Select
                  value={form.watch("probability")}
                  onValueChange={(v) =>
                    form.setValue(
                      "probability",
                      v as CreateRiskItemInput["probability"]
                    )
                  }
                >
                  <SelectTrigger id="risk-probability">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_PROBABILITY_ORDER.map((key) => (
                      <SelectItem key={key} value={key}>
                        {RISK_PROBABILITY_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="risk-consequence"
                className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
              >
                Consequência se Acontecer
              </Label>
              <div className="mt-auto">
                <Select
                  value={form.watch("consequence")}
                  onValueChange={(v) =>
                    form.setValue(
                      "consequence",
                      v as CreateRiskItemInput["consequence"]
                    )
                  }
                >
                  <SelectTrigger id="risk-consequence">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RISK_CONSEQUENCE_ORDER.map((key) => (
                      <SelectItem key={key} value={key}>
                        {RISK_CONSEQUENCE_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="risk-owner"
                className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
              >
                Responsável
              </Label>
              <div className="mt-auto">
                <Select
                  value={form.watch("ownerUserId") || "__NONE__"}
                  onValueChange={(v) =>
                    form.setValue("ownerUserId", v === "__NONE__" ? "" : v)
                  }
                >
                  <SelectTrigger id="risk-owner">
                    <SelectValue placeholder="Selecionar integrante" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__NONE__">Não atribuído</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between space-y-1.5">
            <Label
              htmlFor="risk-proactive"
              className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
            >
              Estratégia Proativa
            </Label>
            <div className="mt-auto">
              <Textarea
                id="risk-proactive"
                rows={2}
                placeholder="Ações preventivas ou de aproveitamento"
                {...form.register("proactiveStrategy")}
              />
            </div>
          </div>

          <RiskContingencyPlansField
            plans={contingencyPlans}
            isRequired={entryType === "RISK"}
            disabled={isSaving}
            rootError={contingencyRootError}
            itemErrors={contingencyItemErrors}
            onChangePlan={handleChangePlan}
            onAddPlan={handleAddPlan}
            onRemovePlan={handleRemovePlan}
          />

          <div className="flex flex-col justify-between space-y-1.5">
            <Label
              htmlFor="risk-observations"
              className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
            >
              Observações
            </Label>
            <div className="mt-auto">
              <Textarea
                id="risk-observations"
                rows={2}
                placeholder="Contexto adicional exibido na tabela"
                {...form.register("observations")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="risk-evidence-notes"
                className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
              >
                Evidências (Descrição)
              </Label>
              <div className="mt-auto">
                <Input
                  id="risk-evidence-notes"
                  placeholder="Registro de evidência de gestão"
                  {...form.register("evidenceNotes")}
                />
              </div>
            </div>

            <div className="flex flex-col justify-between space-y-1.5">
              <Label
                htmlFor="risk-evidence-url"
                className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
              >
                Link da Evidência (Opcional)
              </Label>
              <div className="mt-auto">
                <Input
                  id="risk-evidence-url"
                  placeholder="https://..."
                  {...form.register("evidenceUrl")}
                />
                {form.formState.errors.evidenceUrl && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.evidenceUrl.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Salvando..."
                : editingItem
                  ? "Salvar Alterações"
                  : "Cadastrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
