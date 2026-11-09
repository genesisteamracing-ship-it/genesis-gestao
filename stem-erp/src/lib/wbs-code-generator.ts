import type { DeliveryGroup } from "@prisma/client";

/**
 * Mapeamento oficial dos 4 grandes pilares STEM para seus códigos raiz:
 * - 1: Gestão de Projetos
 * - 2: Engenharia (CAD, CFD, Manufatura & CNC)
 * - 3: Empreendimento & Marketing (Captação, Patrocínio, Pit Display & Estande)
 * - 4: Projeto Social
 */
export const DISCIPLINE_ROOT_CODES: Record<DeliveryGroup, string> = {
  PROJECT_MANAGEMENT: "1",
  ENGINEERING_CAD: "2",
  MANUFACTURING_CNC: "2",
  MARKETING_SPONSOR: "3",
  PIT_DISPLAY: "3",
  SOCIAL_PROJECT: "4",
};

export interface DisciplineSelectOption {
  value: DeliveryGroup;
  label: string;
  codePrefix: string;
}

export const DISCIPLINE_SELECT_OPTIONS: DisciplineSelectOption[] = [
  {
    value: "PROJECT_MANAGEMENT",
    label: "1. Gestão de Projetos",
    codePrefix: "1",
  },
  {
    value: "ENGINEERING_CAD",
    label: "2. Engenharia (CAD & Aerodinâmica)",
    codePrefix: "2",
  },
  {
    value: "MANUFACTURING_CNC",
    label: "2. Engenharia (Manufatura & Usinagem CNC)",
    codePrefix: "2",
  },
  {
    value: "MARKETING_SPONSOR",
    label: "3. Empreendimento & Marketing (Patrocínios)",
    codePrefix: "3",
  },
  {
    value: "PIT_DISPLAY",
    label: "3. Empreendimento & Marketing (Pit Display & Estande)",
    codePrefix: "3",
  },
  {
    value: "SOCIAL_PROJECT",
    label: "4. Projeto Social",
    codePrefix: "4",
  },
];

/**
 * Interface estrita para nós da árvore ao extrair códigos EAP.
 */
export interface WbsCodeNode {
  code: string;
  children?: WbsCodeNode[];
}

/**
 * Normaliza códigos legados (como "1.0") para "1", mantendo consistência na hierarquia.
 */
export function normalizeWbsCode(code: string): string {
  if (code.endsWith(".0")) {
    return code.slice(0, -2);
  }
  return code;
}

/**
 * Coleta recursivamente todos os códigos existentes em uma lista de nós da WBS.
 */
export function collectAllWbsCodes(nodes: WbsCodeNode[]): string[] {
  const codes: string[] = [];

  function walk(list: WbsCodeNode[]) {
    for (const item of list) {
      if (item.code) {
        codes.push(item.code);
        codes.push(normalizeWbsCode(item.code));
      }
      if (item.children && Array.isArray(item.children)) {
        walk(item.children);
      }
    }
  }

  walk(nodes);
  return Array.from(new Set(codes));
}

/**
 * Calcula o próximo código sugerido para um sub-entregável dado um nó pai.
 * Ex: pai "1" com sem filhos -> "1.1"
 * Ex: pai "1" com filhos ["1.1", "1.2"] -> "1.3"
 * Ex: pai "2.1" com filhos ["2.1.1"] -> "2.1.2"
 * Ex: pai "3.1.2" sem filhos -> "3.1.2.1"
 */
export function getNextChildCode(
  parentCode: string,
  existingChildCodes: string[] = []
): string {
  const normalizedParent = normalizeWbsCode(parentCode);
  const prefix = `${normalizedParent}.`;

  const existingIndices = existingChildCodes
    .map((c) => normalizeWbsCode(c))
    .filter((code) => code.startsWith(prefix))
    .map((code) => {
      const rest = code.slice(prefix.length);
      const firstSegment = rest.split(".")[0];
      const parsed = Number.parseInt(firstSegment, 10);
      return Number.isNaN(parsed) ? 0 : parsed;
    });

  const nextIndex =
    existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1;
  return `${prefix}${nextIndex}`;
}

/**
 * Calcula o código sugerido para um entregável raiz baseado na disciplina selecionada.
 * - Setor 1 (Gestão de Projetos): sugere "1" se não existir; se "1" já existir, sugere "1.1", "1.2", etc.
 * - Setor 2 (Engenharia): sugere "2" se não existir; se "2" já existir, sugere "2.1", "2.2", etc.
 * - Setor 3 (Empreendimento & Marketing): sugere "3" se não existir; se "3" já existir, sugere "3.1", etc.
 * - Setor 4 (Projeto Social): sugere "4" se não existir; se "4" já existir, sugere "4.1", etc.
 */
export function getSuggestedCodeForDiscipline(
  discipline: DeliveryGroup,
  allExistingCodes: string[] = []
): string {
  const rootPrefix = DISCIPLINE_ROOT_CODES[discipline] || "1";
  const normalizedList = allExistingCodes.map((c) => normalizeWbsCode(c));

  // Verifica se o nó raiz "1", "2", "3" ou "4" já existe
  const hasDirectRoot = normalizedList.includes(rootPrefix);

  if (!hasDirectRoot) {
    return rootPrefix;
  }

  // Se o nó raiz direto já existe na árvore, sugere o próximo sub-entregável do setor: "1.1", "2.1", etc.
  return getNextChildCode(rootPrefix, allExistingCodes);
}
