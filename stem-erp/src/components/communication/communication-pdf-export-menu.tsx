"use client";

import { ChevronDown, FileText, LayoutGrid, Loader2, Table2 } from "lucide-react";
import { tv } from "tailwind-variants";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const exportTriggerStyles = tv({
  base: "gap-2 font-semibold border-border bg-card text-foreground hover:bg-muted cursor-pointer",
  variants: {
    size: {
      default: "w-full sm:w-auto",
      sm: "text-xs",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export interface CommunicationPdfExportMenuProps {
  disabled: boolean;
  isExporting: boolean;
  size?: "default" | "sm";
  className?: string;
  onExportCommunicationMatrix: () => void;
  onExportStakeholdersMatrix: () => void;
}

export function CommunicationPdfExportMenu({
  disabled,
  isExporting,
  size = "default",
  className,
  onExportCommunicationMatrix,
  onExportStakeholdersMatrix,
}: CommunicationPdfExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size={size}
          disabled={disabled || isExporting}
          className={exportTriggerStyles({ size, className })}
          aria-label="Exportar relatório PDF"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <FileText className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{isExporting ? "Exportando..." : "Relatório PDF"}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuItem
          onClick={onExportCommunicationMatrix}
          className="cursor-pointer gap-2 text-xs font-medium"
        >
          <Table2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>Matriz de Comunicação (Tabela)</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onExportStakeholdersMatrix}
          className="cursor-pointer gap-2 text-xs font-medium"
        >
          <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
          <span>Matriz Poder × Interesse</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
