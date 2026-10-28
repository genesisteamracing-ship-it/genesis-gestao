import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  createStakeholderSchema,
  createCommunicationPlanSchema,
  createCommunicationLogSchema,
  createFeedbackSchema,
} from "../../../lib/validations/communication";

describe("Communication Validations (Zod Schemas)", () => {
  it("deve validar com sucesso um cadastro válido de stakeholder", () => {
    const validData = {
      name: "Engenheira Juliana Costa",
      organization: "Haas Automation",
      roleOrJobTitle: "Mentora Técnica de Usinagem",
      group: "TECHNICAL_MENTORS",
      power: "HIGH",
      interest: "HIGH",
      currentEngagement: "SUPPORTIVE",
      targetEngagement: "LEADING",
      preferredChannel: "WHATSAPP",
      preferredFrequency: "BIWEEKLY",
      email: "juliana@haas.com",
      phone: "(11) 99887-7665",
      notes: "Disponível para plantão de dúvidas às quintas.",
    };

    const parsed = createStakeholderSchema.safeParse(validData);
    assert.strictEqual(parsed.success, true);
  });

  it("deve reprovar stakeholder com nome curto ou email com formato incorreto", () => {
    const invalidData = {
      name: "J", // Mínimo 2 caracteres
      group: "SPONSORS",
      email: "email-invalido-sem-arroba",
    };

    const parsed = createStakeholderSchema.safeParse(invalidData);
    assert.strictEqual(parsed.success, false);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      assert.ok(errors.name);
      assert.ok(errors.email);
    }
  });

  it("deve validar criação de plano de régua de comunicação", () => {
    const validPlan = {
      stakeholderId: "cl1234567890",
      title: "Boletim Mensal de Prestação de Contas",
      channel: "EMAIL",
      frequency: "MONTHLY",
      responsibleMemberName: "Amanda Silva",
      customApproach: "Formal e objetivo com demonstrativo de custos.",
    };

    const parsed = createCommunicationPlanSchema.safeParse(validPlan);
    assert.strictEqual(parsed.success, true);
  });

  it("deve exigir campos obrigatórios no registro de comunicação e no feedback", () => {
    const invalidLog = {
      stakeholderId: "",
      subject: "AB", // curto
      channel: "WHATSAPP",
      dispatchedByName: "",
      contentSummary: "curto",
    };

    const parsedLog = createCommunicationLogSchema.safeParse(invalidLog);
    assert.strictEqual(parsedLog.success, false);

    const validFeedback = {
      communicationLogId: "log-123",
      sentiment: "CONSTRUCTIVE_CRITICISM",
      stakeholderResponse: "Solicitou que os relatórios sejam enviados no início da semana.",
      continuousImprovementAction: "Reagendamos o disparo das quintas para as terças-feiras.",
      isAddressed: true,
    };

    const parsedFeedback = createFeedbackSchema.safeParse(validFeedback);
    assert.strictEqual(parsedFeedback.success, true);
  });
});
