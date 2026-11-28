"use client";

import * as React from "react";
import { useLocale } from "@/components/i18n/locale-provider";
import {
  resolveTranslatedPdfText,
  translatePdfTexts,
} from "@/lib/i18n/pdf-translate-client";

const EMPTY_TRANSLATIONS: ReadonlyMap<string, string> = new Map();

export interface UseDynamicTranslationsResult {
  translate: (value: string) => string;
  isTranslating: boolean;
}

interface TranslationSnapshot {
  signature: string;
  map: ReadonlyMap<string, string>;
}

/**
 * Traduz textos dinâmicos vindos do banco de dados quando o idioma ativo for `en-US`,
 * reutilizando o dicionário estático, o cache em memória/sessionStorage e a API `/api/translate` (Gemini).
 * Em `pt-BR` retorna os textos originais sem disparar requisições.
 */
export function useDynamicTranslations(
  texts: readonly (string | null | undefined)[],
  context: string,
  fetchImpl?: typeof fetch
): UseDynamicTranslationsResult {
  const { locale } = useLocale();
  const [snapshot, setSnapshot] = React.useState<TranslationSnapshot>({
    signature: "",
    map: EMPTY_TRANSLATIONS,
  });

  const uniqueTexts = React.useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const raw of texts) {
      const trimmed = raw?.trim();
      if (trimmed && !seen.has(trimmed)) {
        seen.add(trimmed);
        list.push(trimmed);
      }
    }
    return list;
  }, [texts]);

  const signature = React.useMemo(
    () => `${locale}::${context}::${uniqueTexts.join("\u0001")}`,
    [locale, context, uniqueTexts]
  );

  React.useEffect(() => {
    if (locale === "pt-BR" || uniqueTexts.length === 0) {
      return;
    }

    let cancelled = false;

    translatePdfTexts(uniqueTexts, {
      locale,
      context,
      fetchImpl,
    })
      .then((result) => {
        if (!cancelled) {
          setSnapshot({
            signature,
            map: result.translations,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSnapshot((prev) => ({
            signature,
            map: prev.map,
          }));
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, fetchImpl]);

  const activeMap =
    locale === "pt-BR" || uniqueTexts.length === 0
      ? EMPTY_TRANSLATIONS
      : snapshot.map;

  const isTranslating =
    locale !== "pt-BR" &&
    uniqueTexts.length > 0 &&
    snapshot.signature !== signature;

  const translate = React.useCallback(
    (value: string) => resolveTranslatedPdfText(value, activeMap, locale),
    [activeMap, locale]
  );

  return { translate, isTranslating };
}
