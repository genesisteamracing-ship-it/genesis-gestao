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
    fontSize: 10.5,
  },
  1: {
    fill: [29, 95, 214], // Azul principal (#1D5FD6)
    stroke: [21, 74, 173],
    text: [255, 255, 255],
    strokeWidth: 0.4,
    fontWeight: "bold",
    fontSize: 9.2,
  },
  2: {
    fill: [245, 196, 40], // Amarelo ouro (#F5C428)
    stroke: [202, 152, 14],
    text: [15, 41, 82], // Azul marinho escuro para alto contraste
    strokeWidth: 0.4,
    fontWeight: "bold",
    fontSize: 8.2,
  },
  3: {
    fill: [255, 255, 255], // Branco com borda azul (pacotes de trabalho)
    stroke: [29, 95, 214],
    text: [30, 41, 59],
    strokeWidth: 0.38,
    fontWeight: "normal",
    fontSize: 7.6,
  },
  4: {
    fill: [255, 251, 235], // Amarelo claríssimo para subníveis profundos (4+)
    stroke: [202, 152, 14],
    text: [30, 41, 59],
    strokeWidth: 0.35,
    fontWeight: "normal",
    fontSize: 7.2,
  },
};

export const WBS_PDF_CONNECTOR_COLOR: RgbColor = [51, 65, 85];
export const WBS_PDF_MUTED_TEXT_COLOR: RgbColor = [100, 116, 139];

