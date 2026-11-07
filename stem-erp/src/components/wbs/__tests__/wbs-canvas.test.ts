import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { wbsCardStyles } from "../wbs-node-card";
import { canvasStyles } from "../wbs-canvas-view";

describe("WBS Canvas & Node Card Styles (tailwind-variants)", () => {
  it("deve gerar classes de card para disciplina ENGINEERING_CAD com tokens semânticos", () => {
    const { card, codeBadge, disciplineChip } = wbsCardStyles({
      discipline: "ENGINEERING_CAD",
      status: "PLANNED",
      isLeaf: false,
    });

    const cardClasses = card();
    const codeClasses = codeBadge();
    const chipClasses = disciplineChip();

    assert.ok(cardClasses.includes("border-primary/40"));
    assert.ok(cardClasses.includes("border-solid"));
    assert.ok(codeClasses.includes("text-primary"));
    assert.ok(chipClasses.includes("bg-primary/10"));
  });

  it("deve gerar borda tracejada (dashed) para nós folha (work packages)", () => {
    const { card } = wbsCardStyles({
      discipline: "MARKETING_SPONSOR",
      status: "COMPLETED",
      isLeaf: true,
    });

    const cardClasses = card();
    assert.ok(cardClasses.includes("border-dashed"));
    assert.ok(cardClasses.includes("border-success/40"));
  });

  it("deve gerar classes corretas para status IN_PROGRESS e PIT_DISPLAY", () => {
    const { statusChip, disciplineChip } = wbsCardStyles({
      discipline: "PIT_DISPLAY",
      status: "IN_PROGRESS",
      isLeaf: false,
    });

    const statusClasses = statusChip();
    const disciplineClasses = disciplineChip();

    assert.ok(statusClasses.includes("text-warning"));
    assert.ok(disciplineClasses.includes("text-purple"));
  });

  it("deve gerar slots estruturais para o canvas semântico", () => {
    const { shell, canvasViewport, rootProjectCard } = canvasStyles();

    const shellClasses = shell();
    const viewportClasses = canvasViewport();
    const rootClasses = rootProjectCard();

    assert.ok(shellClasses.includes("relative overflow-hidden rounded-2xl"));
    assert.ok(viewportClasses.includes("radial-gradient"));
    assert.ok(rootClasses.includes("border-primary/60"));
  });
});
