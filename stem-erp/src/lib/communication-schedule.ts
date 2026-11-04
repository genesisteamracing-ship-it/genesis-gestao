import { COMMUNICATION_FREQUENCY_LABELS } from "./communication-constants";
import type {
  CalendarDayScheduleDTO,
  CommunicationFrequency,
  MonthlyScheduleCalendarDTO,
  ScheduledReportItemDTO,
  StakeholderGroup,
  StakeholderWithRelations,
} from "@/types/communication";

export const SCHEDULED_REPORT_DEFAULT_TITLE = "Relatório Executivo Completo";

export interface SchedulableStakeholderInput {
  id: string;
  name: string;
  organization: string | null;
  group: StakeholderGroup;
  email: string | null;
  preferredFrequency: CommunicationFrequency;
  createdAt: Date | string;
}

const MONTH_NAMES_PT_BR = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Converte uma data para chave canônica "YYYY-MM-DD" preservando ano/mês/dia UTC.
 */
export function formatDateKeyUTC(year: number, monthZeroBased: number, day: number): string {
  const yyyy = String(year).padStart(4, "0");
  const mm = String(monthZeroBased + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Extrai { year, month, day } normalizado de um Date ou string ISO.
 */
export function extractYearMonthDay(input: Date | string): {
  year: number;
  month: number;
  day: number;
} {
  if (typeof input === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(input.trim());
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]) - 1,
        day: Number(match[3]),
      };
    }
  }
  const d = input instanceof Date ? input : new Date(input);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
  };
}

/**
 * Retorna o último dia de um determinado mês (28, 29, 30 ou 31).
 */
export function getDaysInMonth(year: number, monthZeroBased: number): number {
  return new Date(Date.UTC(year, monthZeroBased + 1, 0)).getUTCDate();
}

/**
 * Projeta todas as ocorrências de envio automático de Relatório Executivo Completo
 * para um stakeholder específico dentro do mês/ano alvo (monthZeroBased: 0..11).
 *
 * Regra de negócio:
 * - A partir da data de cadastro (`createdAt`), o primeiro envio automático ocorre após 1 ciclo
 *   da periodicidade configurada (`occurrenceNumber >= 1`).
 * - Exemplo: cadastrado dia 04 com periodicidade Semanal (`WEEKLY`) ->
 *   1º envio dia 11 (+7 dias), 2º envio dia 18 (+14 dias), 3º envio dia 25 (+21 dias)...
 */
