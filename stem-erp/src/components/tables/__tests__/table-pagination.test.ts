import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("Table Pagination Logic & Boundaries", () => {
  it("deve calcular corretamente o número de páginas com base no total e pageSize", () => {
    const totalLogs = 25;
    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));

    assert.equal(totalPages, 3);
  });

  it("deve retornar 1 página no mínimo quando a lista estiver vazia", () => {
    const totalLogs = 0;
    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));

    assert.equal(totalPages, 1);
  });

  it("deve fatiar os registros corretamente para a página selecionada", () => {
    const mockItems = Array.from({ length: 25 }, (_, i) => ({ id: `id-${i + 1}`, name: `Item ${i + 1}` }));
    const pageSize = 10;

    // Página 1
    const p1 = mockItems.slice(0, 10);
    assert.equal(p1.length, 10);
    assert.equal(p1[0].name, "Item 1");
    assert.equal(p1[9].name, "Item 10");

    // Página 2
    const p2 = mockItems.slice(10, 20);
    assert.equal(p2.length, 10);
    assert.equal(p2[0].name, "Item 11");
    assert.equal(p2[9].name, "Item 20");

    // Página 3 (restante)
    const p3 = mockItems.slice(20, 30);
    assert.equal(p3.length, 5);
    assert.equal(p3[0].name, "Item 21");
    assert.equal(p3[4].name, "Item 25");
  });

  it("deve calcular startRow e endRow coerentemente", () => {
    const total: number = 25;
    const pageSize: number = 10;
    const pageIndex: number = 2; // Página 3 (base 0)

    const startIndex = pageIndex * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    const startRow = total === 0 ? 0 : startIndex + 1;

    assert.equal(startRow, 21);
    assert.equal(endIndex, 25);
  });
});
