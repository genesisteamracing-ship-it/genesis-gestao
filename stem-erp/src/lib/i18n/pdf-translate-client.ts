import type { AppLocale } from "./locale-types";
import {
  sanitizePdfText,
  shouldSkipDynamicTranslation,
  type TranslationFallbackReason,
} from "./gemini-translate-service";
import { translateUiText } from "./translations";

const CLIENT_CACHE_PREFIX = "stem-erp-pdf-i18n::";
const MAX_CLIENT_CACHE_ENTRIES = 1000;
const clientMemoryCache = new Map<string, string>();

export interface TranslatePdfTextsOptions {
  locale: AppLocale;
  context: string;
  fetchImpl?: typeof fetch;
}

export interface TranslatePdfTextsResult {
  translations: Map<string, string>;
  usedFallback: boolean;
  reason?: TranslationFallbackReason;
}

export function clearClientPdfTranslationCache(): void {
  clientMemoryCache.clear();
  if (typeof window === "undefined") {
    return;
  }
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key?.startsWith(CLIENT_CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // Ignora indisponibilidade de sessionStorage
  }
}

function buildClientCacheKey(locale: AppLocale, text: string): string {
  return `${CLIENT_CACHE_PREFIX}${locale}::${text}`;
}

function readClientCache(locale: AppLocale, text: string): string | undefined {
  const key = buildClientCacheKey(locale, text);
  const inMem = clientMemoryCache.get(key);
  if (inMem !== undefined) {
    return inMem;
  }

  if (typeof window === "undefined") {
    return undefined;
  }

  try {
    const stored = window.sessionStorage.getItem(key);
    if (stored !== null) {
      clientMemoryCache.set(key, stored);
      return stored;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function writeClientCache(locale: AppLocale, text: string, value: string): void {
  const key = buildClientCacheKey(locale, text);
  if (clientMemoryCache.size >= MAX_CLIENT_CACHE_ENTRIES) {
    const oldest = clientMemoryCache.keys().next().value;
    if (oldest !== undefined) {
      clientMemoryCache.delete(oldest);
    }
  }
  clientMemoryCache.set(key, value);

  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Ignora quota cheia em sessionStorage
  }
}

export async function translatePdfTexts(
  texts: readonly (string | null | undefined)[],
  options: TranslatePdfTextsOptions
): Promise<TranslatePdfTextsResult> {
  const translations = new Map<string, string>();

  if (options.locale === "pt-BR") {
    return {
      translations,
      usedFallback: false,
    };
  }

  const pendingForApi: string[] = [];
  const seenPending = new Set<string>();

  for (const raw of texts) {
    if (!raw) {
      continue;
    }
    const text = raw.trim();
    if (!text || translations.has(text)) {
      continue;
    }

    if (shouldSkipDynamicTranslation(text)) {
      translations.set(text, sanitizePdfText(text));
      continue;
    }

    const staticMatch = translateUiText(text, options.locale);
    if (staticMatch !== text) {
      translations.set(text, sanitizePdfText(staticMatch));
      continue;
    }

    const cached = readClientCache(options.locale, text);
    if (cached !== undefined) {
      translations.set(text, cached);
      continue;
    }

    if (!seenPending.has(text)) {
      seenPending.add(text);
      pendingForApi.push(text);
    }
  }

  if (pendingForApi.length === 0) {
    return {
      translations,
      usedFallback: false,
    };
  }

  const fetchFn = options.fetchImpl ?? (typeof fetch === "function" ? fetch : null);
  if (!fetchFn) {
    pendingForApi.forEach((text) => {
      translations.set(text, sanitizePdfText(text));
    });
    return {
      translations,
      usedFallback: true,
      reason: "NETWORK_ERROR",
    };
  }

  let usedFallback = false;
  let reason: TranslationFallbackReason | undefined;

  // Envia em blocos de até 180 textos por requisição (limite da rota é 200)
  const chunkSize = 180;
  for (let i = 0; i < pendingForApi.length; i += chunkSize) {
    const chunk = pendingForApi.slice(i, i + chunkSize);

    try {
      const response = await fetchFn("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          texts: chunk,
          sourceLocale: "pt-BR",
          targetLocale: options.locale,
          context: options.context,
        }),
      });

      if (!response.ok) {
        usedFallback = true;
        reason = "PROVIDER_ERROR";
        chunk.forEach((text) => translations.set(text, sanitizePdfText(text)));
        continue;
      }

      const data = (await response.json()) as {
        ok?: boolean;
        fallback?: boolean;
        reason?: TranslationFallbackReason;
        translations?: unknown;
      };

      const translatedList = Array.isArray(data.translations)
        ? data.translations
        : null;

      if (data.fallback || !translatedList) {
        usedFallback = true;
        reason = data.reason ?? "PROVIDER_ERROR";
      }

      chunk.forEach((original, idx) => {
        const candidate = translatedList?.[idx];
        const finalText =
          typeof candidate === "string" && candidate.trim().length > 0
            ? sanitizePdfText(candidate)
            : sanitizePdfText(original);
        translations.set(original, finalText);
        if (!data.fallback && typeof candidate === "string") {
          writeClientCache(options.locale, original, finalText);
        }
      });
    } catch {
      usedFallback = true;
      reason = "NETWORK_ERROR";
      chunk.forEach((text) => translations.set(text, sanitizePdfText(text)));
    }
  }

  return {
    translations,
    usedFallback,
    reason,
  };
}

export function resolveTranslatedPdfText(
  value: string,
  translations: ReadonlyMap<string, string>,
  locale: AppLocale
): string {
  if (locale === "pt-BR" || !value) {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  const translated = translations.get(trimmed);
  if (translated !== undefined) {
    return translated;
  }

  return sanitizePdfText(translateUiText(value, locale));
}