export function projectStakeholderSchedulesInMonth(
  stakeholder: SchedulableStakeholderInput,
  targetYear: number,
  targetMonthZeroBased: number
): ScheduledReportItemDTO[] {
  const base = extractYearMonthDay(stakeholder.createdAt);
  const baseUtcMs = Date.UTC(base.year, base.month, base.day);
  const registeredAtIso = formatDateKeyUTC(base.year, base.month, base.day);
  const frequency = stakeholder.preferredFrequency;
  const frequencyLabel = COMMUNICATION_FREQUENCY_LABELS[frequency] ?? "Mensal";

  const results: ScheduledReportItemDTO[] = [];

  if (frequency === "WEEKLY" || frequency === "BIWEEKLY") {
    const stepDays = frequency === "WEEKLY" ? 7 : 14;
    const daysInTargetMonth = getDaysInMonth(targetYear, targetMonthZeroBased);

    for (let day = 1; day <= daysInTargetMonth; day++) {
      const candidateUtcMs = Date.UTC(targetYear, targetMonthZeroBased, day);
      const diffDays = Math.round((candidateUtcMs - baseUtcMs) / MS_PER_DAY);

      // O envio automático ocorre nos ciclos futuros (diffDays >= stepDays) múltiplos exatos do intervalo
      if (diffDays >= stepDays && diffDays % stepDays === 0) {
        const occurrenceNumber = diffDays / stepDays;
        const dateKey = formatDateKeyUTC(targetYear, targetMonthZeroBased, day);

        results.push({
          id: `${stakeholder.id}-${dateKey}`,
          stakeholderId: stakeholder.id,
          stakeholderName: stakeholder.name,
          organization: stakeholder.organization ?? null,
          group: stakeholder.group,
          recipientEmail: stakeholder.email ?? null,
          frequency,
          frequencyLabel,
          registeredAtIso,
          scheduledDateKey: dateKey,
          reportTitle: SCHEDULED_REPORT_DEFAULT_TITLE,
          occurrenceNumber,
        });
      }
    }

    return results;
  }

  // Periodicidades baseadas em meses: MONTHLY (1), BIMONTHLY (2), QUARTERLY (3), MILESTONE_EVENT (1)
  const stepMonths =
    frequency === "BIMONTHLY"
      ? 2
      : frequency === "QUARTERLY"
      ? 3
      : 1;

  const diffMonths = (targetYear - base.year) * 12 + (targetMonthZeroBased - base.month);

  if (diffMonths >= stepMonths && diffMonths % stepMonths === 0) {
    const occurrenceNumber = diffMonths / stepMonths;
    const maxDayInMonth = getDaysInMonth(targetYear, targetMonthZeroBased);
    const scheduledDay = Math.min(base.day, maxDayInMonth);
    const dateKey = formatDateKeyUTC(targetYear, targetMonthZeroBased, scheduledDay);

    results.push({
      id: `${stakeholder.id}-${dateKey}`,
      stakeholderId: stakeholder.id,
      stakeholderName: stakeholder.name,
      organization: stakeholder.organization ?? null,
      group: stakeholder.group,
      recipientEmail: stakeholder.email ?? null,
      frequency,
      frequencyLabel,
      registeredAtIso,
      scheduledDateKey: dateKey,
      reportTitle: SCHEDULED_REPORT_DEFAULT_TITLE,
      occurrenceNumber,
    });
  }

  return results;
}

/**
 * Calcula a próxima data de envio automático para um stakeholder a partir de uma data de referência (`referenceDate`).
 */
export function getNextStakeholderScheduleDate(
  stakeholder: SchedulableStakeholderInput,
  referenceDate: Date | string = new Date()
): { dateKey: string; occurrenceNumber: number } {
  const base = extractYearMonthDay(stakeholder.createdAt);
  const ref = extractYearMonthDay(referenceDate);
  const baseUtcMs = Date.UTC(base.year, base.month, base.day);
  const refUtcMs = Date.UTC(ref.year, ref.month, ref.day);
  const frequency = stakeholder.preferredFrequency;

  if (frequency === "WEEKLY" || frequency === "BIWEEKLY") {
    const stepDays = frequency === "WEEKLY" ? 7 : 14;
    const diffDays = Math.floor((refUtcMs - baseUtcMs) / MS_PER_DAY);
    const nextOccurrence = diffDays < stepDays ? 1 : Math.floor(diffDays / stepDays) + 1;
    const nextUtc = new Date(baseUtcMs + nextOccurrence * stepDays * MS_PER_DAY);

    return {
      dateKey: formatDateKeyUTC(
        nextUtc.getUTCFullYear(),
        nextUtc.getUTCMonth(),
        nextUtc.getUTCDate()
      ),
      occurrenceNumber: nextOccurrence,
    };
  }

  const stepMonths =
    frequency === "BIMONTHLY"
      ? 2
      : frequency === "QUARTERLY"
      ? 3
      : 1;

  let occurrence = 1;
  while (occurrence <= 240) {
    const totalMonths = base.month + occurrence * stepMonths;
    const targetYear = base.year + Math.floor(totalMonths / 12);
    const targetMonth = totalMonths % 12;
    const scheduledDay = Math.min(base.day, getDaysInMonth(targetYear, targetMonth));
    const candidateMs = Date.UTC(targetYear, targetMonth, scheduledDay);

    if (candidateMs >= refUtcMs) {
      return {
        dateKey: formatDateKeyUTC(targetYear, targetMonth, scheduledDay),
        occurrenceNumber: occurrence,
      };
    }
    occurrence++;
  }

  return {
    dateKey: formatDateKeyUTC(ref.year, ref.month, ref.day),
    occurrenceNumber: 1,
  };
}