export const WBS_PDF_PAGE = {
  width: 210, // A4 Retrato (mm)
  height: 297,
  marginX: 14,
  marginTop: 14,
  marginBottom: 16,
  get contentWidth() {
    return this.width - this.marginX * 2; // 182mm
  },
  get contentBottom() {
    return this.height - this.marginBottom; // 281mm
  },
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

const MAX_LEVEL2_COLUMNS = 3;
const COLUMN_GAP = 6;
const ROOT_WIDTH = 140;
const ROOT_MIN_HEIGHT = 11.5;
const LEVEL1_WIDTH = 86;
const LEVEL1_MIN_HEIGHT = 9.5;
const LEVEL2_MIN_HEIGHT = 8.5;
const LEVEL3_MIN_HEIGHT = 7.8;
const LEVEL4_MIN_HEIGHT = 7.2;
const LEVEL3_VERTICAL_GAP = 2.6;
const LEVEL4_INDENT = 4.5;
const SECTION_GAP = 9;
const ROW_GAP = 7;
const BUS_DROP_TOP = 3.8;
const BUS_DROP_BOTTOM = 3.8;
const SPINE_X = 8.5;
const SECTION_SPINE_X = 11.5;

function defaultWrapText(text: string, maxWidthMm: number, fontSizePt: number): string[] {
  const cleaned = text.trim().replace(/\s+/g, " ");
  if (!cleaned) return [""];
  // Aproximação conservadora: ~0.52 * fontSizePt em pontos -> mm (1pt ≈ 0.3528mm)
  const avgCharMm = Math.max(1.2, fontSizePt * 0.3528 * 0.54);
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
      const boxWidth = Math.max(24, colWidth - indent);
      const innerTextWidth = Math.max(16, boxWidth - 6.5);
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

function chunkArray<T>(items: T[], size: number): T[][] {
  if (items.length <= size) return [items];
  // Para 4 itens, preferir 2 + 2 para maior equilíbrio visual
  if (items.length === 4 && size === 3) {
    return [items.slice(0, 2), items.slice(2, 4)];
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
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

function getColumnGeometry(colCount: number): { colWidth: number; startX: number; gap: number } {
  const { marginX, contentWidth } = WBS_PDF_PAGE;
  if (colCount <= 1) {
    const colWidth = 68;
    return { colWidth, startX: marginX + (contentWidth - colWidth) / 2, gap: 0 };
  }
  if (colCount === 2) {
    const colWidth = 66;
    const gap = 12;
    const total = colWidth * 2 + gap;
    return { colWidth, startX: marginX + (contentWidth - total) / 2, gap };
  }
  const colWidth = (contentWidth - COLUMN_GAP * (colCount - 1)) / colCount;
  return { colWidth, startX: marginX, gap: COLUMN_GAP };
}

/**
 * Calcula o layout completo da WBS crescendo verticalmente (para baixo)
 * em páginas A4 Retrato (210mm x 297mm), pronto para renderização vetorial no jsPDF.
 */
export function computeWbsPdfLayout({
  tree,
  teamName,
  wrapText = defaultWrapText,
}: ComputeWbsPdfLayoutParams): WbsPdfLayoutResult {
  if (tree.length === 0) {
    return {
      pageCount: 0,
      boxes: [],
      lines: [],
      totalNodes: 0,
    };
  }

  const boxes: WbsPdfBox[] = [];
  const lines: WbsPdfLine[] = [];
  const totalNodes = countTreeNodes(tree);

  const centerX = WBS_PDF_PAGE.width / 2;
  let currentPage = 1;
  let cursorY: number = WBS_PDF_PAGE.marginTop;

  // 1. Nó Raiz (Nível 0) no topo da Página 1
  const rootTitle = teamName?.trim()
    ? `${teamName.trim()} — Work Breakdown Structure`
    : "Work Breakdown Structure (WBS)";
  const rootPalette = WBS_PDF_PALETTE[0];
  const rootLines = wrapText(rootTitle, ROOT_WIDTH - 10, rootPalette.fontSize);
  const rootHeight = computeBoxHeight(rootLines, rootPalette.fontSize, ROOT_MIN_HEIGHT, 4);
  const rootX = centerX - ROOT_WIDTH / 2;

  boxes.push({
    id: "wbs-pdf-root",
    page: currentPage,
    x: rootX,
    y: cursorY,
    width: ROOT_WIDTH,
    height: rootHeight,
    chamfer: 3.2,
    level: 0,
    lines: rootLines,
  });

  // Braço saindo da base do Nível 0 até a espinha vertical principal (SPINE_X)
  const rootBottomY = cursorY + rootHeight;
  const rootBusY = rootBottomY + 3.5;
  lines.push(
    { page: currentPage, x1: centerX, y1: rootBottomY, x2: centerX, y2: rootBusY },
    { page: currentPage, x1: SPINE_X, y1: rootBusY, x2: centerX, y2: rootBusY }
  );

  // Rastreia último ponto da espinha vertical principal por página
  const pageSpineStartY = new Map<number, number>([[1, rootBusY]]);
  const pageSpineEndY = new Map<number, number>();

  cursorY = rootBusY + 4.5;

  function ensureSpace(neededHeight: number): boolean {
    if (cursorY + neededHeight <= WBS_PDF_PAGE.contentBottom) {
      return false;
    }
    if (cursorY <= WBS_PDF_PAGE.marginTop + 1) {
      return false;
    }
    currentPage += 1;
    cursorY = WBS_PDF_PAGE.marginTop;
    return true;
  }

  // 2. Percorre cada setor de Nível 1 crescendo verticalmente para baixo
  for (const level1Node of tree) {
    const level1Palette = WBS_PDF_PALETTE[1];
    const level1Lines = wrapText(
      formatNodeLabel(level1Node),
      LEVEL1_WIDTH - 8,
      level1Palette.fontSize
    );
    const level1Height = computeBoxHeight(
      level1Lines,
      level1Palette.fontSize,
      LEVEL1_MIN_HEIGHT,
      3.2
    );

    const level2Children = level1Node.children;
    const level2Chunks =
      level2Children.length > 0 ? chunkArray(level2Children, MAX_LEVEL2_COLUMNS) : [];

    // Pré-calcula a primeira faixa de filhos para evitar deixar o Nível 1 órfão no fim da página
    const firstChunkMinHeight =
      level2Chunks.length > 0
        ? BUS_DROP_TOP + BUS_DROP_BOTTOM + LEVEL2_MIN_HEIGHT + 16
        : 0;

    ensureSpace(level1Height + firstChunkMinHeight);

    const level1X = centerX - LEVEL1_WIDTH / 2;
    const level1Y = cursorY;
    const level1MidY = level1Y + level1Height / 2;

    boxes.push({
      id: level1Node.id,
      page: currentPage,
      x: level1X,
      y: level1Y,
      width: LEVEL1_WIDTH,
      height: level1Height,
      chamfer: 2.5,
      level: 1,
      lines: level1Lines,
      code: level1Node.code,
    });

    // Conecta espinha principal à borda esquerda do Nível 1
    if (!pageSpineStartY.has(currentPage)) {
      pageSpineStartY.set(currentPage, WBS_PDF_PAGE.marginTop - 4);
    }
    pageSpineEndY.set(currentPage, level1MidY);
    lines.push({
      page: currentPage,
      x1: SPINE_X,
      y1: level1MidY,
      x2: level1X,
      y2: level1MidY,
    });

    cursorY = level1Y + level1Height;

    // 3. Renderiza as faixas de Nível 2 + seus Nível 3+ empilhados para baixo
    for (let chunkIdx = 0; chunkIdx < level2Chunks.length; chunkIdx += 1) {
      const chunk = level2Chunks[chunkIdx];
      const { colWidth, startX, gap } = getColumnGeometry(chunk.length);

      // Pré-calcula caixas Nível 2 e pilhas Nível 3+ desta faixa
      const preparedCols = chunk.map((l2Node, colIdx) => {
        const colX = startX + colIdx * (colWidth + gap);
        const l2Palette = WBS_PDF_PALETTE[2];
        const l2Lines = wrapText(
          formatNodeLabel(l2Node),
          colWidth - 6.5,
          l2Palette.fontSize
        );
        const l2Height = computeBoxHeight(l2Lines, l2Palette.fontSize, LEVEL2_MIN_HEIGHT, 3);
        const descendants = flattenDescendants(l2Node.children, colWidth, wrapText);
        const descendantsHeight =
          descendants.length > 0
            ? descendants.reduce((sum, item) => sum + item.height, 0) +
              descendants.length * LEVEL3_VERTICAL_GAP
            : 0;

        return {
          l2Node,
          colX,
          colCenterX: colX + colWidth / 2,
          l2Lines,
          l2Height,
          descendants,
          totalColHeight: l2Height + descendantsHeight,
        };
      });

      const maxRowHeight = Math.max(...preparedCols.map((c) => c.totalColHeight));
      const connectorOverhead = BUS_DROP_TOP + BUS_DROP_BOTTOM;

      // Se a faixa inteira couber em uma página nova mas não na atual, quebra antes
      const movedToNewPage =
        chunkIdx > 0 || cursorY + connectorOverhead + maxRowHeight > WBS_PDF_PAGE.contentBottom
          ? ensureSpace(
              Math.min(
                connectorOverhead + maxRowHeight,
                WBS_PDF_PAGE.contentBottom - WBS_PDF_PAGE.marginTop
              )
            )
          : false;

      // Conector do Nível 1 (ou continuação) para o barramento horizontal desta faixa
      const busY = cursorY + BUS_DROP_TOP;
      const firstCenterX = preparedCols[0].colCenterX;
      const lastCenterX = preparedCols[preparedCols.length - 1].colCenterX;

      if (chunkIdx === 0 && !movedToNewPage) {
        // Linha descendo do centro do Nível 1 até o barramento
        lines.push({
          page: currentPage,
          x1: centerX,
          y1: level1Y + level1Height,
          x2: centerX,
          y2: busY,
        });
        // Barra horizontal abrangendo do centro do Nível 1 a todas as colunas
        const busLeft = Math.min(firstCenterX, centerX);
        const busRight = Math.max(lastCenterX, centerX);
        if (busRight > busLeft) {
          lines.push({
            page: currentPage,
            x1: busLeft,
            y1: busY,
            x2: busRight,
            y2: busY,
          });
        }
      } else {
        // Continuação de faixa (2ª faixa de Nível 2 ou nova página)
        const busLeft = Math.min(firstCenterX, SECTION_SPINE_X);
        const busRight = lastCenterX;
        lines.push({
          page: currentPage,
          x1: busLeft,
          y1: busY,
          x2: busRight,
          y2: busY,
        });
        if (!movedToNewPage) {
          // Conecta verticalmente à barra da faixa anterior na margem interna da seção
          lines.push({
            page: currentPage,
            x1: SECTION_SPINE_X,
            y1: Math.max(WBS_PDF_PAGE.marginTop, cursorY - ROW_GAP),
            x2: SECTION_SPINE_X,
            y2: busY,
          });
        }
      }

      const rowTopY = busY + BUS_DROP_BOTTOM;
      let maxReachedY = rowTopY;
      let maxReachedPage = currentPage;

      // Desenha cada coluna (Nível 2 no topo + Nível 3+ empilhados verticalmente para baixo)
      for (const col of preparedCols) {
        // Linha vertical do barramento até o topo do nó Nível 2
        lines.push({
          page: currentPage,
          x1: col.colCenterX,
          y1: busY,
          x2: col.colCenterX,
          y2: rowTopY,
        });

        boxes.push({
          id: col.l2Node.id,
          page: currentPage,
          x: col.colX,
          y: rowTopY,
          width: colWidth,
          height: col.l2Height,
          chamfer: 2.2,
          level: 2,
          lines: col.l2Lines,
          code: col.l2Node.code,
        });

        let itemPage = currentPage;
        let itemY = rowTopY + col.l2Height;
        let lastLevel3ConnectorY = itemY;

        for (const item of col.descendants) {
          const nextY = itemY + LEVEL3_VERTICAL_GAP;

          // Paginação defensiva se uma única coluna ultrapassar o limite da página
          if (nextY + item.height > WBS_PDF_PAGE.contentBottom) {
            itemPage += 1;
            itemY = WBS_PDF_PAGE.marginTop;
            lastLevel3ConnectorY = itemY;
          } else {
            itemY = nextY;
          }

          const boxX = col.colX + item.indent;
          const boxWidth = Math.max(24, colWidth - item.indent);

          if (item.level === 3) {
            // Linha vertical central conectando Nível 2 -> Nível 3 (passa por trás da caixa)
            lines.push({
              page: itemPage,
              x1: col.colCenterX,
              y1: lastLevel3ConnectorY,
              x2: col.colCenterX,
              y2: itemY + item.height / 2,
            });
            lastLevel3ConnectorY = itemY + item.height;
          } else {
            // Conector em L para Nível 4+ recuado à direita
            const branchX = col.colX + 2;
            lines.push(
              {
                page: itemPage,
                x1: branchX,
                y1: Math.max(WBS_PDF_PAGE.marginTop, itemY - LEVEL3_VERTICAL_GAP),
                x2: branchX,
                y2: itemY + item.height / 2,
              },
              {
                page: itemPage,
                x1: branchX,
                y1: itemY + item.height / 2,
                x2: boxX,
                y2: itemY + item.height / 2,
              }
            );
          }

          boxes.push({
            id: item.node.id,
            page: itemPage,
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

          if (
            itemPage > maxReachedPage ||
            (itemPage === maxReachedPage && itemY > maxReachedY)
          ) {
            maxReachedPage = itemPage;
            maxReachedY = itemY;
          }
        }

        if (
          currentPage === maxReachedPage &&
          rowTopY + col.l2Height > maxReachedY
        ) {
          maxReachedY = rowTopY + col.l2Height;
        }
      }

      currentPage = maxReachedPage;
      cursorY = maxReachedY + (chunkIdx < level2Chunks.length - 1 ? ROW_GAP : 0);
    }

    cursorY += SECTION_GAP;
  }

  // Finaliza as linhas da espinha vertical principal em cada página onde há Nível 1
  for (const [page, endY] of pageSpineEndY.entries()) {
    const startY = pageSpineStartY.get(page) ?? WBS_PDF_PAGE.marginTop;
    if (endY > startY) {
      lines.push({
        page,
        x1: SPINE_X,
        y1: startY,
        x2: SPINE_X,
        y2: endY,
      });
    }
  }

  const maxPageFromBoxes = boxes.reduce((max, b) => Math.max(max, b.page), 1);

  return {
    pageCount: Math.max(currentPage, maxPageFromBoxes),
    boxes,
    lines,
    totalNodes,
  };
}

/**
 * Gera um nome de arquivo limpo e padronizado para o PDF da WBS.
 */
export function buildWbsPdfFilename(teamName?: string, date = new Date()): string {
  const slug = (teamName || "equipe")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "equipe";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `wbs-${slug}-${yyyy}-${mm}-${dd}.pdf`;
}
