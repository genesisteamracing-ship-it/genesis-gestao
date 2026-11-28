import type { AppLocale } from "./locale-types";

export const DEFAULT_GEMINI_TRANSLATION_MODEL = "gemini-2.5-flash-lite";
export const MAX_GEMINI_BATCH_SIZE = 60;
const MAX_SERVER_CACHE_ENTRIES = 2000;
const GEMINI_REQUEST_TIMEOUT_MS = 15000;

export type TranslationFallbackReason =
  | "MISSING_API_KEY"
  | "PROVIDER_ERROR"
  | "INVALID_RESPONSE"
  | "NETWORK_ERROR";

export interface TranslateWithGeminiParams {
  texts: readonly string[];
  sourceLocale?: AppLocale;
  targetLocale?: AppLocale;
  context?: string;
  apiKey?: string | null;
  model?: string | null;
  fetchImpl?: typeof fetch;
}

export interface TranslateWithGeminiResult {
  ok: boolean;
  fallback: boolean;
  reason?: TranslationFallbackReason;
  translations: string[];
}

const serverTranslationCache = new Map<string, string>();

export function clearServerTranslationCache(): void {
  serverTranslationCache.clear();
}

export function sanitizePdfText(text: string): string {
  return text
    .replace(/\u2192|\u2794|\u27A1/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u2013|\u2014|\u2212/g, "-")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u2026/g, "...")
    .replace(/\u2022/g, "-")
    .replace(/\u00A0/g, " ");
}

export function shouldSkipDynamicTranslation(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) {
    return true;
  }

  // Sem letras (apenas numeros, datas, pontuacao, simbolos)
  if (!/[A-Za-zÀ-ÿ]/.test(trimmed)) {
    return true;
  }

  // E-mails
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return true;
  }

  // URLs
  if (/^https?:\/\/\S+$/i.test(trimmed)) {
    return true;
  }

  // Valores monetarios em BRL ou percentuais simples
  if (/^[+-]?\s*R\$\s*[\d.,]+$/i.test(trimmed)) {
    return true;
  }

  // Codigos curtos puramente alfanumericos de referencia (ex: A, AB, NFE-123, 1.2.3)
  if (/^[A-Z]{1,3}$/.test(trimmed)) {
    return true;
  }

  return false;
}

function buildCacheKey(
  sourceLocale: AppLocale,
  targetLocale: AppLocale,
  text: string
): string {
  return `${sourceLocale}->${targetLocale}::${text}`;
}

function setCacheEntry(key: string, value: string): void {
  if (serverTranslationCache.size >= MAX_SERVER_CACHE_ENTRIES) {
    const oldestKey = serverTranslationCache.keys().next().value;
    if (oldestKey !== undefined) {
      serverTranslationCache.delete(oldestKey);
    }
  }
  serverTranslationCache.set(key, value);
}

function buildTranslationPrompt(
  batchPayload: Record<string, string>,
  sourceLocale: AppLocale,
  targetLocale: AppLocale,
  context?: string
): string {
  const sourceName =
    sourceLocale === "pt-BR" ? "Brazilian Portuguese" : "US English";
  const targetName =
    targetLocale === "pt-BR" ? "Brazilian Portuguese" : "US English";
  const contextLine = context
    ? `Document context: ${context}.`
    : "Document context: STEM Racing team management and engineering portfolio PDF.";

  return [
    `Translate the JSON values from ${sourceName} to clear, concise, professional ${targetName}.`,
    contextLine,
    "Rules:",
    "- Return ONLY a valid JSON object with the exact same numeric string keys.",
    "- Keep proper nouns unchanged (people's names, team names, company/sponsor names).",
    "- Keep emails, URLs, NF-e codes, WBS codes (e.g. 1.1, 2.3.1), dates, and R$ currency values unchanged.",
    "- Preserve technical acronyms such as STEM, CAD, CNC, WBS, PERT, RACI, ROI, KPI, NF-e, PIX.",
    "- Keep translations concise so they fit cleanly in PDF table cells and cards.",
    "",
    JSON.stringify(batchPayload),
  ].join("\n");
}

