import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createWbsNodeSchema,
  updateWbsNodeSchema,
  deleteWbsNodeSchema,
} from "../wbs.schema";

describe("WBS Zod Validation Schemas", () => {
  describe("createWbsNodeSchema", () => {
    it("deve validar com sucesso códigos raiz e sub-níveis da padronização STEM (1, 2, 3, 4, 1.1, 2.1, 1.1.1)", () => {
      const validCases = [
        { code: "1", title: "Gestão de Projetos", discipline: "PROJECT_MANAGEMENT" },
        { code: "2", title: "Engenharia e Manufatura", discipline: "ENGINEERING_CAD" },
        { code: "3", title: "Empreendimento e Marketing", discipline: "MARKETING_SPONSOR" },
        { code: "4", title: "Projeto Social", discipline: "SOCIAL_PROJECT" },
        { code: "1.1", title: "Planejamento e Cronograma", discipline: "PROJECT_MANAGEMENT" },
        { code: "2.1", title: "Chassis e Aerodinâmica", discipline: "ENGINEERING_CAD" },
        { code: "2.1.1", title: "Modelagem do Difusor", discipline: "ENGINEERING_CAD" },
        { code: "3.1.2", title: "Press Kit de Patrocínio", discipline: "MARKETING_SPONSOR" },
        { code: "4.1.1", title: "Oficina STEM na Comunidade", discipline: "SOCIAL_PROJECT" },
      ];

      for (const tc of validCases) {
        const result = createWbsNodeSchema.safeParse({
          teamId: "team-test",
          code: tc.code,
          title: tc.title,
          discipline: tc.discipline,
          status: "PLANNED",
          estimatedCostCents: 0,
          estimatedHours: 0,
        });
        assert.equal(result.success, true, `Código válido ${tc.code} deveria ser aceito`);
      }
    });

    it("deve validar com sucesso um nó raiz válido (Nível 1 legado 1.0)", () => {
      const input = {
        teamId: "team-cl12345",
        parentId: null,
        code: "1.0",
        title: "Carro de Corrida STEM",
        description: "Projeto completo do veículo de competição",
        discipline: "ENGINEERING_CAD",
        status: "PLANNED",
        estimatedCostCents: 0,
        estimatedHours: 0,
      };

      const result = createWbsNodeSchema.safeParse(input);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.code, "1.0");
        assert.equal(result.data.title, "Carro de Corrida STEM");
        assert.equal(result.data.discipline, "ENGINEERING_CAD");
      }
    });

    it("deve validar um pacote de trabalho folha (Nível 3+) com custo e horas", () => {
      const input = {
        teamId: "team-cl12345",
        parentId: "node-parent-1",
        code: "1.2.3",
        title: "Fixação do Eixo Traseiro",
        description: "Usinagem de suportes em alumínio 7075",
        discipline: "MANUFACTURING_CNC",
        ownerId: "user-123",
        ownerName: "João Engenheiro",
        status: "IN_PROGRESS",
        estimatedCostCents: 25000, // R$ 250,00
        estimatedHours: 12,
      };

      const result = createWbsNodeSchema.safeParse(input);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.estimatedCostCents, 25000);
        assert.equal(result.data.estimatedHours, 12);
        assert.equal(result.data.ownerName, "João Engenheiro");
      }
    });

    it("deve rejeitar código EAP com caracteres inválidos", () => {
      const invalidCodes = ["1a.2", "1..2", "abc", "1.2-3", ""];
      for (const code of invalidCodes) {
        const result = createWbsNodeSchema.safeParse({
          teamId: "team-1",
          code,
          title: "Entregável Inválido",
          discipline: "PROJECT_MANAGEMENT",
          status: "PLANNED",
          estimatedCostCents: 0,
          estimatedHours: 0,
          sortOrder: 0,
        });
        assert.equal(result.success, false, `Código ${code} deveria ter sido rejeitado`);
      }
    });

    it("deve rejeitar entregável com título muito curto ou muito longo", () => {
      const shortTitleResult = createWbsNodeSchema.safeParse({
        teamId: "team-1",
        code: "1.1",
        title: "AB",
        discipline: "PROJECT_MANAGEMENT",
        status: "PLANNED",
        estimatedCostCents: 0,
        estimatedHours: 0,
        sortOrder: 0,
      });
      assert.equal(shortTitleResult.success, false);

      const longTitle = "A".repeat(125);
      const longTitleResult = createWbsNodeSchema.safeParse({
        teamId: "team-1",
        code: "1.1",
        title: longTitle,
        discipline: "PROJECT_MANAGEMENT",
        status: "PLANNED",
        estimatedCostCents: 0,
        estimatedHours: 0,
        sortOrder: 0,
      });
      assert.equal(longTitleResult.success, false);
    });

    it("deve rejeitar custo ou horas negativos", () => {
      const negativeCostResult = createWbsNodeSchema.safeParse({
        teamId: "team-1",
        code: "1.1",
        title: "Entregável Teste",
        discipline: "PROJECT_MANAGEMENT",
        status: "PLANNED",
        estimatedCostCents: -500,
        estimatedHours: 0,
        sortOrder: 0,
      });
      assert.equal(negativeCostResult.success, false);

      const negativeHoursResult = createWbsNodeSchema.safeParse({
        teamId: "team-1",
        code: "1.1",
        title: "Entregável Teste",
        discipline: "PROJECT_MANAGEMENT",
        status: "PLANNED",
        estimatedCostCents: 0,
        estimatedHours: -1,
        sortOrder: 0,
      });
      assert.equal(negativeHoursResult.success, false);
    });
  });

  describe("updateWbsNodeSchema", () => {
    it("deve permitir atualização parcial de dados de um entregável", () => {
      const updatePayload = {
        id: "node-123",
        title: "Chassis Monocoque Reforçado",
        estimatedCostCents: 45000,
      };

      const result = updateWbsNodeSchema.safeParse(updatePayload);
      assert.equal(result.success, true);
      if (result.success) {
        assert.equal(result.data.title, "Chassis Monocoque Reforçado");
        assert.equal(result.data.estimatedCostCents, 45000);
      }
    });

    it("deve exigir o ID do nó para atualização", () => {
      const result = updateWbsNodeSchema.safeParse({
        title: "Sem ID",
      });
      assert.equal(result.success, false);
    });
  });

  describe("deleteWbsNodeSchema", () => {
    it("deve validar exclusão com id e teamId", () => {
      const result = deleteWbsNodeSchema.safeParse({
        id: "node-123",
        teamId: "team-456",
      });
      assert.equal(result.success, true);
    });

    it("deve rejeitar exclusão sem teamId", () => {
      const result = deleteWbsNodeSchema.safeParse({
        id: "node-123",
      });
      assert.equal(result.success, false);
    });
  });
});
