import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  DISCIPLINE_ROOT_CODES,
  getNextChildCode,
  getSuggestedCodeForDiscipline,
  normalizeWbsCode,
  collectAllWbsCodes,
} from "../wbs-code-generator";

describe("WBS Code Generator Engine", () => {
  describe("Mapeamento Oficial dos Pilares STEM", () => {
    it("deve mapear Gestão de Projetos para o código 1", () => {
      assert.equal(DISCIPLINE_ROOT_CODES.PROJECT_MANAGEMENT, "1");
    });

    it("deve mapear Engenharia (CAD e Manufatura) para o código 2", () => {
      assert.equal(DISCIPLINE_ROOT_CODES.ENGINEERING_CAD, "2");
      assert.equal(DISCIPLINE_ROOT_CODES.MANUFACTURING_CNC, "2");
    });

    it("deve mapear Empreendimento & Marketing (Patrocínios e Pit Display) para o código 3", () => {
      assert.equal(DISCIPLINE_ROOT_CODES.MARKETING_SPONSOR, "3");
      assert.equal(DISCIPLINE_ROOT_CODES.PIT_DISPLAY, "3");
    });

    it("deve mapear Projeto Social para o código 4", () => {
      assert.equal(DISCIPLINE_ROOT_CODES.SOCIAL_PROJECT, "4");
    });
  });

  describe("normalizeWbsCode", () => {
    it("deve converter códigos legados .0 para formato limpo", () => {
      assert.equal(normalizeWbsCode("1.0"), "1");
      assert.equal(normalizeWbsCode("2.0"), "2");
      assert.equal(normalizeWbsCode("1.1"), "1.1");
      assert.equal(normalizeWbsCode("1.1.1"), "1.1.1");
    });
  });

  describe("getNextChildCode (Geração hierárquica pai-filho)", () => {
    it("deve gerar 1.1 para o primeiro filho do pai 1", () => {
      assert.equal(getNextChildCode("1", []), "1.1");
    });

    it("deve gerar 1.3 se os filhos 1.1 e 1.2 já existirem", () => {
      assert.equal(getNextChildCode("1", ["1.1", "1.2"]), "1.3");
    });

    it("deve gerar 2.1 para o primeiro filho do pai 2", () => {
      assert.equal(getNextChildCode("2", []), "2.1");
    });

    it("deve gerar 2.1.1 para o primeiro neto do nó 2.1", () => {
      assert.equal(getNextChildCode("2.1", []), "2.1.1");
    });

    it("deve gerar 2.1.3 se os netos 2.1.1 e 2.1.2 já existirem", () => {
      assert.equal(getNextChildCode("2.1", ["2.1.1", "2.1.2"]), "2.1.3");
    });

    it("deve tratar nós legados com .0 como pai 1.0 gerando 1.1", () => {
      assert.equal(getNextChildCode("1.0", []), "1.1");
    });
  });

  describe("getSuggestedCodeForDiscipline (Seleção de Setor)", () => {
    it("deve sugerir '1' para Gestão de Projetos quando ainda não existe nó raiz", () => {
      assert.equal(getSuggestedCodeForDiscipline("PROJECT_MANAGEMENT", []), "1");
    });

    it("deve sugerir '2' para Engenharia quando ainda não existe nó raiz", () => {
      assert.equal(getSuggestedCodeForDiscipline("ENGINEERING_CAD", []), "2");
      assert.equal(getSuggestedCodeForDiscipline("MANUFACTURING_CNC", []), "2");
    });

    it("deve sugerir '3' para Empreendimento & Marketing quando ainda não existe nó raiz", () => {
      assert.equal(getSuggestedCodeForDiscipline("MARKETING_SPONSOR", []), "3");
      assert.equal(getSuggestedCodeForDiscipline("PIT_DISPLAY", []), "3");
    });

    it("deve sugerir '4' para Projeto Social quando ainda não existe nó raiz", () => {
      assert.equal(getSuggestedCodeForDiscipline("SOCIAL_PROJECT", []), "4");
    });

    it("deve sugerir '1.1' para Gestão de Projetos se o nó '1' já existir", () => {
      assert.equal(getSuggestedCodeForDiscipline("PROJECT_MANAGEMENT", ["1"]), "1.1");
    });

    it("deve sugerir '2.3' para Engenharia se '2', '2.1' e '2.2' já existirem", () => {
      assert.equal(
        getSuggestedCodeForDiscipline("ENGINEERING_CAD", ["2", "2.1", "2.2"]),
        "2.3"
      );
    });

    it("deve sugerir '3.2' para Empreendimento se '3' e '3.1' já existirem", () => {
      assert.equal(
        getSuggestedCodeForDiscipline("MARKETING_SPONSOR", ["3", "3.1"]),
        "3.2"
      );
    });

    it("deve sugerir '4.1' para Projeto Social se '4' já existir", () => {
      assert.equal(getSuggestedCodeForDiscipline("SOCIAL_PROJECT", ["4"]), "4.1");
    });
  });

  describe("collectAllWbsCodes", () => {
    it("deve extrair todos os códigos de forma recursiva", () => {
      const tree = [
        {
          code: "1",
          children: [
            { code: "1.1", children: [{ code: "1.1.1" }] },
            { code: "1.2" },
          ],
        },
        {
          code: "2",
          children: [{ code: "2.1" }],
        },
      ];
      const codes = collectAllWbsCodes(tree);
      assert.ok(codes.includes("1"));
      assert.ok(codes.includes("1.1"));
      assert.ok(codes.includes("1.1.1"));
      assert.ok(codes.includes("1.2"));
      assert.ok(codes.includes("2"));
      assert.ok(codes.includes("2.1"));
    });
  });
});
