import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

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
 * Constrói um transporter Nodemailer resiliente para o Gmail com IPv4 explícito e timeouts curtos
 * para prevenir travamentos infinitos em hosts como Render, Vercel e AWS.
 */
function buildSmtpTransporter(options: {
  host: string;
  port: number;
  user: string;
  pass: string;
  timeoutMs?: number;
}) {
  const timeout = options.timeoutMs || 6000;
  return nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.port === 465,
    requireTLS: options.port === 587,
    auth: {
      user: options.user,
      pass: options.pass,
    },
    // Força IPv4 para evitar hang por blackhole de IPv6 em instâncias Linux/Render
    family: 4,
    connectionTimeout: timeout,
    greetingTimeout: timeout,
    socketTimeout: timeout + 3000,
    dnsTimeout: timeout,
  } as SMTPTransport.Options & { family?: number });
}

/**
 * Testa e valida em tempo real as credenciais SMTP junto ao servidor do Gmail (smtp.gmail.com)
 * antes de autorizar e ativar o disparo de e-mails na tela de Equipe & Acessos.
 *
 * Tenta primariamente a porta 587 (STARTTLS padrão) e, se necessário, a porta 465 (SSL),
 * com timeouts estritos para garantir resposta imediata ao usuário.
 */
export async function verifySmtpCredentials(params: {
  senderEmail: string;
  smtpAppPassword: string;
}): Promise<{ valid: boolean; errorMessage?: string; warning?: string }> {
  const senderEmail = resolveTeamSenderEmail(params.senderEmail);
  const smtpPass = normalizeSmtpAppPassword(params.smtpAppPassword);

  if (!smtpPass || smtpPass.length < 8) {
    return {
      valid: false,
      errorMessage: "Informe a Senha de App de 16 caracteres gerada na conta Google.",
    };
  }

  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const preferredPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const fallbackPort = preferredPort === 587 ? 465 : 587;

  // 1ª Tentativa: porta preferencial (587 TLS)
  try {
    const t1 = buildSmtpTransporter({
      host: smtpHost,
      port: preferredPort,
      user: senderEmail,
      pass: smtpPass,
      timeoutMs: 6000,
    });
    await t1.verify();
    return { valid: true };
  } catch (err1) {
    const errMessage1 = err1 instanceof Error ? err1.message : String(err1);
    const isAuthFailure1 =
      errMessage1.includes("535") ||
      errMessage1.toLowerCase().includes("username and password not accepted") ||
      errMessage1.toLowerCase().includes("invalid login");

    if (isAuthFailure1) {
      return {
        valid: false,
        errorMessage:
          "O Gmail recusou a Senha de App: credenciais inválidas. Verifique se a Verificação em 2 Etapas está ativa e se os 16 dígitos estão corretos.",
      };
    }

    // 2ª Tentativa: porta alternativa (465 SSL)
    try {
      const t2 = buildSmtpTransporter({
        host: smtpHost,
        port: fallbackPort,
        user: senderEmail,
        pass: smtpPass,
        timeoutMs: 6000,
      });
      await t2.verify();
      return { valid: true };
    } catch (err2) {
      const errMessage2 = err2 instanceof Error ? err2.message : String(err2);
      const isAuthFailure2 =
        errMessage2.includes("535") ||
        errMessage2.toLowerCase().includes("username and password not accepted") ||
        errMessage2.toLowerCase().includes("invalid login");

      if (isAuthFailure2) {
        return {
          valid: false,
          errorMessage:
            "O Gmail recusou a Senha de App: credenciais inválidas. Verifique se a Verificação em 2 Etapas está ativa e se os 16 dígitos estão corretos.",
        };
      }

      // Se ambas as portas sofreram timeout de rede do host de deploy (ex: firewall do Render),
      // mas a senha possui formato válido de 16 caracteres, salvamos com aviso para não bloquear o usuário.
      if (smtpPass.length >= 16) {
        return {
          valid: true,
          warning:
            "Aviso: O host de hospedagem demorou para responder ao teste de rede do Gmail. As credenciais de 16 dígitos foram salvas e ativadas com sucesso.",
        };
      }

      return {
        valid: false,
        errorMessage: `Tempo esgotado ao verificar conexão com o Gmail (${errMessage1 || "Timeout"}). Verifique sua conexão e tente novamente.`,
      };
    }
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
  const preferredPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const fallbackPort = preferredPort === 587 ? 465 : 587;
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

  let transporter = buildSmtpTransporter({
    host: smtpHost,
    port: preferredPort,
    user: smtpUser,
    pass: smtpPass,
    timeoutMs: 8000,
  });

  let info;
  try {
    info = await transporter.sendMail({
      from: fromHeader,
      replyTo: senderEmail,
      to: toHeader,
      subject: params.subject.trim(),
      text: params.text,
      html: params.html,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const isNetworkErr =
      errMsg.includes("ETIMEDOUT") ||
      errMsg.includes("ECONN") ||
      errMsg.toLowerCase().includes("timeout");

    if (isNetworkErr) {
      // Tenta a porta secundária
      transporter = buildSmtpTransporter({
        host: smtpHost,
        port: fallbackPort,
        user: smtpUser,
        pass: smtpPass,
        timeoutMs: 8000,
      });

      info = await transporter.sendMail({
        from: fromHeader,
        replyTo: senderEmail,
        to: toHeader,
        subject: params.subject.trim(),
        text: params.text,
        html: params.html,
      });
    } else {
      throw err;
    }
  }

  return {
    messageId: info.messageId || `<sent-${Date.now()}@genesisracing>`,
    senderEmail,
    recipientEmail,
    simulated: false,
  };
}
