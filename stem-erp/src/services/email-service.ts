import nodemailer from "nodemailer";

export const DEFAULT_TEAM_SENDER_EMAIL = "genesisteamracing@gmail.com";

export interface SendAutomatedEmailParams {
  fromEmail?: string | null;
  fromName?: string | null;
  toEmail: string;
  toName?: string | null;
  subject: string;
  text: string;
  html: string;
}

export interface SendAutomatedEmailResult {
  messageId: string;
  senderEmail: string;
  recipientEmail: string;
  simulated: boolean;
}

export function resolveTeamSenderEmail(candidate?: string | null): string {
  const trimmed = candidate?.trim();
  return trimmed && trimmed.includes("@") ? trimmed : DEFAULT_TEAM_SENDER_EMAIL;
}

/**
 * Envia um e-mail transacional de relatório executivo utilizando Nodemailer.
 * Quando as variáveis SMTP (SMTP_PASS / GMAIL_APP_PASSWORD) estão configuradas no ambiente,
 * realiza o disparo real via SMTP (por padrão smtp.gmail.com para genesisteamracing@gmail.com).
 * Em ambiente local/teste sem credencial SMTP, executa o envio simulado seguro (dry-run)
 * mantendo rastreabilidade completa.
 */
export async function sendAutomatedEmail(
  params: SendAutomatedEmailParams
): Promise<SendAutomatedEmailResult> {
  const senderEmail = resolveTeamSenderEmail(params.fromEmail);
  const senderName = params.fromName?.trim() || "Gênesis Racing";
  const recipientEmail = params.toEmail.trim();

  if (!recipientEmail || !recipientEmail.includes("@")) {
    throw new Error("O stakeholder selecionado não possui um endereço de e-mail válido cadastrado.");
  }

  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || "465");
  const smtpUser = process.env.SMTP_USER?.trim() || senderEmail;
  const smtpPass =
    process.env.SMTP_PASS?.trim() || process.env.GMAIL_APP_PASSWORD?.trim() || "";

  const fromHeader = `"${senderName.replace(/"/g, "")}" <${senderEmail}>`;
  const toHeader = params.toName
    ? `"${params.toName.trim().replace(/"/g, "")}" <${recipientEmail}>`
    : recipientEmail;

  if (!smtpPass) {
    // Modo simulado seguro quando credenciais SMTP não estão definidas no ambiente local
    const simulatedId = `<simulated-${Date.now()}@genesisracing.local>`;
    return {
      messageId: simulatedId,
      senderEmail,
      recipientEmail,
      simulated: true,
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const info = await transporter.sendMail({
    from: fromHeader,
    replyTo: senderEmail,
    to: toHeader,
    subject: params.subject.trim(),
    text: params.text,
    html: params.html,
  });

  return {
    messageId: info.messageId || `<sent-${Date.now()}@genesisracing>`,
    senderEmail,
    recipientEmail,
    simulated: false,
  };
}
