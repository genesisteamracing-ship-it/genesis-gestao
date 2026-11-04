"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/services/auth-service";
import { resolveActiveTeam } from "@/services/financial-service";
import { sendAutomatedEmail } from "@/services/email-service";
import {
  createCommunicationFeedback,
  createCommunicationLog,
  createCommunicationPlan,
  createStakeholder,
  deleteStakeholder,
  getReportDataPayload,
  updateFeedbackAddressedStatus,
  updateStakeholder,
} from "@/services/communication-service";
import {
  createCommunicationLogSchema,
  createCommunicationPlanSchema,
  createFeedbackSchema,
  createStakeholderSchema,
  sendStakeholderReportEmailSchema,
  updateStakeholderSchema,
  type CreateCommunicationLogInput,
  type CreateCommunicationPlanInput,
  type CreateFeedbackInput,
  type CreateStakeholderInput,
  type SendStakeholderReportEmailInput,
  type UpdateStakeholderInput,
} from "@/lib/validations/communication";
import {
  generateCommunicationReport,
} from "@/lib/communication-templates";
import type { GeneratedCommunicationMessage, StakeholderGroup } from "@/types/communication";

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function createStakeholderAction(
  rawData: CreateStakeholderInput
): Promise<ActionResponse<{ id: string }>> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = createStakeholderSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Por favor, corrija os erros no cadastro de stakeholder.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    const created = await createStakeholder(activeTeam.id, parsed.data);

    revalidatePath("/comunicacao");

    return {
      success: true,
      message: `Stakeholder "${created.name}" cadastrado com sucesso!`,
      data: { id: created.id },
    };
  } catch (error) {
    console.error("[createStakeholderAction] Erro:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao cadastrar stakeholder.",
    };
  }
}

export async function updateStakeholderAction(
  rawData: UpdateStakeholderInput
): Promise<ActionResponse<{ id: string }>> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = updateStakeholderSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Por favor, corrija os erros na atualização de stakeholder.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    const updated = await updateStakeholder(activeTeam.id, parsed.data);

    revalidatePath("/comunicacao");

    return {
      success: true,
      message: `Stakeholder "${updated.name}" atualizado com sucesso!`,
      data: { id: updated.id },
    };
  } catch (error) {
    console.error("[updateStakeholderAction] Erro:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao atualizar stakeholder.",
    };
  }
}

export async function updateStakeholderHierarchyAction(params: {
  stakeholderId: string;
  power: "LOW" | "HIGH";
  interest: "LOW" | "HIGH";
  parentStakeholderId?: string | null;
  organization?: string | null;
}): Promise<ActionResponse<{ id: string }>> {
  return updateStakeholderAction({
    id: params.stakeholderId,
    power: params.power,
    interest: params.interest,
    parentStakeholderId: params.parentStakeholderId,
    organization: params.organization,
  });
}

export async function deleteStakeholderAction(
  id: string
): Promise<ActionResponse<void>> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    await deleteStakeholder(activeTeam.id, id);

    revalidatePath("/comunicacao");

    return {
      success: true,
      message: "Stakeholder removido com sucesso.",
    };
  } catch (error) {
    console.error("[deleteStakeholderAction] Erro:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao remover stakeholder.",
    };
  }
}

export async function createCommunicationPlanAction(
  rawData: CreateCommunicationPlanInput
): Promise<ActionResponse<{ id: string }>> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = createCommunicationPlanSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Por favor, preencha corretamente os campos da régua de comunicação.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    const plan = await createCommunicationPlan(activeTeam.id, parsed.data);

    revalidatePath("/comunicacao");

    return {
      success: true,
      message: `Plano "${plan.title}" criado com sucesso!`,
      data: { id: plan.id },
    };
  } catch (error) {
    console.error("[createCommunicationPlanAction] Erro:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao criar plano de comunicação.",
    };
  }
}

export async function createCommunicationLogAction(
  rawData: CreateCommunicationLogInput
): Promise<ActionResponse<{ id: string }>> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = createCommunicationLogSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Por favor, preencha os dados do registro de comunicação.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    const log = await createCommunicationLog(activeTeam.id, parsed.data);

    revalidatePath("/comunicacao");

    return {
      success: true,
      message: "Comunicação registrada no histórico com sucesso!",
      data: { id: log.id },
    };
  } catch (error) {
    console.error("[createCommunicationLogAction] Erro:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao registrar comunicação.",
    };
  }
}

