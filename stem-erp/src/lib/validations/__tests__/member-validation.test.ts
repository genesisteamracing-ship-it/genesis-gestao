import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  updateMemberAccessSchema,
  resetMemberPasswordSchema,
} from "../auth";

describe("Member Management & Password Reset Validations (Zod)", () => {
  describe("updateMemberAccessSchema", () => {
    it("deve validar com sucesso a edição de dados cadastrais completos do integrante", () => {
      const validPayload = {
        userId: "usr_123",
        name: "Carlos Mendes",
        email: "carlos@equipegenesis.com",
        teamId: "team_alpha",
        role: "TEAM_LEAD",
        deliveryGroup: "MANUFACTURING_CNC",
        jobTitle: "Líder de Fabricação CNC",
        isActive: true,
      };

      const result = updateMemberAccessSchema.safeParse(validPayload);
      assert.ok(result.success);
      if (result.success) {
        assert.equal(result.data.name, "Carlos Mendes");
        assert.equal(result.data.email, "carlos@equipegenesis.com");
      }
    });

    it("deve rejeitar nome muito curto", () => {
      const invalidPayload = {
        userId: "usr_123",
        name: "Al",
        email: "al@equipegenesis.com",
        teamId: "team_alpha",
        role: "TEAM_LEAD",
        deliveryGroup: "MANUFACTURING_CNC",
        jobTitle: "Líder",
        isActive: true,
      };

      const result = updateMemberAccessSchema.safeParse(invalidPayload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(
          result.error.flatten().fieldErrors.name?.includes(
            "O nome deve ter no mínimo 3 caracteres"
          )
        );
      }
    });

    it("deve rejeitar e-mail inválido", () => {
      const invalidPayload = {
        userId: "usr_123",
        name: "Carlos Mendes",
        email: "email-invalido",
        teamId: "team_alpha",
        role: "TEAM_LEAD",
        deliveryGroup: "MANUFACTURING_CNC",
        jobTitle: "Líder",
        isActive: true,
      };

      const result = updateMemberAccessSchema.safeParse(invalidPayload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(
          result.error.flatten().fieldErrors.email?.includes(
            "Informe um e-mail corporativo válido"
          )
        );
      }
    });
  });

  describe("resetMemberPasswordSchema", () => {
    it("deve validar com sucesso a redefinição com senha forte e confirmação idêntica", () => {
      const validPayload = {
        userId: "usr_123",
        password: "NovaSenhaForte123",
        confirmPassword: "NovaSenhaForte123",
      };

      const result = resetMemberPasswordSchema.safeParse(validPayload);
      assert.ok(result.success);
    });

    it("deve rejeitar senha com menos de 8 caracteres", () => {
      const invalidPayload = {
        userId: "usr_123",
        password: "Cur1",
        confirmPassword: "Cur1",
      };

      const result = resetMemberPasswordSchema.safeParse(invalidPayload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(
          result.error.flatten().fieldErrors.password?.includes(
            "A senha deve ter no mínimo 8 caracteres"
          )
        );
      }
    });

    it("deve rejeitar quando as senhas não coincidem", () => {
      const mismatchPayload = {
        userId: "usr_123",
        password: "NovaSenhaForte123",
        confirmPassword: "OutraSenhaDiferente123",
      };

      const result = resetMemberPasswordSchema.safeParse(mismatchPayload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(
          result.error.flatten().fieldErrors.confirmPassword?.includes(
            "As senhas não coincidem"
          )
        );
      }
    });

    it("deve exigir ao menos uma letra maiúscula, uma minúscula e um número", () => {
      const noUpperPayload = {
        userId: "usr_123",
        password: "novasenhacomnumero123",
        confirmPassword: "novasenhacomnumero123",
      };

      const result = resetMemberPasswordSchema.safeParse(noUpperPayload);
      assert.equal(result.success, false);
      if (!result.success) {
        assert.ok(
          result.error.flatten().fieldErrors.password?.includes(
            "Deve conter ao menos uma letra maiúscula"
          )
        );
      }
    });
  });
});
