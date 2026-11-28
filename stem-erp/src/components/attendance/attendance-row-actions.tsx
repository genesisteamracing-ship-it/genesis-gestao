"use client";

import { Download, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AttendanceRowActionsProps {
  memberId: string;
  memberName: string;
  isExporting?: boolean;
  onExportIndividualPdf: (memberId: string) => void;
  onExportIndividualCsv: (memberId: string) => void;
}

export function AttendanceRowActions({
  memberId,
  memberName,
  isExporting = false,
  onExportIndividualPdf,
  onExportIndividualCsv,
}: AttendanceRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={isExporting}
          className="h-8 w-8 rounded-lg border-border/80 bg-card hover:bg-muted/80 hover:text-foreground cursor-pointer"
          aria-label={`Ações para ${memberName}`}
        >
          <Settings className="h-4 w-4 text-foreground transition-transform duration-200 hover:rotate-45" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={() => onExportIndividualPdf(memberId)}
          className="cursor-pointer gap-2 text-xs font-medium"
        >
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Relatório Individual (PDF)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onExportIndividualCsv(memberId)}
          className="cursor-pointer gap-2 text-xs font-medium"
        >
          <Download className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Histórico Individual (CSV)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
