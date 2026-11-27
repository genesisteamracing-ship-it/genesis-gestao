export const MIN_CONTINGENCY_PLANS = 2;
export const MAX_CONTINGENCY_PLANS = 10;

const PLAN_HEADER_REGEX = /^Plano\s+([A-Z])\s*:\s*(.*)$/i;

export function getContingencyPlanLetter(index: number): string {
  const safeIndex = Math.max(0, Math.min(25, Math.trunc(index)));
  return String.fromCharCode(65 + safeIndex);
}

export function getContingencyPlanLabel(index: number): string {
  return `Plano ${getContingencyPlanLetter(index)}`;
}

/**
 * Converte o texto salvo em `RiskItem.contingencyPlan` para uma lista de planos (A, B, C...).
 * Suporta formato estruturado ("Plano A: ...\nPlano B: ...") e registros legados em texto livre.
 */
export function parseContingencyPlans(
  raw: string | null | undefined
): string[] {
  if (!raw || !raw.trim()) {
    return [];
  }

  const lines = raw.split(/\r?\n/);
  const parsed: string[] = [];
  let hasStructuredHeaders = false;
  let currentBuffer: string[] | null = null;

  for (const line of lines) {
    const match = line.match(PLAN_HEADER_REGEX);
    if (match) {
      hasStructuredHeaders = true;
      if (currentBuffer !== null) {
        parsed.push(currentBuffer.join("\n").trim());
      }
      const firstLineContent = match[2]?.trim() ?? "";
      currentBuffer = firstLineContent ? [firstLineContent] : [];
    } else if (currentBuffer !== null) {
      currentBuffer.push(line);
    }
  }

  if (hasStructuredHeaders) {
    if (currentBuffer !== null) {
      parsed.push(currentBuffer.join("\n").trim());
    }
    return parsed;
  }

  return [raw.trim()];
}

/**
 * Garante ao menos MIN_CONTINGENCY_PLANS slots (Plano A e Plano B) para exibição no formulário.
 */
export function ensureMinimumContingencyPlans(plans: string[]): string[] {
  const result = [...plans];
  while (result.length < MIN_CONTINGENCY_PLANS) {
    result.push("");
  }
  return result;
}

/**
 * Serializa os planos de contingência em uma string padronizada ("Plano A: ...\nPlano B: ...").
 */
export function serializeContingencyPlans(plans: string[]): string {
  const cleaned = plans.map((plan) => plan.trim()).filter(Boolean);
  if (cleaned.length === 0) {
    return "";
  }

  return cleaned
    .map((text, index) => `${getContingencyPlanLabel(index)}: ${text}`)
    .join("\n");
}
