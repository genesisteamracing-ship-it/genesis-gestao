"use client";

import * as React from "react";
import { toast } from "sonner";
import { exportCommunicationMatrixToPdf } from "@/lib/communication-matrix-pdf-export";
import type {
  StakeholderGroup,
  StakeholderWithRelations,
} from "@/types/communication";

export function useCommunicationMatrixPdfExport({
  stakeholders,
  teamName,
  groupFilter = "ALL",
}: {
  stakeholders: StakeholderWithRelations[];
  teamName?: string;
  groupFilter?: StakeholderGroup | "ALL";
}) {
  const [isExportingMatrixPdf, setIsExportingMatrixPdf] = React.useState(false);

  const handleExportMatrixPdf = React.useCallback(async () => {
    if (stakeholders.length === 0) {
      toast.error("Não há stakeholders cadastrados para exportar.");
      return;
    }

    try {
      setIsExportingMatrixPdf(true);
      const { filename } = await exportCommunicationMatrixToPdf({
        stakeholders,
        teamName,
        groupFilter,
      });
      toast.success(`Matriz de comunicação exportada: ${filename}`);
    } catch {
      toast.error("Não foi possível gerar o PDF da matriz de comunicação.");
    } finally {
      setIsExportingMatrixPdf(false);
    }
  }, [stakeholders, teamName, groupFilter]);

  return {
    isExportingMatrixPdf,
    handleExportMatrixPdf,
  };
}
