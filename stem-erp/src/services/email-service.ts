import nodemailer from "nodemailer";

export const DEFAULT_TEAM_SENDER_EMAIL = "genesisteamracing@gmail.com";

export interface SendAutomatedEmailParams {
  fromEmail?: string | null;
  fromName?: string | null;
  smtpAppPassword?: string | null;
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
 * Normaliza a Senha de App do Google removendo espaços em branco (ex: "abcd efgh ijkl mnop" -> "abcdefghijklmnop").
 */
export function normalizeSmtpAppPassword(rawPassword?: string | null): string {
  return (rawPassword || "").replace(/\s+/g, "").trim();
}

/**
 * Testa e valida em tempo real as credenciais SMTP junto ao servidor do Gmail (smtp.gmail.com)
 * antes de autorizar e ativar o disparo de e-mails na tela de Equipe & Acessos.
 */
export async function verifySmtpCredentials(params: {
  senderEmail: string;
  smtpAppPassword: string;
}): Promise<{ valid: boolean; errorMessage?: string }> {
  const senderEmail = resolveTeamSenderEmail(params.senderEmail);
  const smtpPass = normalizeSmtpAppPassword(params.smtpAppPassword);

  if (!smtpPass || smtpPass.length < 8) {
    return {
      valid: false,
      errorMessage: "Informe a Senha de App de 16 caracteres gerada na conta Google.",
    };
  }

  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT || "465");

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: senderEmail,
      pass: smtpPass,
    },
  });

  try {
    await transporter.verify();
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      errorMessage:
        error instanceof Error
          ? `O Gmail recusou a autorização (${error.message}). Confira se a Verificação em 2 Etapas está ativa e se a Senha de App de 16 letras está correta.`
          : "Falha ao autenticar no servidor SMTP do Gmail.",
    };
  }
}

/**
 * Envia um e-mail transacional de relatório executivo utilizando Nodemailer via SMTP real.
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
  const smtpPass = normalizeSmtpAppPassword(
    params.smtpAppPassword ||
      process.env.SMTP_PASS ||
      process.env.GMAIL_APP_PASSWORD ||
      ""
  );

  if (!smtpPass) {
    throw new Error(
      `A Senha de App do Gmail para "${senderEmail}" ainda não foi configurada. Acesse "Equipe & Acessos" e informe a Senha de App do Google (16 letras) para enviar e-mails reais.`
    );
  }

  const fromHeader = `"${senderName.replace(/"/g, "")}" <${senderEmail}>`;
  const toHeader = params.toName
    ? `"${params.toName.trim().replace(/"/g, "")}" <${recipientEmail}>`
    : recipientEmail;

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
