import type { AppLocale } from "@/lib/i18n/locale-types";
import type { WbsTreeNode } from "@/types/wbs";

export type RgbColor = readonly [number, number, number];

export type WbsPdfNodeLevel = 0 | 1 | 2 | 3 | 4;

export interface WbsPdfNodePalette {
  fill: RgbColor;
  stroke: RgbColor;
  text: RgbColor;
  strokeWidth: number;
  fontWeight: "bold" | "normal";
  fontSize: number;
}

/**
 * Paleta Azul e Amarelo inspirada no diagrama WBS de referência,
 * substituindo os tons de verde por azul marinho, azul principal e amarelo ouro.
 */
export const WBS_PDF_PALETTE: Record<WbsPdfNodeLevel, WbsPdfNodePalette> = {
  0: {
    fill: [15, 61, 140], // Azul marinho profundo (#0F3D8C)
    stroke: [10, 42, 102],
    text: [255, 255, 255],
    strokeWidth: 0.45,
    fontWeight: "bold",
    fontSize: 11,
  },
  1: {
    fill: [29, 95, 214], // Azul principal (#1D5FD6)
    stroke: [21, 74, 173],
    text: [255, 255, 255],
    strokeWidth: 0.4,
    fontWeight: "bold",
    fontSize: 9,
  },
  2: {
    fill: [245, 196, 40], // Amarelo ouro (#F5C428)
    stroke: [202, 152, 14],
    text: [15, 41, 82], // Azul marinho escuro para alto contraste
    strokeWidth: 0.4,
    fontWeight: "bold",
    fontSize: 8,
  },
  3: {
    fill: [255, 255, 255], // Branco com borda azul (pacotes de trabalho)
    stroke: [29, 95, 214],
    text: [30, 41, 59],
    strokeWidth: 0.38,
    fontWeight: "normal",
    fontSize: 7.4,
  },
  4: {
    fill: [255, 251, 235], // Amarelo claríssimo para subníveis profundos (4+)
    stroke: [202, 152, 14],
    text: [30, 41, 59],
    strokeWidth: 0.35,
    fontWeight: "normal",
    fontSize: 7,
  },
};

export const WBS_PDF_CONNECTOR_COLOR: RgbColor = [51, 65, 85];
export const WBS_PDF_MUTED_TEXT_COLOR: RgbColor = [100, 116, 139];

export const WBS_PDF_PAGE = {
  minWidth: 297, // Mínimo A4 Paisagem (mm) — expande na horizontal conforme necessário
  minHeight: 210, // Mínimo A4 Paisagem (mm) — expande na vertical conforme necessário
  marginX: 16,
  marginTop: 14,
  marginBottom: 18,
} as const;

export interface WbsPdfBox {
  id: string;
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  chamfer: number;
  level: WbsPdfNodeLevel;
  lines: string[];
  code?: string;
}

