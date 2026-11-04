import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  sendStakeholderReportEmailSchema,
  updateTeamSenderEmailSchema,
} from "../communication";

describe("Communication Email & Team Sender Validation Schemas", () => {
  it("deve validar com sucesso o e-mail de envio padrão genesisteamracing@gmail.com", () => {
    const parsed = updateTeamSenderEmailSchema.safeParse({
      teamId: "team-genesis-01",
      senderEmail: "genesisteamracing@gmail.com",
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.senderEmail, "genesisteamracing@gmail.com");
    }
  });

  it("deve rejeitar um e-mail remetente com formato inválido", () => {
    const parsed = updateTeamSenderEmailSchema.safeParse({
      teamId: "team-genesis-01",
      senderEmail: "email-invalido-sem-arroba",
    });

    assert.equal(parsed.success, false);
  });

  it("deve validar payload completo de disparo de relatório por e-mail", () => {
    const parsed = sendStakeholderReportEmailSchema.safeParse({
      stakeholderId: "st-01",
      reportType: "COMBINED",
      periodLabel: "Temporada 2025/2026 - Novembro",
      customNote: "Segue relatório executivo atualizado.",
      subject: "[Gênesis Racing] Relatório Executivo Completo — Novembro",
      emailText: "Olá parceiro, confira os indicadores financeiros e de ROI da equipe.",
      emailHtml: "<div><h1>Relatório Executivo Completo</h1><p>Dados consolidados.</p></div>",
    });

    assert.equal(parsed.success, true);
  });

  it("deve rejeitar disparo de relatório sem stakeholderId ou com assunto muito curto", () => {
    const parsed = sendStakeholderReportEmailSchema.safeParse({
      stakeholderId: "",
      reportType: "COMBINED",
      periodLabel: "Nov",
      subject: "Oi",
      emailText: "Curto",
      emailHtml: "<p>Oi</p>",
    });

    assert.equal(parsed.success, false);
  });
});
