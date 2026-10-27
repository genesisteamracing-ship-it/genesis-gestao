"use client";

import * as React from "react";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { deliveryGroupValues } from "@/lib/validations/financial";
import { parseReaisToCents } from "@/lib/utils";
import type { DashboardMetricsDTO } from "@/types/financial";

export interface SectorRoiRow {
  deliveryGroup: (typeof deliveryGroupValues)[number];
  label: string;
  plannedCents: number;
  realizedCents: number;
  sponsoredOrBarterCents: number;
  savingsCents: number;
  efficiencyPercent: number;
}

export function useRoiModule(metrics: DashboardMetricsDTO) {
  // Estado do Simulador de ROI para Patrocinadores
  const [sponsorInvestmentReais, setSponsorInvestmentReais] =
    React.useState("2500,00");
  const [estimatedReach, setEstimatedReach] = React.useState("15000");
  const [cpmEstimateReais, setCpmEstimateReais] = React.useState("40,00");
  const [brandActivationsReais, setBrandActivationsReais] =
    React.useState("1800,00");

  // Métricas reais consolidadas da Equipe
  const summary = React.useMemo(() => {
    const { kpis, budgetResources } = metrics;

    const barterSavingsCents = budgetResources
      .filter((r) => r.acquisitionStrategy === "BARTER_PARTNERSHIP")
      .reduce((acc, r) => acc + r.plannedAmountCents, 0);

    const sponsoredResourcesCents = budgetResources
      .filter(
        (r) =>
          r.acquisitionStrategy === "FINANCIAL_SPONSOR" ||
          r.acquisitionStrategy === "BARTER_PARTNERSHIP"
      )
      .reduce((acc, r) => acc + r.plannedAmountCents, 0);

    const totalCaptationCents = kpis.totalOriginsCents + barterSavingsCents;
    const totalInvestedCents = kpis.totalApplicationsCents;

    const projectRoiPercent =
      totalInvestedCents > 0
        ? Math.round(
            ((totalCaptationCents - totalInvestedCents) / totalInvestedCents) *
              100
          )
        : totalCaptationCents > 0
        ? 100
        : 0;

    const coveragePercent =
      kpis.totalPlannedBudgetCents > 0
        ? Math.round(
            (totalCaptationCents / kpis.totalPlannedBudgetCents) * 100
          )
        : 0;

    const sectorRows: SectorRoiRow[] = deliveryGroupValues.map((group) => {
      const groupResources = budgetResources.filter(
        (r) => r.deliveryGroup === group
      );
      const plannedCents = groupResources.reduce(
        (acc, r) => acc + r.plannedAmountCents,
        0
      );
      const realizedCents = groupResources.reduce(
        (acc, r) => acc + r.realizedAmountCents,
        0
      );
      const sponsoredOrBarterCents = groupResources
        .filter(
          (r) =>
            r.acquisitionStrategy === "FINANCIAL_SPONSOR" ||
            r.acquisitionStrategy === "BARTER_PARTNERSHIP"
        )
        .reduce((acc, r) => acc + r.plannedAmountCents, 0);

      const savingsCents = Math.max(0, plannedCents - realizedCents);
      const efficiencyPercent =
        plannedCents > 0
          ? Math.round(((plannedCents - realizedCents) / plannedCents) * 100)
          : 0;

      return {
        deliveryGroup: group,
        label: DELIVERY_GROUP_LABELS[group],
        plannedCents,
        realizedCents,
        sponsoredOrBarterCents,
        savingsCents,
        efficiencyPercent,
      };
    });

    return {
      totalCaptationCents,
      barterSavingsCents,
      sponsoredResourcesCents,
      projectRoiPercent,
      coveragePercent,
      sectorRows,
    };
  }, [metrics]);

  // Cálculos do Simulador de Patrocínio
  const simulation = React.useMemo(() => {
    const investmentCents = Math.max(
      0,
      parseReaisToCents(sponsorInvestmentReais || "0")
    );
    const reach = Math.max(0, Number(estimatedReach) || 0);
    const cpmCents = Math.max(0, parseReaisToCents(cpmEstimateReais || "0"));
    const activationsCents = Math.max(
      0,
      parseReaisToCents(brandActivationsReais || "0")
    );

    const mediaValuationCents = Math.round((reach / 1000) * cpmCents);
    const totalDeliveredValueCents = mediaValuationCents + activationsCents;
    const netReturnCents = totalDeliveredValueCents - investmentCents;

    const sponsorRoiPercent =
      investmentCents > 0
        ? Math.round((netReturnCents / investmentCents) * 100)
        : 0;

    const returnMultiple =
      investmentCents > 0
        ? (totalDeliveredValueCents / investmentCents).toFixed(2)
        : "0.00";

    return {
      investmentCents,
      mediaValuationCents,
      activationsCents,
      totalDeliveredValueCents,
      netReturnCents,
      sponsorRoiPercent,
      returnMultiple,
    };
  }, [
    sponsorInvestmentReais,
    estimatedReach,
    cpmEstimateReais,
    brandActivationsReais,
  ]);

  return {
    summary,
    simulation,
    sponsorInvestmentReais,
    setSponsorInvestmentReais,
    estimatedReach,
    setEstimatedReach,
    cpmEstimateReais,
    setCpmEstimateReais,
    brandActivationsReais,
    setBrandActivationsReais,
  };
}
