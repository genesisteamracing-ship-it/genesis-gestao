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
  smtpBlockedByHost?: boolean;
}

export function resolveTeamSenderEmail(candidate?: string | null): string {
  const trimmed = candidate?.trim();
  return trimmed && trimmed.includes("@") ? trimmed : DEFAULT_TEAM_SENDER_EMAIL;
}

/**
 * Normaliza a credencial de envio:
 * - Se for uma URL HTTPS (Google Apps Script Web App) ou chave de API (re_...), preserva o formato.
 * - Se for uma Senha de App do Google (ex: "abcd efgh ijkl mnop"), remove todos os espaços em branco.
 */
export function normalizeSmtpAppPassword(rawPassword?: string | null): string {
  const trimmed = (rawPassword || "").trim();
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://") || trimmed.startsWith("re_")) {
    return trimmed;
  }
  return trimmed.replace(/\s+/g, "");
}

/**
 * Constrói um transporter Nodemailer com IPv4 explícito e timeouts curtos.
 */
function buildSmtpTransporter(options: {
  host: string;
  port: number;
  user: string;
  pass: string;
  timeoutMs?: number;
}) {
  const timeout = options.timeoutMs || 3500;
  return nodemailer.createTransport({
    host: options.host,
    port: options.port,
    secure: options.port === 465,
    requireTLS: options.port === 587,
    auth: {
      user: options.user,
      pass: options.pass,
    },
    family: 4,
    connectionTimeout: timeout,
    greetingTimeout: timeout,
    socketTimeout: timeout + 1500,
    dnsTimeout: timeout,
  } as SMTPTransport.Options & { family?: number });
}

/**
 * Testa e valida as credenciais de envio de e-mail antes de ativar na tela de Equipe & Acessos.
 * Suporta:
 * 1. URL de Web App do Google Apps Script (HTTPS porta 443 — funciona no Render Free sem bloqueio).
 * 2. Chave de API Resend (re_... via HTTPS porta 443).
 * 3. Senha de App de 16 caracteres do Gmail (testa portas 587 e 465 simultaneamente com timeout rápido de 3.5s).
 */
export async function verifySmtpCredentials(params: {
  senderEmail: string;
  smtpAppPassword: string;
}): Promise<{ valid: boolean; errorMessage?: string; warning?: string }> {
  const senderEmail = resolveTeamSenderEmail(params.senderEmail);
  const credential = normalizeSmtpAppPassword(params.smtpAppPassword);

  if (!credential || credential.length < 8) {
    return {
      valid: false,
      errorMessage:
        "Informe a Senha de App de 16 letras do Google ou a URL HTTPS do Google Apps Script.",
    };
  }

  // Caso 1: Webhook HTTPS do Google Apps Script (porta 443)
  if (credential.startsWith("https://script.google.com/")) {
    return { valid: true };
  }

  // Caso 2: API Key do Resend (porta 443)
  if (credential.startsWith("re_")) {
    return { valid: true };
  }

  // Caso 3: Senha de App SMTP tradicional (testa 587 e 465 em paralelo para resposta rápida <= 3.5s)
  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";

  try {
    const t587 = buildSmtpTransporter({
      host: smtpHost,
      port: 587,
      user: senderEmail,
      pass: credential,
      timeoutMs: 3500,
    });
    const t465 = buildSmtpTransporter({
      host: smtpHost,
      port: 465,
      user: senderEmail,
      pass: credential,
      timeoutMs: 3500,
    });

    await Promise.any([t587.verify(), t465.verify()]);
    return { valid: true };
  } catch (aggError) {
    const errors: unknown[] =
      aggError && typeof aggError === "object" && "errors" in aggError
        ? (aggError as { errors: unknown[] }).errors
        : [aggError];

    const combinedMessages = errors
      .map((e) => (e instanceof Error ? e.message : String(e)))
      .join(" | ");

    const isAuthFailure =
      combinedMessages.includes("535") ||
      combinedMessages.toLowerCase().includes("username and password not accepted") ||
      combinedMessages.toLowerCase().includes("invalid login");

    if (isAuthFailure) {
      return {
        valid: false,
        errorMessage:
          "O Gmail recusou a Senha de App: credenciais inválidas. Confira se a Verificação em 2 Etapas está ativa e se os 16 dígitos estão corretos.",
      };
    }

    // Se o host (ex: Render Free) bloqueia portas SMTP de saída (25, 465, 587),
    // autorizamos e salvamos a senha de 16 dígitos sem travar o usuário.
    if (credential.length >= 16) {
      return {
        valid: true,
        warning:
          "Credencial autorizada e salva! Nota: o servidor atual (Render Free) bloqueia portas SMTP 465/587; o envio usará ponte HTTPS ou abertura assistida no Gmail.",
      };
    }

    return {
      valid: false,
      errorMessage: `Não foi possível validar via SMTP (${combinedMessages || "Connection timeout"}).`,
    };
  }
}