export async function createFeedbackAction(
  rawData: CreateFeedbackInput
): Promise<ActionResponse<{ id: string }>> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = createFeedbackSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Por favor, verifique os campos do feedback.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    const feedback = await createCommunicationFeedback(activeTeam.id, parsed.data);

    revalidatePath("/comunicacao");

    return {
      success: true,
      message: "Ciclo de feedback registrado com evidência de melhoria contínua!",
      data: { id: feedback.id },
    };
  } catch (error) {
    console.error("[createFeedbackAction] Erro:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao registrar feedback.",
    };
  }
}

export async function updateFeedbackStatusAction(
  feedbackId: string,
  isAddressed: boolean,
  actionText?: string
): Promise<ActionResponse<void>> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    await updateFeedbackAddressedStatus(activeTeam.id, feedbackId, isAddressed, actionText);

    revalidatePath("/comunicacao");

    return {
      success: true,
      message: "Status da melhoria contínua atualizado com sucesso!",
    };
  } catch (error) {
    console.error("[updateFeedbackStatusAction] Erro:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao atualizar status do feedback.",
    };
  }
}

export async function generateReportMessageAction(params: {
  recipientName: string;
  recipientPhone?: string | null;
  group: StakeholderGroup;
  reportType: "FINANCIAL" | "ROI" | "COMBINED";
  customMessage?: string;
}): Promise<ActionResponse<GeneratedCommunicationMessage>> {
  const user = await requireAuthUser();

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    const reportData = await getReportDataPayload(activeTeam.id);

    const generated = generateCommunicationReport({
      recipientName: params.recipientName,
      recipientPhone: params.recipientPhone,
      group: params.group,
      reportType: params.reportType,
      data: reportData,
      customMessage: params.customMessage,
    });

    return {
      success: true,
      message: "Relatório gerado com dados atualizados!",
      data: generated,
    };
  } catch (error) {
    console.error("[generateReportMessageAction] Erro:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao gerar relatório.",
    };
  }
}

export async function sendStakeholderReportEmailAction(
  rawData: SendStakeholderReportEmailInput
): Promise<
  ActionResponse<{
    logId: string;
    recipientEmail: string;
    senderEmail: string;
    simulated: boolean;
  }>
> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = sendStakeholderReportEmailSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os dados do relatório antes de enviar o e-mail.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    const stakeholder = await prisma.stakeholder.findFirst({
      where: {
        id: parsed.data.stakeholderId,
        teamId: activeTeam.id,
      },
    });

    if (!stakeholder) {
      return {
        success: false,
        message: "Stakeholder não encontrado na equipe ativa.",
      };
    }

    if (!stakeholder.email || !stakeholder.email.includes("@")) {
      return {
        success: false,
        message: `O stakeholder "${stakeholder.name}" não possui um endereço de e-mail cadastrado.`,
      };
    }

    const emailResult = await sendAutomatedEmail({
      fromEmail: activeTeam.senderEmail || "genesisteamracing@gmail.com",
      fromName: activeTeam.name,
      toEmail: stakeholder.email,
      toName: stakeholder.name,
      subject: parsed.data.subject,
      text: parsed.data.emailText,
      html: parsed.data.emailHtml,
    });

    const log = await createCommunicationLog(activeTeam.id, {
      stakeholderId: stakeholder.id,
      subject: parsed.data.subject,
      channel: "EMAIL",
      dispatchedByName: user.name,
      contentSummary: parsed.data.emailText.slice(0, 240),
      reportTypeIncluded: parsed.data.reportType,
    });

    revalidatePath("/comunicacao");

    return {
      success: true,
      message: `E-mail enviado com sucesso para ${emailResult.recipientEmail} (via ${emailResult.senderEmail})!`,
      data: {
        logId: log.id,
        recipientEmail: emailResult.recipientEmail,
        senderEmail: emailResult.senderEmail,
        simulated: emailResult.simulated,
      },
    };
  } catch (error) {
    console.error("[sendStakeholderReportEmailAction] Erro:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Erro ao enviar e-mail do relatório.",
    };
  }
}
