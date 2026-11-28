"use client";

import * as React from "react";
import { translateUiText } from "@/lib/i18n/translations";
import { useLocale } from "@/components/i18n/locale-provider";
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
  const { locale } = useLocale();
  const baseMonths =
    seasonMonths && seasonMonths.length > 0 ? seasonMonths : FALLBACK_MONTHS;

  const value = React.useMemo(
    () =>
      locale === "pt-BR"
        ? baseMonths
        : baseMonths.map((month) => ({
            ...month,
            label: translateUiText(month.label, locale),
          })),
    [baseMonths, locale]
  );

  return <SeasonContext.Provider value={value}>{children}</SeasonContext.Provider>;
}

/** Meses da temporada da equipe ativa (gerados a partir do intervalo início → fim) */
export function useSeasonMonths(): SeasonMonthDTO[] {
  return React.useContext(SeasonContext);
}

/** Rótulo do mês pelo índice, ex.: 2 => "Set/2025" (ou "Sep/2025" em en-US) */
export function useSeasonMonthLabel(): (index: number) => string {
  const { locale } = useLocale();
  const months = useSeasonMonths();
  return React.useCallback(
    (index: number) => {
      const found = months.find((m) => m.index === index)?.label;
      if (found) {
        return found;
      }
      return locale === "en-US" ? `Month ${index}` : `Mês ${index}`;
    },
    [months, locale]
  );
}
