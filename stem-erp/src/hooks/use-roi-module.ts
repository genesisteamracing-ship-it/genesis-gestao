"use client";

import * as React from "react";
import type { SponsorTier } from "@prisma/client";
import { DELIVERY_GROUP_LABELS } from "@/lib/constants";
import { deliveryGroupValues } from "@/lib/validations/financial";
import { parseReaisToCents } from "@/lib/utils";
import type { DashboardMetricsDTO, SponsorRoiSummaryDTO } from "@/types/financial";

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
  // Filtro de Empresas Patrocinadoras
  const [tierFilter, setTierFilter] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Estado do Simulador de ROI para Patrocinadores
  const [sponsorInvestmentReais, setSponsorInvestmentReais] =
    React.useState("2500,00");
  const [estimatedReach, setEstimatedReach] = React.useState("15000");
  const [cpmEstimateReais, setCpmEstimateReais] = React.useState("40,00");
  const [brandActivationsReais, setBrandActivationsReais] =
    React.useState("1800,00");

  const sponsorRoiSummaries = metrics.sponsorRoiSummaries ?? [];

  // Métricas agregadas de Patrocinadores
  const sponsorAggregates = React.useMemo(() => {
    const totalInvestedCents = sponsorRoiSummaries.reduce(
      (acc, s) => acc + s.investedCents,
      0
    );
    const totalReturnCents = sponsorRoiSummaries.reduce(
      (acc, s) => acc + s.deliveredReturnCents,
      0
    );
    const netReturnCents = totalReturnCents - totalInvestedCents;
    const globalRoiPercent =
      totalInvestedCents > 0
        ? Math.round((netReturnCents / totalInvestedCents) * 100)
        : totalReturnCents > 0
        ? 100
        : 0;

    const globalMultiple =
      totalInvestedCents > 0
        ? `${(totalReturnCents / totalInvestedCents).toFixed(2)}x`
        : "0.00x";

    const tierCounts: Record<SponsorTier, number> = {
      DIAMOND: 0,
      GOLD: 0,
      SILVER: 0,
      BRONZE: 0,
    };

    for (const s of sponsorRoiSummaries) {
      tierCounts[s.tier] = (tierCounts[s.tier] || 0) + 1;
    }

    return {
      totalInvestedCents,
      totalReturnCents,
      netReturnCents,
      globalRoiPercent,
      globalMultiple,
      tierCounts,
      totalSponsorsCount: sponsorRoiSummaries.length,
    };
  }, [sponsorRoiSummaries]);

  // Lista filtrada de Patrocinadores
  const filteredSponsors = React.useMemo(() => {
    return sponsorRoiSummaries.filter((s) => {
      if (tierFilter !== "ALL" && s.tier !== tierFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(q);
        const matchesContact = s.contactName?.toLowerCase().includes(q);
        const matchesNotes = s.notes?.toLowerCase().includes(q);
        return matchesName || matchesContact || matchesNotes;
      }
      return true;
    });
  }, [sponsorRoiSummaries, tierFilter, searchQuery]);

  // Métricas reais consolidadas da Equipe (Orçamento x Captação)
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
    sponsorAggregates,
    filteredSponsors,
    tierFilter,
    setTierFilter,
    searchQuery,
    setSearchQuery,
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
