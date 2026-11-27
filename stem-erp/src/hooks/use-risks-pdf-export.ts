"use client";

import * as React from "react";
import { toast } from "sonner";
import { exportRisksToPdf } from "@/lib/risks-pdf-export";
import type { RiskItemDTO } from "@/types/risks";

export function useRisksPdfExport({
  items,
  teamName,
  seasonLabel,
}: {
  items: RiskItemDTO[];
  teamName?: string;
  seasonLabel?: string;
}) {
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  const handleExportPdf = React.useCallback(async () => {
    if (items.length === 0) {
      toast.error("Não há riscos cadastrados para exportar.");
      return;
    }

    try {
      setIsExportingPdf(true);
      const { filename } = await exportRisksToPdf({
        items,
        teamName,
        seasonLabel,
      });
      toast.success(`Matriz de riscos exportada: ${filename}`);
    } catch {
      toast.error("Não foi possível gerar o relatório de riscos em PDF.");
    } finally {
      setIsExportingPdf(false);
    }
  }, [items, teamName, seasonLabel]);

  return {
    isExportingPdf,
    handleExportPdf,
  };
}
