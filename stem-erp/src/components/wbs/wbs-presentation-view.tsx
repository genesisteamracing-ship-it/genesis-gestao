"use client";

import * as React from "react";
import {
  Printer,
  X,
  Presentation,
  Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface WbsPresentationViewProps {
  isPresentationMode: boolean;
  onTogglePresentationMode: () => void;
  onExpandToDepth: (depth: number) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export function WbsPresentationView({
  isPresentationMode,
  onTogglePresentationMode,
  onExpandToDepth,
  onExpandAll,
  onCollapseAll,
}: WbsPresentationViewProps) {
  const handlePrint = () => {
    window.print();
  };

  if (!isPresentationMode) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onTogglePresentationMode}
        className="h-9 gap-1.5 text-xs font-semibold border-primary/30 text-primary hover:bg-primary/10"
        title="Ativar modo de leitura limpa para banca de Project Management"
      >
        <Presentation className="h-4 w-4" />
        <span className="hidden sm:inline">Modo Juízes / Apresentação</span>
        <span className="sm:hidden">Juízes</span>
      </Button>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-primary/30 bg-primary/5 print:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary shrink-0">
          <Award className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-bold text-foreground">
            Modo Avaliação de Project Management (Juízes STEM)
          </h4>
          <p className="text-[11px] text-muted-foreground">
            Visualização limpa de leitura e auditoria da Regra dos 100%. Ações de edição ocultadas.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 self-end sm:self-auto">
        <span className="text-[11px] font-semibold text-muted-foreground mr-1">
          Profundidade:
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExpandToDepth(1)}
          className="h-7 text-xs px-2"
        >
          Nível 1
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onExpandToDepth(2)}
          className="h-7 text-xs px-2"
        >
          Nível 2
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onExpandAll}
          className="h-7 text-xs px-2"
        >
          Expandir Todos
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onCollapseAll}
          className="h-7 text-xs px-2"
        >
          Recolher
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          className="h-7 text-xs px-2.5 gap-1.5"
          title="Imprimir ou exportar em PDF"
        >
          <Printer className="h-3.5 w-3.5" />
          <span>Imprimir</span>
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onTogglePresentationMode}
          className="h-7 text-xs px-2.5 gap-1"
        >
          <X className="h-3.5 w-3.5" />
          <span>Sair</span>
        </Button>
      </div>
    </div>
  );
}
