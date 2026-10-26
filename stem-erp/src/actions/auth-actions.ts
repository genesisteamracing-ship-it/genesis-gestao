"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createMemberSchema,
  loginSchema,
  updateMemberAccessSchema,
  type CreateMemberInput,
  type LoginInput,
  type UpdateMemberAccessInput,
} from "@/lib/validations/auth";
import {
  authenticateUserService,
  createTeamMemberService,
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

export async function logoutAction(): Promise<void> {
  await logoutUserService();
  redirect("/login");
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
      message: "Verifique os campos de permissão e equipe.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const updated = await updateTeamMemberAccessService(superAdmin, parsed.data);

    revalidatePath("/equipe");
    revalidatePath("/dashboard");

    return {
      success: true,
      message: `Permissões de ${updated.name} atualizadas com sucesso!`,
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

export async function getTeamManagementMetricsAction() {
  await requireSuperAdmin();
  return getTeamManagementMetricsService();
}
