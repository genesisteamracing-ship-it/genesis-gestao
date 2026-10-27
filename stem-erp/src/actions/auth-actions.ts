"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ACTIVE_TEAM_COOKIE_NAME,
  getHttpOnlyCookieOptions,
} from "@/lib/auth-token";
import { prisma } from "@/lib/prisma";
import {
  createMemberSchema,
  createTeamSchema,
  deleteTeamSchema,
  loginSchema,
  updateMemberAccessSchema,
  type CreateMemberInput,
  type CreateTeamInput,
  type DeleteTeamInput,
  type LoginInput,
  type UpdateMemberAccessInput,
} from "@/lib/validations/auth";
import {
  authenticateUserService,
  createTeamMemberService,
  createTeamService,
  deleteTeamService,
  getTeamManagementMetricsService,
  logoutUserService,
  requireSuperAdmin,
  unlockUserAccountService,
  updateTeamMemberAccessService,
} from "@/services/auth-service";
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

export async function getTeamManagementMetricsAction() {
  await requireSuperAdmin();
  return getTeamManagementMetricsService();
}
