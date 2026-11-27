"use client";

import * as React from "react";
import { toast } from "sonner";
import { exportStakeholdersToPdf } from "@/lib/stakeholders-pdf-export";
import type {
  StakeholderGroup,
  StakeholderWithRelations,
} from "@/types/communication";

export function useStakeholdersPdfExport({
  stakeholders,
  teamName,
  groupFilter = "ALL",
}: {
  stakeholders: StakeholderWithRelations[];
  teamName?: string;
  groupFilter?: StakeholderGroup | "ALL";
}) {
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);

  const handleExportPdf = React.useCallback(async () => {
    if (stakeholders.length === 0) {
      toast.error("Não há stakeholders cadastrados para exportar.");
      return;
    }

    try {
      setIsExportingPdf(true);
      const { filename } = await exportStakeholdersToPdf({
        stakeholders,
        teamName,
        groupFilter,
      });
      toast.success(`Diretório de stakeholders exportado: ${filename}`);
    } catch {
      toast.error("Não foi possível gerar o PDF de stakeholders.");
    } finally {
      setIsExportingPdf(false);
    }
  }, [stakeholders, teamName, groupFilter]);

  return {
    isExportingPdf,
    handleExportPdf,
  };
}