export interface WbsPdfLine {
  page: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface WbsPdfLayoutResult {
  pageCount: number;
  pageWidth: number;
  pageHeight: number;
  boxes: WbsPdfBox[];
  lines: WbsPdfLine[];
  totalNodes: number;
}

export interface ComputeWbsPdfLayoutParams {
  tree: WbsTreeNode[];
  teamName?: string;
  /**
   * Função opcional de quebra de texto por largura em mm (ex: jsPDF.splitTextToSize).
   * Quando omitida (ex: em testes unitários), utiliza uma estimativa determinística.
   */
  wrapText?: (text: string, maxWidthMm: number, fontSizePt: number) => string[];
}

const COL_WIDTH = 44;
const COL_GAP = 4.5;
const SECTOR_GAP = 9.5;
const EMPTY_SECTOR_WIDTH = 48;
const ROOT_MIN_HEIGHT = 12;
const LEVEL1_MIN_HEIGHT = 9.5;
const LEVEL2_MIN_HEIGHT = 8.5;
const LEVEL3_MIN_HEIGHT = 7.6;
const LEVEL4_MIN_HEIGHT = 7;
const LEVEL3_VERTICAL_GAP = 2.6;
const LEVEL4_INDENT = 4;
const BUS_DROP_TOP = 5;
const BUS_DROP_BOTTOM = 5;

function defaultWrapText(text: string, maxWidthMm: number, fontSizePt: number): string[] {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return [""];
  const avgCharMm = Math.max(1.15, fontSizePt * 0.3528 * 0.54);
  const maxChars = Math.max(8, Math.floor(maxWidthMm / avgCharMm));

  const words = cleaned.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      if (word.length > maxChars) {
        let rest = word;
        while (rest.length > maxChars) {
          lines.push(rest.slice(0, maxChars));
          rest = rest.slice(maxChars);
        }
        current = rest;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

function formatNodeLabel(node: WbsTreeNode): string {
  const code = node.code?.trim();
  const title = node.title?.trim() || "Sem título";
  return code ? `${code}  ${title}` : title;
}

function computeBoxHeight(
  lines: string[],
  fontSizePt: number,
  minHeight: number,
  verticalPadding = 3.2
): number {
  const lineHeightMm = fontSizePt * 0.3528 * 1.28;
  const textHeight = Math.max(1, lines.length) * lineHeightMm;
  return Math.max(minHeight, Number((textHeight + verticalPadding).toFixed(2)));
}

interface FlattenedLeafItem {
  node: WbsTreeNode;
  level: 3 | 4;
  indent: number;
  lines: string[];
  height: number;
}

function flattenDescendants(
  children: WbsTreeNode[],
  colWidth: number,
  wrap: (text: string, maxWidthMm: number, fontSizePt: number) => string[]
): FlattenedLeafItem[] {
  const items: FlattenedLeafItem[] = [];

  function walk(list: WbsTreeNode[], nesting: number) {
    for (const child of list) {
      const level: 3 | 4 = nesting === 0 ? 3 : 4;
      const indent = nesting === 0 ? 0 : Math.min(nesting, 2) * LEVEL4_INDENT;
      const palette = WBS_PDF_PALETTE[level];
      const boxWidth = Math.max(22, colWidth - indent);
      const innerTextWidth = Math.max(14, boxWidth - 6);
      const lines = wrap(formatNodeLabel(child), innerTextWidth, palette.fontSize);
      const minH = level === 3 ? LEVEL3_MIN_HEIGHT : LEVEL4_MIN_HEIGHT;
      const height = computeBoxHeight(lines, palette.fontSize, minH, 2.8);

      items.push({
        node: child,
        level,
        indent,
        lines,
        height,
      });

      if (child.children.length > 0) {
        walk(child.children, nesting + 1);
      }
    }
  }

  walk(children, 0);
  return items;
}

function countTreeNodes(tree: WbsTreeNode[]): number {
  let count = 0;
  function walk(list: WbsTreeNode[]) {
    for (const item of list) {
      count += 1;
      if (item.children.length > 0) walk(item.children);
    }
  }
  walk(tree);
  return count;
}

interface PreparedLevel2Col {
  node: WbsTreeNode;
  lines: string[];
  height: number;
  descendants: FlattenedLeafItem[];
}

interface PreparedSector {
  node: WbsTreeNode;
  sectorWidth: number;
  level1Width: number;
  level1Lines: string[];
  level1Height: number;
  level2Cols: PreparedLevel2Col[];
}

/**
 * Calcula o layout completo da WBS em PÁGINA ÚNICA, expandindo automaticamente
 * a largura horizontal da página para comportar todos os setores lado a lado
 * e empilhando os pacotes de trabalho (Nível 3+) verticalmente para baixo.
 */
export function computeWbsPdfLayout({
  tree,
  teamName,
  wrapText = defaultWrapText,
}: ComputeWbsPdfLayoutParams): WbsPdfLayoutResult {
  if (tree.length === 0) {
    return {
      pageCount: 0,
      pageWidth: 0,
      pageHeight: 0,
      boxes: [],
      lines: [],
      totalNodes: 0,
    };
  }

  const boxes: WbsPdfBox[] = [];
  const lines: WbsPdfLine[] = [];
  const totalNodes = countTreeNodes(tree);

  // 1. Pré-calcula cada setor (Nível 1) e suas colunas de Nível 2 + pilhas Nível 3+
  const preparedSectors: PreparedSector[] = tree.map((sectorNode) => {
    const l2Count = sectorNode.children.length;
    const colsTotalWidth =
      l2Count > 0 ? l2Count * COL_WIDTH + (l2Count - 1) * COL_GAP : EMPTY_SECTOR_WIDTH;
    const sectorWidth = Math.max(EMPTY_SECTOR_WIDTH, colsTotalWidth);

    const level1Width = Math.min(Math.max(46, sectorWidth * 0.62), 82);
    const l1Palette = WBS_PDF_PALETTE[1];
    const level1Lines = wrapText(
      formatNodeLabel(sectorNode),
      level1Width - 7,
      l1Palette.fontSize
    );
    const level1Height = computeBoxHeight(
      level1Lines,
      l1Palette.fontSize,
      LEVEL1_MIN_HEIGHT,
      3.2
    );

    const level2Cols: PreparedLevel2Col[] = sectorNode.children.map((l2Node) => {
      const l2Palette = WBS_PDF_PALETTE[2];
      const l2Lines = wrapText(
        formatNodeLabel(l2Node),
        COL_WIDTH - 6,
        l2Palette.fontSize
      );
      const l2Height = computeBoxHeight(
        l2Lines,
        l2Palette.fontSize,
        LEVEL2_MIN_HEIGHT,
        3
      );
      const descendants = flattenDescendants(l2Node.children, COL_WIDTH, wrapText);

      return {
        node: l2Node,
        lines: l2Lines,
        height: l2Height,
        descendants,
      };
    });

    return {
      node: sectorNode,
      sectorWidth,
      level1Width,
      level1Lines,
      level1Height,
      level2Cols,
    };
  });

  // 2. Define largura total da página única expandindo na horizontal conforme necessário
  const totalSectorsWidth =
    preparedSectors.reduce((sum, s) => sum + s.sectorWidth, 0) +
    Math.max(0, preparedSectors.length - 1) * SECTOR_GAP;

  const pageWidth = Number(
    Math.max(WBS_PDF_PAGE.minWidth, totalSectorsWidth + WBS_PDF_PAGE.marginX * 2).toFixed(2)
  );
  const centerX = pageWidth / 2;
  const startX = (pageWidth - totalSectorsWidth) / 2;

  // 3. Nó Raiz (Nível 0) centralizado no topo
  const rootTitle = teamName?.trim()
    ? `${teamName.trim()} — Work Breakdown Structure`
    : "Work Breakdown Structure (WBS)";
  const rootWidth = Math.min(Math.max(125, totalSectorsWidth * 0.36), 210);
  const rootPalette = WBS_PDF_PALETTE[0];
  const rootLines = wrapText(rootTitle, rootWidth - 10, rootPalette.fontSize);
  const rootHeight = computeBoxHeight(rootLines, rootPalette.fontSize, ROOT_MIN_HEIGHT, 4);
  const rootX = centerX - rootWidth / 2;
  const rootY = WBS_PDF_PAGE.marginTop;

  boxes.push({
    id: "wbs-pdf-root",
    page: 1,
    x: rootX,
    y: rootY,
    width: rootWidth,
    height: rootHeight,
    chamfer: 3.2,
    level: 0,
    lines: rootLines,
  });

  // Coordenadas Y alinhadas por nível hierárquico
  const rootBottomY = rootY + rootHeight;
  const rootBusY = rootBottomY + BUS_DROP_TOP;
  const level1Y = rootBusY + BUS_DROP_BOTTOM;
  const maxLevel1Height = Math.max(...preparedSectors.map((s) => s.level1Height));
  const level2BusY = level1Y + maxLevel1Height + BUS_DROP_TOP;
  const level2Y = level2BusY + BUS_DROP_BOTTOM;

  const allLevel2Heights = preparedSectors.flatMap((s) => s.level2Cols.map((c) => c.height));
  const maxLevel2Height = allLevel2Heights.length > 0 ? Math.max(...allLevel2Heights) : 0;

  // 4. Posiciona os setores lado a lado na horizontal e empilha Nível 3+ para baixo
  let cursorX = startX;
  const sectorCenterXs: number[] = [];
  let maxBottomY = level1Y + maxLevel1Height;

  for (const sector of preparedSectors) {
    const sectorCenterX = cursorX + sector.sectorWidth / 2;
    sectorCenterXs.push(sectorCenterX);

    const level1X = sectorCenterX - sector.level1Width / 2;
    boxes.push({
      id: sector.node.id,
      page: 1,
      x: level1X,
      y: level1Y,
      width: sector.level1Width,
      height: sector.level1Height,
      chamfer: 2.5,
      level: 1,
      lines: sector.level1Lines,
      code: sector.node.code,
    });

    // Conector vertical do barramento raiz até o topo do Nível 1
    lines.push({
      page: 1,
      x1: sectorCenterX,
      y1: rootBusY,
      x2: sectorCenterX,
      y2: level1Y,
    });

    if (sector.level2Cols.length > 0) {
      const colsWidth =
        sector.level2Cols.length * COL_WIDTH +
        (sector.level2Cols.length - 1) * COL_GAP;
      const colsStartX = sectorCenterX - colsWidth / 2;

      // Tronco vertical descendo do fundo do Nível 1 até o barramento de Nível 2
      lines.push({
        page: 1,
        x1: sectorCenterX,
        y1: level1Y + sector.level1Height,
        x2: sectorCenterX,
        y2: level2BusY,
      });

      const colCenters: number[] = [];

      sector.level2Cols.forEach((col, colIdx) => {
        const colX = colsStartX + colIdx * (COL_WIDTH + COL_GAP);
        const colCenterX = colX + COL_WIDTH / 2;
        colCenters.push(colCenterX);

        // Perna vertical do barramento de Nível 2 até o topo do nó Nível 2
        lines.push({
          page: 1,
          x1: colCenterX,
          y1: level2BusY,
          x2: colCenterX,
          y2: level2Y,
        });

        boxes.push({
          id: col.node.id,
          page: 1,
          x: colX,
          y: level2Y,
          width: COL_WIDTH,
          height: col.height,
          chamfer: 2.2,
          level: 2,
          lines: col.lines,
          code: col.node.code,
        });

        // Empilha Nível 3+ verticalmente para baixo abaixo do seu Nível 2
        let itemY = level2Y + maxLevel2Height;
        let lastLevel3ConnectorY = level2Y + col.height;
        maxBottomY = Math.max(maxBottomY, level2Y + col.height);

        for (const item of col.descendants) {
          itemY += LEVEL3_VERTICAL_GAP;
          const boxX = colX + item.indent;
          const boxWidth = Math.max(22, COL_WIDTH - item.indent);

          if (item.level === 3) {
            lines.push({
              page: 1,
              x1: colCenterX,
              y1: lastLevel3ConnectorY,
              x2: colCenterX,
              y2: itemY + item.height / 2,
            });
            lastLevel3ConnectorY = itemY + item.height;
          } else {
            const branchX = colX + 2;
            lines.push(
              {
                page: 1,
                x1: branchX,
                y1: itemY - LEVEL3_VERTICAL_GAP,
                x2: branchX,
                y2: itemY + item.height / 2,
              },
              {
                page: 1,
                x1: branchX,
                y1: itemY + item.height / 2,
                x2: boxX,
                y2: itemY + item.height / 2,
              }
            );
          }

          boxes.push({
            id: item.node.id,
            page: 1,
            x: boxX,
            y: itemY,
            width: boxWidth,
            height: item.height,
            chamfer: 1.9,
            level: item.level,
            lines: item.lines,
            code: item.node.code,
          });

          itemY += item.height;
          maxBottomY = Math.max(maxBottomY, itemY);
        }
      });

      // Barra horizontal do Nível 2 abrangendo todas as colunas do setor
      const minColCenter = Math.min(sectorCenterX, ...colCenters);
      const maxColCenter = Math.max(sectorCenterX, ...colCenters);
      if (maxColCenter > minColCenter) {
        lines.push({
          page: 1,
          x1: minColCenter,
          y1: level2BusY,
          x2: maxColCenter,
          y2: level2BusY,
        });
      }
    }

    cursorX += sector.sectorWidth + SECTOR_GAP;
  }

  // Conector do Nível 0 descendo para o barramento horizontal principal
  lines.push({
    page: 1,
    x1: centerX,
    y1: rootBottomY,
    x2: centerX,
    y2: rootBusY,
  });

  if (sectorCenterXs.length > 0) {
    const minSectorX = Math.min(centerX, ...sectorCenterXs);
    const maxSectorX = Math.max(centerX, ...sectorCenterXs);
    if (maxSectorX > minSectorX) {
      lines.push({
        page: 1,
        x1: minSectorX,
        y1: rootBusY,
        x2: maxSectorX,
        y2: rootBusY,
      });
    }
  }

  const pageHeight = Number(
    Math.max(WBS_PDF_PAGE.minHeight, maxBottomY + WBS_PDF_PAGE.marginBottom).toFixed(2)
  );

  return {
    pageCount: 1,
    pageWidth,
    pageHeight,
    boxes,
    lines,
    totalNodes,
  };
}

/**
 * Gera um nome de arquivo limpo e padronizado para o PDF da WBS.
 */
export function buildWbsPdfFilename(
  teamName?: string,
  date = new Date(),
  locale: AppLocale = "pt-BR"
): string {
  const slug = (teamName || "equipe")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "equipe";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const prefix = locale === "en-US" ? "wbs-scope" : "wbs";

  return `${prefix}-${slug}-${yyyy}-${mm}-${dd}.pdf`;
}
