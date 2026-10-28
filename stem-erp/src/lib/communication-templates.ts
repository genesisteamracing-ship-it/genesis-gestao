import type {
  GeneratedCommunicationMessage,
  ReportDataPayload,
  StakeholderGroup,
} from "@/types/communication";

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function getGreetingForGroup(group: StakeholderGroup, contactName: string): string {
  switch (group) {
    case "SPONSORS":
      return `Prezado(a) ${contactName}, esperamos que este comunicado o(a) encontre bem.`;
    case "SCHOOL_LEADERSHIP":
      return `Prezada Direção e Coordenação, aos cuidados de ${contactName}.`;
    case "PARENTS_GUARDIANS":
      return `Olá ${contactName}, pais e familiares da equipe! Esperamos que estejam todos bem.`;
    case "TECHNICAL_MENTORS":
      return `Fala ${contactName}, mentor(a)! Compartilhamos o status técnico e operacional mais recente.`;
    case "COMPETITION_OFFICIALS":
      return `Prezada Comissão Organizadora, aos cuidados de ${contactName}.`;
    case "COMMUNITY_FANS":
    default:
      return `Olá ${contactName}, apoiador(a) da nossa jornada STEM!`;
  }
}

export interface BuildReportOptions {
  recipientName: string;
  recipientPhone?: string | null;
  group: StakeholderGroup;
  reportType: "FINANCIAL" | "ROI" | "COMBINED";
  data: ReportDataPayload;
  customMessage?: string;
}

