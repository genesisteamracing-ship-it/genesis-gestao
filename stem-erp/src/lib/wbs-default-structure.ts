import { createHash } from "node:crypto";
import type { WbsNode } from "@prisma/client";
import { getNextChildCode, normalizeWbsCode } from "./wbs-code-generator";

type StructureNode = Pick<WbsNode, "id" | "teamId" | "parentId" | "code" | "title" | "discipline" | "depth" | "sortOrder">;
type DefaultCard = {
  title: string;
  aliases?: string[];
  discipline?: WbsNode["discipline"];
};
type Sector = DefaultCard & {
  code: string;
  discipline: WbsNode["discipline"];
  children: DefaultCard[];
};

const sectors: Sector[] = [
  {
    code: "1", title: "PROJECT MANAGEMENT", discipline: "PROJECT_MANAGEMENT", aliases: ["Gestão de Projetos", "Gestão do Projeto"],
    children: [
      { title: "INITIATING", aliases: ["Iniciação"] },
      { title: "PLANNING", aliases: ["Planejamento"] },
      { title: "EXECUTING AND CONTROLLING", aliases: ["Execução e Controle"] },
    ],
  },
  {
    code: "2", title: "ENGINEERING", discipline: "ENGINEERING_CAD", aliases: ["Engenharia", "Engennering"],
    children: [
      { title: "CAD AND TEST", aliases: ["CAD e Testes"] },
      { title: "MANUFACTURING", discipline: "MANUFACTURING_CNC", aliases: ["Manufatura", "Manufac Turing"] },
      { title: "DESIGN AND PAINT", aliases: ["Design e Pintura"] },
    ],
  },
  {
    code: "3", title: "ENTERPRISE", discipline: "MARKETING_SPONSOR", aliases: ["Empreendimento", "Empreendimento e Marketing", "Empreendimento & Marketing", "Enterprise and Marketing"],
    children: [{ title: "MARKETING" }],
  },
  {
    code: "4", title: "SOCIAL PROJECT", discipline: "SOCIAL_PROJECT", aliases: ["Projeto Social"],
    children: [{ title: "PLANNING", aliases: ["Planejamento"] }, { title: "EXECUTING", aliases: ["Execução"] }],
  },
];

function comparable(title: string): string {
  return title.normalize("NFD").replace(/\p{M}/gu, "").trim().toUpperCase().replace(/\s+/g, " ");
}

export function planWbsDefaults(teamId: string, existing: StructureNode[]): StructureNode[] {
  const nodes = existing.filter((node) => node.teamId === teamId);
  const occupied = new Set(nodes.map(({ code }) => normalizeWbsCode(code)));
  const additions: StructureNode[] = [];

  function resolveCard(
    card: DefaultCard,
    key: string,
    preferredCode: string,
    discipline: WbsNode["discipline"],
    parent: StructureNode | null,
  ): StructureNode {
    const id = "wbs-base-" + createHash("sha256").update(JSON.stringify([teamId, key])).digest("hex").slice(0, 32);
    const parentId = parent?.id ?? null;
    const names = new Set([card.title, ...(card.aliases ?? [])].map(comparable));
    const current = nodes.find((node) => node.id === id) ??
      nodes.find((node) => node.parentId === parentId && names.has(comparable(node.title)));
    if (current) return current;

    const code = occupied.has(preferredCode)
      ? getNextChildCode(parent?.code ?? preferredCode, [...occupied])
      : preferredCode;
    const node = {
      id, teamId, parentId, code, title: card.title, discipline,
      depth: parent ? parent.depth + 1 : 1,
      sortOrder: 0,
    };
    occupied.add(code);
    additions.push(node);
    return node;
  }

  for (const sector of sectors) {
    const root = resolveCard(sector, sector.code, sector.code, sector.discipline, null);
    sector.children.forEach((card, index) => {
      const key = sector.code + "." + (index + 1);
      const code = normalizeWbsCode(root.code) + "." + (index + 1);
      resolveCard(card, key, code, card.discipline ?? sector.discipline, root);
    });
  }

  return additions;
}