/**
 * Constrói a grade de 35 dias (5 semanas x 7 colunas = 5 linhas, Domingo a Sábado)
 * do calendário mensal de Agendamentos de Comunicação.
 */
export function buildMonthlyScheduleCalendar(
  stakeholders: ReadonlyArray<SchedulableStakeholderInput | StakeholderWithRelations>,
  year: number,
  monthZeroBased: number,
  todayReference: Date | string = new Date()
): MonthlyScheduleCalendarDTO {
  const today = extractYearMonthDay(todayReference);
  const todayKey = formatDateKeyUTC(today.year, today.month, today.day);

  // Mapa de agendamentos no mês alvo e nos meses adjacentes visíveis na grade
  const scheduleByDateKey = new Map<string, ScheduledReportItemDTO[]>();

  const prevMonthYear = monthZeroBased === 0 ? year - 1 : year;
  const prevMonth = monthZeroBased === 0 ? 11 : monthZeroBased - 1;
  const nextMonthYear = monthZeroBased === 11 ? year + 1 : year;
  const nextMonth = monthZeroBased === 11 ? 0 : monthZeroBased + 1;

  const visibleMonths = [
    { y: prevMonthYear, m: prevMonth },
    { y: year, m: monthZeroBased },
    { y: nextMonthYear, m: nextMonth },
  ];

  for (const st of stakeholders) {
    for (const vm of visibleMonths) {
      const items = projectStakeholderSchedulesInMonth(st, vm.y, vm.m);
      for (const item of items) {
        const list = scheduleByDateKey.get(item.scheduledDateKey) ?? [];
        list.push(item);
        scheduleByDateKey.set(item.scheduledDateKey, list);
      }
    }
  }

  const firstDayOfWeek = new Date(Date.UTC(year, monthZeroBased, 1)).getUTCDay(); // 0 (Dom) .. 6 (Sáb)
  const daysInCurrentMonth = getDaysInMonth(year, monthZeroBased);
  const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);

  const days: CalendarDayScheduleDTO[] = [];

  // 1. Dias finais do mês anterior para preencher o início da primeira semana
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const dateKey = formatDateKeyUTC(prevMonthYear, prevMonth, dayNum);
    const scheduledItems = scheduleByDateKey.get(dateKey) ?? [];
    days.push({
      dateKey,
      dayOfMonth: dayNum,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
      scheduledItems,
      hasScheduledReports: scheduledItems.length > 0,
    });
  }

  // 2. Dias do mês atual
  const upcomingItemsInMonth: ScheduledReportItemDTO[] = [];
  for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
    const dateKey = formatDateKeyUTC(year, monthZeroBased, dayNum);
    const scheduledItems = scheduleByDateKey.get(dateKey) ?? [];
    upcomingItemsInMonth.push(...scheduledItems);

    days.push({
      dateKey,
      dayOfMonth: dayNum,
      isCurrentMonth: true,
      isToday: dateKey === todayKey,
      scheduledItems,
      hasScheduledReports: scheduledItems.length > 0,
    });
  }

  // 3. Dias iniciais do próximo mês até completar 35 células (5 semanas = 5 linhas)
  const remainingCells = Math.max(0, 35 - days.length);
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
    const dateKey = formatDateKeyUTC(nextMonthYear, nextMonth, dayNum);
    const scheduledItems = scheduleByDateKey.get(dateKey) ?? [];
    days.push({
      dateKey,
      dayOfMonth: dayNum,
      isCurrentMonth: false,
      isToday: dateKey === todayKey,
      scheduledItems,
      hasScheduledReports: scheduledItems.length > 0,
    });
  }

  const finalDays = days.slice(0, 35);
  const monthName = MONTH_NAMES_PT_BR[monthZeroBased] ?? "Mês";

  return {
    year,
    month: monthZeroBased,
    monthLabel: `${monthName} de ${year}`,
    days: finalDays,
    totalScheduledInMonth: upcomingItemsInMonth.length,
    upcomingItemsInMonth,
  };
}
