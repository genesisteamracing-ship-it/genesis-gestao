"use client";

import * as React from "react";
import type { SeasonMonthDTO } from "@/types/financial";

const FALLBACK_MONTHS: SeasonMonthDTO[] = Array.from({ length: 6 }, (_, i) => ({
  index: i + 1,
  key: `fallback-${i + 1}`,
  label: `Mês ${i + 1}`,
}));

const SeasonContext = React.createContext<SeasonMonthDTO[]>(FALLBACK_MONTHS);

interface SeasonProviderProps {
  seasonMonths?: SeasonMonthDTO[];
  children: React.ReactNode;
}

export function SeasonProvider({ seasonMonths, children }: SeasonProviderProps) {
  const value = seasonMonths && seasonMonths.length > 0 ? seasonMonths : FALLBACK_MONTHS;
  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}

/** Meses da temporada da equipe ativa (gerados a partir do intervalo início → fim) */
export function useSeasonMonths(): SeasonMonthDTO[] {
  return React.useContext(SeasonContext);
}

/** Rótulo do mês pelo índice, ex.: 2 => "Set/2025" */
export function useSeasonMonthLabel(): (index: number) => string {
  const months = useSeasonMonths();
  return React.useCallback(
    (index: number) => months.find((m) => m.index === index)?.label ?? `Mês ${index}`,
    [months]
  );
}