export function generateCommunicationReport(options: BuildReportOptions): GeneratedCommunicationMessage {
  const { recipientName, recipientPhone, group, reportType, data, customMessage } = options;
  const greeting = getGreetingForGroup(group, recipientName);
  const dateFormatted = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(data.generatedAt));

  // 1. Geração para WhatsApp
  const waLines: string[] = [];
  waLines.push(`🏁 *${data.teamName.toUpperCase()} | RELATÓRIO OFICIAL DE TRANSPARÊNCIA*`);
  waLines.push(`📅 *Data de Emissão:* ${dateFormatted}`);
  waLines.push("");
  waLines.push(greeting);
  waLines.push("");

  if (customMessage && customMessage.trim().length > 0) {
    waLines.push(`📌 *Nota da Liderança:*`);
    waLines.push(customMessage.trim());
    waLines.push("");
  }

  let subject = `Relatório Oficial - ${data.teamName} (${dateFormatted})`;

  if (reportType === "FINANCIAL" || reportType === "COMBINED") {
    waLines.push(`📊 *BALANÇO FINANCEIRO DA TEMPORADA*`);
    waLines.push(`• Total Arrecadado (Origens): *${formatCurrency(data.financialMetrics.totalRevenueCents)}*`);
    waLines.push(`• Total Aplicado (Custos/Peças): *${formatCurrency(data.financialMetrics.totalExpenseCents)}*`);
    waLines.push(`• Saldo em Caixa Atual: *${formatCurrency(data.financialMetrics.currentBalanceCents)}*`);
    if (data.financialMetrics.inKindTotalCents > 0) {
      waLines.push(`• Apoio em Serviços/Barter (In-Kind): *${formatCurrency(data.financialMetrics.inKindTotalCents)}*`);
    }
    waLines.push(`• Autonomia Projetada (Runway): *${data.financialMetrics.projectedRunwayMonths} mês(es)*`);
    waLines.push("");
  }

  if (reportType === "ROI" || reportType === "COMBINED") {
    subject = reportType === "ROI" 
      ? `Relatório de Contrapartidas & ROI - ${data.teamName}` 
      : subject;

    waLines.push(`📈 *RETORNO SOBRE O INVESTIMENTO (ROI DE PATROCÍNIO)*`);
    waLines.push(`• Investimento Direto Captado: *${formatCurrency(data.roiMetrics.totalDirectInvestmentCents)}*`);
    waLines.push(`• Valor em Mídia e Entregas Geradas: *${formatCurrency(data.roiMetrics.totalDeliveredValueCents)}*`);
    waLines.push(`• Índice de Retorno Geral: *${data.roiMetrics.roiPercentage}%*`);
    waLines.push("");

    if (data.recentActions.length > 0) {
      waLines.push(`🚀 *ÚLTIMAS ENTREGAS E EXPOSIÇÃO:*`);
      data.recentActions.slice(0, 3).forEach((action) => {
        const actionDate = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(action.date));
        waLines.push(`• [${actionDate}] *${action.title}* (${action.sponsorName}) - Retorno: ${formatCurrency(action.valueCents)}${action.reachCount ? ` | Alcance: ${action.reachCount.toLocaleString("pt-BR")} pessoas` : ""}`);
      });
      waLines.push("");
    }
  }

  waLines.push(`🤝 _Agradecemos imensamente a sua confiança e parceria no desenvolvimento dos nossos estudantes e engenheiros do futuro!_`);
  waLines.push(`💬 Dúvidas, sugestões ou feedbacks? Responda diretamente esta mensagem.`);

  const whatsappText = waLines.join("\n");

  // Formatar número de telefone limpo para link wa.me
  const cleanPhone = recipientPhone ? recipientPhone.replace(/\D/g, "") : "";
  const phoneParam = cleanPhone.length >= 10 ? (cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`) : "";
  const encodedText = encodeURIComponent(whatsappText);
  const whatsappLink = phoneParam.length > 0
    ? `https://wa.me/${phoneParam}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  // 2. Geração para E-mail (HTML estruturado profissional com tokens neutros e estilos inline para clientes de e-mail)
  const emailHtml = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; border: 1px solid #e4e4e7; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background-color: #18181b; padding: 20px 24px; color: #ffffff;">
      <h2 style="margin: 0; font-size: 18px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">${data.teamName} | Relatório de Transparência</h2>
      <p style="margin: 4px 0 0; font-size: 13px; color: #a1a1aa;">Data de Emissão: ${dateFormatted}</p>
    </div>
    
    <div style="padding: 24px;">
      <p style="font-size: 15px; line-height: 1.5; margin-top: 0;">${greeting}</p>
      
      ${customMessage ? `
      <div style="background-color: #f4f4f5; border-left: 4px solid #18181b; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <strong style="display: block; font-size: 13px; margin-bottom: 4px;">Nota da Equipe:</strong>
        <span style="font-size: 14px; color: #3f3f46;">${customMessage.trim()}</span>
      </div>` : ""}

      ${(reportType === "FINANCIAL" || reportType === "COMBINED") ? `
      <h3 style="font-size: 16px; border-bottom: 2px solid #e4e4e7; padding-bottom: 8px; margin-top: 24px; color: #09090b;">📊 Balanço Financeiro da Temporada</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 12px;">
        <tr style="border-bottom: 1px solid #f4f4f5;">
          <td style="padding: 8px 0; color: #52525b;">Total Arrecadado (Origens):</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #16a34a;">${formatCurrency(data.financialMetrics.totalRevenueCents)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f4f4f5;">
          <td style="padding: 8px 0; color: #52525b;">Total Aplicado (Custos/Peças):</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #dc2626;">${formatCurrency(data.financialMetrics.totalExpenseCents)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f4f4f5;">
          <td style="padding: 8px 0; color: #52525b;">Saldo em Caixa Atual:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #09090b;">${formatCurrency(data.financialMetrics.currentBalanceCents)}</td>
        </tr>
        ${data.financialMetrics.inKindTotalCents > 0 ? `
        <tr style="border-bottom: 1px solid #f4f4f5;">
          <td style="padding: 8px 0; color: #52525b;">Apoio em Barter / Serviços:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #0284c7;">${formatCurrency(data.financialMetrics.inKindTotalCents)}</td>
        </tr>` : ""}
        <tr>
          <td style="padding: 8px 0; color: #52525b;">Autonomia Projetada (Runway):</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #09090b;">${data.financialMetrics.projectedRunwayMonths} mês(es)</td>
        </tr>
      </table>` : ""}

      ${(reportType === "ROI" || reportType === "COMBINED") ? `
      <h3 style="font-size: 16px; border-bottom: 2px solid #e4e4e7; padding-bottom: 8px; margin-top: 24px; color: #09090b;">📈 Retorno sobre Investimento (ROI de Patrocínio)</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 12px;">
        <tr style="border-bottom: 1px solid #f4f4f5;">
          <td style="padding: 8px 0; color: #52525b;">Investimento Direto Captado:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #09090b;">${formatCurrency(data.roiMetrics.totalDirectInvestmentCents)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #f4f4f5;">
          <td style="padding: 8px 0; color: #52525b;">Valor de Retorno Entregue:</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #16a34a;">${formatCurrency(data.roiMetrics.totalDeliveredValueCents)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #52525b;">Índice Geral de Retorno (ROI):</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 700; color: #2563eb;">${data.roiMetrics.roiPercentage}%</td>
        </tr>
      </table>` : ""}

      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e4e4e7; font-size: 13px; color: #71717a; text-align: center;">
        <p style="margin: 0;">Equipe ${data.teamName} • Compromisso com a Educação e Engenharia STEM</p>
        <p style="margin: 4px 0 0;">Para qualquer dúvida ou feedback, responda a este e-mail diretamente.</p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();

  // 3. E-mail Plain Text
  const emailPlainText = waLines
    .join("\n")
    .replace(/\*/g, "")
    .replace(/_/g, "");

  return {
    subject,
    whatsappText,
    whatsappLink,
    emailSubject: subject,
    emailHtml,
    emailPlainText,
  };
}
