"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  ACTIVE_TEAM_COOKIE_NAME,
  getHttpOnlyCookieOptions,
} from "@/lib/auth-token";
import { prisma } from "@/lib/prisma";
import {
  createMemberSchema,
  createTeamSchema,
  deleteMemberSchema,
  deleteTeamSchema,
  loginSchema,
  toggleUserModulePermissionSchema,
  updateAllUserPermissionsSchema,
  updateMemberAccessSchema,
  type CreateMemberInput,
  type CreateTeamInput,
  type DeleteMemberInput,
  type DeleteTeamInput,
  type LoginInput,
  type ToggleUserModulePermissionInput,
  type UpdateAllUserPermissionsInput,
  type UpdateMemberAccessInput,
} from "@/lib/validations/auth";
import {
  authenticateUserService,
  createTeamMemberService,
  createTeamService,
  deleteTeamMemberService,
  deleteTeamService,
  getTeamManagementMetricsService,
  logoutUserService,
  requireAuthUser,
  requireSuperAdmin,
  toggleUserModulePermissionService,
  unlockUserAccountService,
  updateAllUserPermissionsService,
  updateTeamMemberAccessService,
} from "@/services/auth-service";
import {
  updateTeamSenderEmailSchema,
  type UpdateTeamSenderEmailInput,
} from "@/lib/validations/communication";
import { verifySmtpCredentials } from "@/services/email-service";
import type { ActionResponse } from "./financial-actions";

export async function loginAction(
  rawData: LoginInput
): Promise<ActionResponse> {
  const parsed = loginSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Informe um e-mail válido e sua senha.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await authenticateUserService(parsed.data);
    if (!result.success) {
      return {
        success: false,
        message: result.message,
      };
    }

    revalidatePath("/", "layout");
    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    console.error("[loginAction] Erro:", error);
    return {
      success: false,
      message: "Erro ao autenticar sessão. Tente novamente.",
    };
  }
}

export async function logoutAction(): Promise<ActionResponse> {
  await logoutUserService();
  revalidatePath("/", "layout");
  return {
    success: true,
    message: "Sessão finalizada com sucesso.",
  };
}

export async function createTeamAction(
  rawData: CreateTeamInput
): Promise<ActionResponse<{ id: string; name: string }>> {
  const superAdmin = await requireSuperAdmin();

  const parsed = createTeamSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique o nome e a instituição da equipe.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const createdTeam = await createTeamService(superAdmin, parsed.data);

    revalidatePath("/equipe");
    revalidatePath("/dashboard");
    revalidatePath("/planejamento");
    revalidatePath("/lancamentos");

    return {
      success: true,
      message: `Equipe "${createdTeam.name}" criada com sucesso com seus 5 setores internos!`,
      data: { id: createdTeam.id, name: createdTeam.name },
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível criar a equipe.";
    return {
      success: false,
      message,
    };
  }
}

export async function switchSuperAdminTeamAction(
  teamId: string
): Promise<ActionResponse> {
  await requireSuperAdmin();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true },
  });

  if (!team) {
    return {
      success: false,
      message: "Equipe não encontrada.",
    };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    ACTIVE_TEAM_COOKIE_NAME,
    team.id,
    getHttpOnlyCookieOptions()
  );

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/planejamento");
  revalidatePath("/lancamentos");
  revalidatePath("/equipe");

  return {
    success: true,
    message: `Visualizando dados da ${team.name}!`,
  };
}

export async function createTeamMemberAction(
  rawData: CreateMemberInput
): Promise<ActionResponse> {
  const superAdmin = await requireSuperAdmin();

  const parsed = createMemberSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os dados do novo integrante.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const created = await createTeamMemberService(superAdmin, parsed.data);

    revalidatePath("/equipe");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Integrante ${created.name} cadastrado com sucesso na equipe!`,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível cadastrar o integrante.";
    return {
      success: false,
      message,
    };
  }
}

export async function updateTeamMemberAccessAction(
  rawData: UpdateMemberAccessInput
): Promise<ActionResponse> {
  const superAdmin = await requireSuperAdmin();

  const parsed = updateMemberAccessSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os campos de equipe, setor e permissão.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const updated = await updateTeamMemberAccessService(superAdmin, parsed.data);

    revalidatePath("/equipe");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Acesso de ${updated.name} atualizado com sucesso!`,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao atualizar permissões do integrante.";
    return {
      success: false,
      message,
    };
  }
}

