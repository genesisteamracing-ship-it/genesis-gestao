/**
 * Funções puras para o domínio de Temporada.
 * Toda a aritmética de datas é feita em UTC (RN8) para evitar deslocamento por fuso horário.
 */

export const SEASON_MAX_MONTHS = 24;
export const LEGACY_SEASON_MONTHS = 6;

const MONTH_ABBREVIATIONS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export interface SeasonMonth {
  index: number; // 1-based a partir do mês de início
  key: string; // YYYY-MM
  label: string; // "Ago/2025"
}

export const SEASON_LABEL_PATTERN = /^(\d{4})\/(\d{4})$/;

/** Converte "YYYY-MM-DD" (ou ISO) em Date UTC às 12:00Z. Retorna null se inválida. */
export function parseSeasonDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d), 12, 0, 0));
  return Number.isNaN(date.getTime()) ? null : date;
}

function monthSerial(date: Date): number {
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
}

export function countSeasonMonths(start: Date, end: Date): number {
  return monthSerial(end) - monthSerial(start) + 1;
}

/** RN2 e RN3. Retorna mensagem de erro ou null quando válido. */
export function validateSeasonRange(start: Date, end: Date): string | null {
  if (start.getTime() >= end.getTime()) {
    return "A data de fim deve ser posterior à data de início da temporada.";
  }
  if (countSeasonMonths(start, end) > SEASON_MAX_MONTHS) {
    return `A temporada pode ter no máximo ${SEASON_MAX_MONTHS} meses.`;
  }
  return null;
}

/** RN4: cada mês-calendário tocado pelo intervalo. */
export function buildSeasonMonths(start: Date, end: Date): SeasonMonth[] {
  const total = countSeasonMonths(start, end);
  const startSerial = monthSerial(start);

  return Array.from({ length: Math.max(0, total) }, (_, offset) => {
    const serial = startSerial + offset;
    const year = Math.floor(serial / 12);
    const month = serial % 12;
    return {
      index: offset + 1,
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: `${MONTH_ABBREVIATIONS[month]}/${year}`,
    };
  });
}

/** RN5/RN6: índice do mês da data dentro da temporada, ou null se estiver fora do intervalo. */
export function getSeasonMonthIndex(
  start: Date,
  end: Date,
  date: Date
): number | null {
  const startDay = Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate()
  );
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const day = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

  if (day < startDay || day > endDay) return null;
  return monthSerial(date) - monthSerial(start) + 1;
}

/** Opções de temporada ("2025/2026", "2026/2027", ...) a partir do ano base. */
export function buildSeasonOptions(
  baseYear: number = new Date().getFullYear() - 1,
  count = 6
): string[] {
  return Array.from({ length: count }, (_, i) => `${baseYear + i}/${baseYear + i + 1}`);
}

export function isValidSeasonLabel(label: string): boolean {
  const match = SEASON_LABEL_PATTERN.exec(label);
  if (!match) return false;
  return Number(match[2]) === Number(match[1]) + 1;
}

/** Fallback (seção 6 da spec): 6 meses a partir do mês de criação da equipe. */
export function buildLegacySeason(createdAt: Date): { start: Date; end: Date } {
  const start = new Date(
    Date.UTC(createdAt.getUTCFullYear(), createdAt.getUTCMonth(), 1, 12, 0, 0)
  );
  const end = new Date(
    Date.UTC(
      createdAt.getUTCFullYear(),
      createdAt.getUTCMonth() + LEGACY_SEASON_MONTHS,
      0,
      12,
      0,
      0
    )
  );
  return { start, end };
}

export function formatSeasonDateBR(date: Date): string {
  const d = String(date.getUTCDate()).padStart(2, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${date.getUTCFullYear()}`;
}