function extractGeminiJsonText(responseBody: unknown): string | null {
  if (!responseBody || typeof responseBody !== "object") {
    return null;
  }

  const candidates = (responseBody as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const firstCandidate = candidates[0] as {
    content?: { parts?: Array<{ text?: unknown }> };
  };
  const parts = firstCandidate?.content?.parts;
  if (!Array.isArray(parts)) {
    return null;
  }

  const textPart = parts.find((part) => typeof part?.text === "string");
  return typeof textPart?.text === "string" ? textPart.text : null;
}

function parseJsonObjectSafely(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  const withoutFences = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed: unknown = JSON.parse(withoutFences);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

async function translateChunkWithGemini(params: {
  chunk: readonly string[];
  sourceLocale: AppLocale;
  targetLocale: AppLocale;
  context?: string;
  apiKey: string;
  model: string;
  fetchImpl: typeof fetch;
}): Promise<{
  ok: boolean;
  reason?: TranslationFallbackReason;
  translatedChunk: string[];
}> {
  const payload: Record<string, string> = {};
  params.chunk.forEach((text, index) => {
    payload[String(index)] = text;
  });

  const prompt = buildTranslationPrompt(
    payload,
    params.sourceLocale,
    params.targetLocale,
    params.context
  );

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    params.model
  )}:generateContent`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, GEMINI_REQUEST_TIMEOUT_MS);

  try {
    const response = await params.fetchImpl(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": params.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return {
        ok: false,
        reason: "PROVIDER_ERROR",
        translatedChunk: [...params.chunk],
      };
    }

    const body: unknown = await response.json();
    const rawText = extractGeminiJsonText(body);
    if (!rawText) {
      return {
        ok: false,
        reason: "INVALID_RESPONSE",
        translatedChunk: [...params.chunk],
      };
    }

    const parsed = parseJsonObjectSafely(rawText);
    if (!parsed) {
      return {
        ok: false,
        reason: "INVALID_RESPONSE",
        translatedChunk: [...params.chunk],
      };
    }

    const translatedChunk = params.chunk.map((original, index) => {
      const candidate = parsed[String(index)];
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return sanitizePdfText(candidate);
      }
      return sanitizePdfText(original);
    });

    return {
      ok: true,
      translatedChunk,
    };
  } catch {
    return {
      ok: false,
      reason: "NETWORK_ERROR",
      translatedChunk: [...params.chunk],
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function translateTextsWithGemini({
  texts,
  sourceLocale = "pt-BR",
  targetLocale = "en-US",
  context,
  apiKey = process.env.GEMINI_API_KEY,
  model = process.env.GEMINI_TRANSLATION_MODEL ||
    DEFAULT_GEMINI_TRANSLATION_MODEL,
  fetchImpl = fetch,
}: TranslateWithGeminiParams): Promise<TranslateWithGeminiResult> {
  if (texts.length === 0 || sourceLocale === targetLocale) {
    return {
      ok: true,
      fallback: false,
      translations: texts.map((text) => sanitizePdfText(text)),
    };
  }

  const trimmedApiKey = (apiKey ?? "").trim();
  const resolvedMap = new Map<string, string>();
  const pendingUnique: string[] = [];
  const seenPending = new Set<string>();

  for (const original of texts) {
    if (shouldSkipDynamicTranslation(original)) {
      resolvedMap.set(original, sanitizePdfText(original));
      continue;
    }

    const cacheKey = buildCacheKey(sourceLocale, targetLocale, original);
    const cached = serverTranslationCache.get(cacheKey);
    if (cached !== undefined) {
      resolvedMap.set(original, cached);
      continue;
    }

    if (!seenPending.has(original)) {
      seenPending.add(original);
      pendingUnique.push(original);
    }
  }

  if (pendingUnique.length === 0) {
    return {
      ok: true,
      fallback: false,
      translations: texts.map(
        (text) => resolvedMap.get(text) ?? sanitizePdfText(text)
      ),
    };
  }

  if (!trimmedApiKey) {
    return {
      ok: false,
      fallback: true,
      reason: "MISSING_API_KEY",
      translations: texts.map(
        (text) => resolvedMap.get(text) ?? sanitizePdfText(text)
      ),
    };
  }

  const resolvedModel =
    (model ?? "").trim() || DEFAULT_GEMINI_TRANSLATION_MODEL;
  let hadFallback = false;
  let lastReason: TranslationFallbackReason | undefined;

  for (let i = 0; i < pendingUnique.length; i += MAX_GEMINI_BATCH_SIZE) {
    const chunk = pendingUnique.slice(i, i + MAX_GEMINI_BATCH_SIZE);
    const chunkResult = await translateChunkWithGemini({
      chunk,
      sourceLocale,
      targetLocale,
      context,
      apiKey: trimmedApiKey,
      model: resolvedModel,
      fetchImpl,
    });

    if (!chunkResult.ok) {
      hadFallback = true;
      lastReason = chunkResult.reason;
      chunk.forEach((original) => {
        resolvedMap.set(original, sanitizePdfText(original));
      });
      continue;
    }

    chunk.forEach((original, idx) => {
      const translated =
        chunkResult.translatedChunk[idx] ?? sanitizePdfText(original);
      resolvedMap.set(original, translated);
      setCacheEntry(
        buildCacheKey(sourceLocale, targetLocale, original),
        translated
      );
    });
  }

  return {
    ok: !hadFallback,
    fallback: hadFallback,
    reason: lastReason,
    translations: texts.map(
      (text) => resolvedMap.get(text) ?? sanitizePdfText(text)
    ),
  };
}