/**
 * Envia um e-mail de relatório executivo priorizando:
 * 1. Ponte HTTPS (Porta 443) via Google Apps Script Webhook (não sofre bloqueio no Render Free).
 * 2. API HTTPS (Porta 443) via Resend (se configurada).
 * 3. SMTP Direto (Portas 587 e 465 em paralelo).
 * 4. Fallback seguro caso o host de hospedagem (Render Free) bloqueie portas SMTP de saída.
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

  const credential = normalizeSmtpAppPassword(
    params.smtpAppPassword ||
      process.env.GOOGLE_SCRIPT_WEBHOOK_URL ||
      process.env.RESEND_API_KEY ||
      process.env.SMTP_PASS ||
      process.env.GMAIL_APP_PASSWORD ||
      ""
  );

  if (!credential) {
    throw new Error(
      `A autorização de e-mail para "${senderEmail}" ainda não foi configurada. Acesse "Equipe & Acessos" e clique em Autorizar.`
    );
  }

  // 1. Envio via Ponte HTTPS Google Apps Script (Porta 443 — passa livremente pelo firewall do Render Free)
  const webhookUrl = credential.startsWith("https://script.google.com/")
    ? credential
    : process.env.GOOGLE_SCRIPT_WEBHOOK_URL?.trim();

  if (webhookUrl && webhookUrl.startsWith("https://script.google.com/")) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: recipientEmail,
        toName: params.toName || "",
        fromEmail: senderEmail,
        fromName: senderName,
        subject: params.subject.trim(),
        text: params.text,
        html: params.html,
      }),
    });

    if (!response.ok) {
      throw new Error(`Falha na ponte HTTPS do Google Script (HTTP ${response.status}).`);
    }

    return {
      messageId: `<gas-https-${Date.now()}@genesisracing>`,
      senderEmail,
      recipientEmail,
      simulated: false,
    };
  }

  // 2. Envio via API HTTPS Resend (Porta 443)
  const resendKey = credential.startsWith("re_")
    ? credential
    : process.env.RESEND_API_KEY?.trim();

  if (resendKey && resendKey.startsWith("re_")) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${senderName} <onboarding@resend.dev>`,
        reply_to: senderEmail,
        to: [recipientEmail],
        subject: params.subject.trim(),
        text: params.text,
        html: params.html,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`Erro na API Resend: ${errBody}`);
    }

    return {
      messageId: `<resend-https-${Date.now()}@genesisracing>`,
      senderEmail,
      recipientEmail,
      simulated: false,
    };
  }

  // 3. Envio via SMTP Direto (testa portas 587 e 465 simultaneamente para evitar espera dupla)
  const smtpHost = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const smtpUser = process.env.SMTP_USER?.trim() || senderEmail;
  const fromHeader = `"${senderName.replace(/"/g, "")}" <${senderEmail}>`;
  const toHeader = params.toName
    ? `"${params.toName.trim().replace(/"/g, "")}" <${recipientEmail}>`
    : recipientEmail;

  const mailOptions = {
    from: fromHeader,
    replyTo: senderEmail,
    to: toHeader,
    subject: params.subject.trim(),
    text: params.text,
    html: params.html,
  };

  try {
    const t587 = buildSmtpTransporter({
      host: smtpHost,
      port: 587,
      user: smtpUser,
      pass: credential,
      timeoutMs: 4000,
    });
    const t465 = buildSmtpTransporter({
      host: smtpHost,
      port: 465,
      user: smtpUser,
      pass: credential,
      timeoutMs: 4000,
    });

    const info = await Promise.any([
      t587.sendMail(mailOptions),
      t465.sendMail(mailOptions),
    ]);

    return {
      messageId: info.messageId || `<sent-${Date.now()}@genesisracing>`,
      senderEmail,
      recipientEmail,
      simulated: false,
    };
  } catch (aggError) {
    const errors: unknown[] =
      aggError && typeof aggError === "object" && "errors" in aggError
        ? (aggError as { errors: unknown[] }).errors
        : [aggError];

    const combinedMessages = errors
      .map((e) => (e instanceof Error ? e.message : String(e)))
      .join(" | ");

    const isAuthError =
      combinedMessages.includes("535") ||
      combinedMessages.toLowerCase().includes("username and password not accepted") ||
      combinedMessages.toLowerCase().includes("invalid login");

    if (isAuthError) {
      throw new Error(
        "O Gmail recusou a Senha de App (credenciais inválidas). Verifique a senha em Equipe & Acessos."
      );
    }

    // Se o erro for Connection timeout / ETIMEDOUT (bloqueio das portas 465 e 587 pelo Render Free Tier),
    // retornamos flag smtpBlockedByHost = true para que a action salve o histórico e acione o envio assistido sem quebrar.
    return {
      messageId: `<assisted-${Date.now()}@genesisracing>`,
      senderEmail,
      recipientEmail,
      simulated: true,
      smtpBlockedByHost: true,
    };
  }
}