export async function unlockUserAccountAction(
  userId: string
): Promise<ActionResponse> {
  const superAdmin = await requireSuperAdmin();

  try {
    const unlocked = await unlockUserAccountService(superAdmin, userId);

    revalidatePath("/equipe");

    return {
      success: true,
      message: `Conta de ${unlocked.name} desbloqueada com sucesso!`,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao desbloquear conta.";
    return {
      success: false,
      message,
    };
  }
}

export async function deleteTeamAction(
  rawData: DeleteTeamInput
): Promise<ActionResponse> {
  const superAdmin = await requireSuperAdmin();

  const parsed = deleteTeamSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ||
        'Confirmação inválida. Digite "EXCLUIR" em maiúsculas.',
    };
  }

  try {
    const deletedTeam = await deleteTeamService(superAdmin, parsed.data);

    revalidatePath("/equipe");
    revalidatePath("/dashboard");
    revalidatePath("/planejamento");
    revalidatePath("/lancamentos");

    return {
      success: true,
      message: `Equipe "${deletedTeam.name}" excluída com sucesso!`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir equipe.";
    return {
      success: false,
      message,
    };
  }
}

export async function deleteTeamMemberAction(
  rawData: DeleteMemberInput
): Promise<ActionResponse> {
  const superAdmin = await requireSuperAdmin();

  const parsed = deleteMemberSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dados inválidos para remoção do integrante.",
    };
  }

  try {
    const deleted = await deleteTeamMemberService(superAdmin, parsed.data);

    revalidatePath("/equipe");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Integrante "${deleted.name}" excluído com sucesso!`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao excluir integrante.";
    return {
      success: false,
      message,
    };
  }
}

export async function getTeamManagementMetricsAction() {
  await requireSuperAdmin();
  return getTeamManagementMetricsService();
}

export async function updateTeamSenderEmailAction(
  rawData: UpdateTeamSenderEmailInput
): Promise<ActionResponse> {
  const user = await requireAuthUser();

  if (user.role === "AUDITOR") {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = updateTeamSenderEmailSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ||
        "Informe um endereço de e-mail válido.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const cleanPass = parsed.data.smtpAppPassword
      ? parsed.data.smtpAppPassword.replace(/\s+/g, "").trim()
      : undefined;

    let warningNote: string | undefined;

    if (cleanPass) {
      const verification = await verifySmtpCredentials({
        senderEmail: parsed.data.senderEmail,
        smtpAppPassword: cleanPass,
      });

      if (!verification.valid) {
        return {
          success: false,
          message:
            verification.errorMessage ||
            "Não foi possível autorizar o e-mail junto ao servidor SMTP.",
        };
      }
      warningNote = verification.warning;
    }

    const updated = await prisma.team.update({
      where: { id: parsed.data.teamId },
      data: {
        senderEmail: parsed.data.senderEmail,
        ...(cleanPass ? { smtpAppPassword: cleanPass } : {}),
      },
    });

    // Sincroniza a credencial nas demais equipes que utilizam o mesmo endereço remetente
    if (cleanPass) {
      await prisma.team.updateMany({
        where: { senderEmail: parsed.data.senderEmail },
        data: { smtpAppPassword: cleanPass },
      });
    }

    revalidatePath("/equipe");
    revalidatePath("/comunicacao");

    const baseMessage = cleanPass
      ? `E-mail "${updated.senderEmail}" autorizado e ativado com sucesso!`
      : `E-mail remetente atualizado para "${updated.senderEmail}"!`;

    return {
      success: true,
      message: warningNote ? `${baseMessage} ${warningNote}` : baseMessage,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o e-mail de envio da equipe.",
    };
  }
}

export async function revokeTeamEmailAuthorizationAction(
  teamId: string
): Promise<ActionResponse> {
  const user = await requireAuthUser();

  if (user.role === "AUDITOR") {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  try {
    await prisma.team.update({
      where: { id: teamId },
      data: { smtpAppPassword: null },
    });

    revalidatePath("/equipe");
    revalidatePath("/comunicacao");

    return {
      success: true,
      message: "Autorização SMTP desconectada. O status de envio agora está Inativo.",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao desconectar autorização de e-mail.",
    };
  }
}

export async function toggleUserModulePermissionAction(
  rawData: ToggleUserModulePermissionInput
): Promise<ActionResponse> {
  const adminUser = await requireAuthUser();

  const parsed = toggleUserModulePermissionSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dados de permissão inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const updatedPermissions = await toggleUserModulePermissionService(
      adminUser,
      parsed.data
    );

    revalidatePath("/permissoes");
    revalidatePath("/equipe");
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Permissão atualizada com sucesso.",
      data: updatedPermissions,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar permissão do usuário.",
    };
  }
}

export async function updateAllUserPermissionsAction(
  rawData: UpdateAllUserPermissionsInput
): Promise<ActionResponse> {
  const adminUser = await requireAuthUser();

  const parsed = updateAllUserPermissionsSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Dados de permissão em lote inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const updatedPermissions = await updateAllUserPermissionsService(
      adminUser,
      parsed.data
    );

    revalidatePath("/permissoes");
    revalidatePath("/equipe");
    revalidatePath("/", "layout");

    return {
      success: true,
      message: "Permissões atualizadas com sucesso.",
      data: updatedPermissions,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar permissões do usuário.",
    };
  }
}
