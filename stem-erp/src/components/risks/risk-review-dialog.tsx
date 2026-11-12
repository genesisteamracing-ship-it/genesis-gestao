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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  RISK_CONSEQUENCE_LABELS,
  RISK_CONSEQUENCE_ORDER,
  RISK_PROBABILITY_LABELS,
  RISK_PROBABILITY_ORDER,
  RISK_STATUS_LABELS,
} from "@/lib/risk-matrix";
import {
  registerRiskReviewSchema,
  type RegisterRiskReviewInput,
} from "@/lib/risk-schemas";
import type { RiskItemDTO, RiskReviewDTO } from "@/types/risks";

interface RiskReviewDialogProps {
  item: RiskItemDTO | null;
  reviews: RiskReviewDTO[];
  isLoadingReviews: boolean;
  isSaving: boolean;
  canEdit: boolean;
  onClose: () => void;
  onSubmitReview: (values: RegisterRiskReviewInput) => Promise<boolean>;
}

const STATUS_OPTIONS = Object.entries(RISK_STATUS_LABELS);

export function RiskReviewDialog({
  item,
  reviews,
  isLoadingReviews,
  isSaving,
  canEdit,
  onClose,
  onSubmitReview,
}: RiskReviewDialogProps) {
  const form = useForm<
    z.input<typeof registerRiskReviewSchema>,
    unknown,
    RegisterRiskReviewInput
  >({
    resolver: zodResolver(registerRiskReviewSchema),
    defaultValues: {
      riskItemId: "",
      newProbability: "NONE",
      newConsequence: "NONE",
      newStatus: "IDENTIFIED",
      notes: "",
      evidenceNotes: "",
      evidenceUrl: "",
    },
  });

  React.useEffect(() => {
    if (!item) return;
    form.reset({
      riskItemId: item.id,
      newProbability: item.probability,
      newConsequence: item.consequence,
      newStatus: item.status,
      notes: "",
      evidenceNotes: item.evidenceNotes ?? "",
      evidenceUrl: item.evidenceUrl ?? "",
    });
  }, [item, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const ok = await onSubmitReview(values);
    if (ok) {
      form.setValue("notes", "");
    }
  });

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisões & Histórico — {item?.title}</DialogTitle>
        </DialogHeader>

        {canEdit && item && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl border border-border bg-muted/30 p-4"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="flex flex-col justify-between space-y-1.5">
                <Label
                  htmlFor="rev-prob"
                  className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
                >
                  Nova Probabilidade
                </Label>
                <div className="mt-auto">
                  <Select
                    value={form.watch("newProbability")}
                    onValueChange={(v) =>
                      form.setValue(
                        "newProbability",
                        v as RegisterRiskReviewInput["newProbability"]
                      )
                    }
                  >
                    <SelectTrigger id="rev-prob">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RISK_PROBABILITY_ORDER.map((k) => (
                        <SelectItem key={k} value={k}>
                          {RISK_PROBABILITY_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col justify-between space-y-1.5">
                <Label
                  htmlFor="rev-cons"
                  className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
                >
                  Nova Consequência
                </Label>
                <div className="mt-auto">
                  <Select
                    value={form.watch("newConsequence")}
                    onValueChange={(v) =>
                      form.setValue(
                        "newConsequence",
                        v as RegisterRiskReviewInput["newConsequence"]
                      )
                    }
                  >
                    <SelectTrigger id="rev-cons">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RISK_CONSEQUENCE_ORDER.map((k) => (
                        <SelectItem key={k} value={k}>
                          {RISK_CONSEQUENCE_LABELS[k]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col justify-between space-y-1.5">
                <Label
                  htmlFor="rev-status"
                  className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
                >
                  Novo Status
                </Label>
                <div className="mt-auto">
                  <Select
                    value={form.watch("newStatus")}
                    onValueChange={(v) =>
                      form.setValue(
                        "newStatus",
                        v as RegisterRiskReviewInput["newStatus"]
                      )
                    }
                  >
                    <SelectTrigger id="rev-status">
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
                htmlFor="rev-notes"
                className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
              >
                Parecer da Revisão
              </Label>
              <div className="mt-auto">
                <Textarea
                  id="rev-notes"
                  rows={2}
                  placeholder="Descreva a evolução, eficácia da estratégia proativa ou ação tomada"
                  {...form.register("notes")}
                />
                {form.formState.errors.notes && (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.notes.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col justify-between space-y-1.5">
                <Label
                  htmlFor="rev-evidence"
                  className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
                >
                  Evidência Atualizada
                </Label>
                <div className="mt-auto">
                  <Input
                    id="rev-evidence"
                    placeholder="Evidência coletada na revisão"
                    {...form.register("evidenceNotes")}
                  />
                </div>
              </div>

              <div className="flex flex-col justify-between space-y-1.5">
                <Label
                  htmlFor="rev-evidence-url"
                  className="flex min-h-[2rem] items-end text-xs font-semibold leading-tight"
                >
                  Link da Evidência
                </Label>
                <div className="mt-auto">
                  <Input
                    id="rev-evidence-url"
                    placeholder="https://..."
                    {...form.register("evidenceUrl")}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? "Registrando..." : "Registrar Revisão"}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Histórico de Revisões ({reviews.length})
          </h3>

          {isLoadingReviews ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : reviews.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Nenhuma revisão registrada até o momento.
            </p>
          ) : (
            <ul className="space-y-2">
              {reviews.map((rev) => (
                <li
                  key={rev.id}
                  className="rounded-xl border border-border bg-card p-3 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-foreground">
                      {rev.reviewerName}
                    </span>
                    <span className="text-muted-foreground">
                      {new Date(rev.reviewedAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Chance: {RISK_PROBABILITY_LABELS[rev.previousProbability]} →{" "}
                    <strong className="text-foreground">
                      {RISK_PROBABILITY_LABELS[rev.newProbability]}
                    </strong>{" "}
                    | Consequência:{" "}
                    {RISK_CONSEQUENCE_LABELS[rev.previousConsequence]} →{" "}
                    <strong className="text-foreground">
                      {RISK_CONSEQUENCE_LABELS[rev.newConsequence]}
                    </strong>{" "}
                    | Status: {RISK_STATUS_LABELS[rev.newStatus]}
                  </p>
                  <p className="mt-1 text-foreground">{rev.notes}</p>
                  {rev.evidenceNotes && (
                    <p className="mt-1 text-muted-foreground">
                      Evidência: {rev.evidenceNotes}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
