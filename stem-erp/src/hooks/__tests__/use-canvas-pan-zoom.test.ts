import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  clampCanvasZoom,
  calculatePanOffset,
  isExceedingDragThreshold,
  calculateWheelZoom,
  MIN_CANVAS_ZOOM,
  MAX_CANVAS_ZOOM,
} from "../use-canvas-pan-zoom";

describe("useCanvasPanZoom Logic & Math Contracts", () => {
  it("deve limitar o zoom respeitando os limites mínimo (0.4) e máximo (2.0)", () => {
    assert.equal(clampCanvasZoom(0.1), MIN_CANVAS_ZOOM);
    assert.equal(clampCanvasZoom(3.5), MAX_CANVAS_ZOOM);
    assert.equal(clampCanvasZoom(1.0), 1.0);
    assert.equal(clampCanvasZoom(1.25), 1.25);
  });

  it("deve calcular o deslocamento do pan em X e Y a partir da posição inicial e arrasto do mouse", () => {
    const startPan = { x: 50, y: 100 };
    const startPos = { x: 200, y: 300 };
    const currentPos = { x: 280, y: 250 }; // dx = +80, dy = -50

    const nextPan = calculatePanOffset(startPan, startPos, currentPos);
    assert.deepEqual(nextPan, { x: 130, y: 50 });
  });

  it("deve ignorar micro-movimentos abaixo do limiar de arrasto (drag threshold)", () => {
    // 2px em X, 1px em Y -> hypotenuse ~ 2.23px (< 4px)
    assert.equal(isExceedingDragThreshold(2, 1), false);
    // 0px
    assert.equal(isExceedingDragThreshold(0, 0), false);
    // 3px em X, 3px em Y -> hypotenuse ~ 4.24px (>= 4px)
    assert.equal(isExceedingDragThreshold(3, 3), true);
    // 10px em X
    assert.equal(isExceedingDragThreshold(10, 0), true);
  });

  it("deve ajustar o zoom proporcionalmente na rotação da roda do mouse", () => {
    const initialZoom = 1.0;
    // Rolar para cima (deltaY < 0) aumenta o zoom
    const zoomedIn = calculateWheelZoom(initialZoom, -100);
    assert.ok(zoomedIn > initialZoom, "Deveria aumentar o zoom ao rolar para cima");

    // Rolar para baixo (deltaY > 0) diminui o zoom
    const zoomedOut = calculateWheelZoom(initialZoom, 100);
    assert.ok(zoomedOut < initialZoom, "Deveria diminuir o zoom ao rolar para baixo");
  });
});
