"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import {
  createBudgetResourceSchema,
  createCategorySchema,
  createTransactionSchema,
  deleteBudgetResourceSchema,
  deleteTransactionSchema,
  updateBudgetResourceSchema,
  updateTransactionSchema,
  type CreateBudgetResourceInput,
  type CreateCategoryInput,
  type CreateTransactionInput,
  type DeleteBudgetResourceInput,
  type DeleteTransactionInput,
  type UpdateBudgetResourceInput,
  type UpdateTransactionInput,
} from "@/lib/validations/financial";
import { requireAuthUser } from "@/services/auth-service";
import {
  createBudgetResourceService,
  createCategoryService,
  createTransactionService,
  deleteBudgetResourceService,
  deleteTransactionService,
  getDashboardMetricsService,
  resolveActiveTeam,
  updateBudgetResourceService,
  updateTransactionService,
} from "@/services/financial-service";
import type { CategoryDTO, DashboardMetricsDTO } from "@/types/financial";

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function createBudgetResourceAction(
  rawData: CreateBudgetResourceInput
): Promise<ActionResponse<{ code: string }>> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = createBudgetResourceSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os campos do formulário de planejamento.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    const created = await createBudgetResourceService(activeTeam.id, parsed.data);

    revalidatePath("/dashboard");
    revalidatePath("/planejamento");
    revalidatePath("/lancamentos");

    return {
      success: true,
      message: `Recurso ${created.code} planejado na ${activeTeam.name} com sucesso!`,
      data: { code: created.code },
    };
  } catch (error) {
    console.error("[createBudgetResourceAction] Erro:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível salvar o recurso orçamentário. Tente novamente.";
    return {
      success: false,
      message,
    };
  }
}

export async function createTransactionAction(
  rawData: CreateTransactionInput
): Promise<ActionResponse> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = createTransactionSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os campos do lançamento financeiro.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    await createTransactionService(activeTeam.id, parsed.data);

    revalidatePath("/dashboard");
    revalidatePath("/planejamento");
    revalidatePath("/lancamentos");

    return {
      success: true,
      message: parsed.data.isBarterCounterpart
        ? `Permuta contabilizada (Origem + Aplicação) na ${activeTeam.name}!`
        : `Lançamento financeiro registrado na ${activeTeam.name}!`,
    };
  } catch (error) {
    console.error("[createTransactionAction] Erro:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível registrar o lançamento financeiro. Tente novamente.";
    return {
      success: false,
      message,
    };
  }
}

export async function updateBudgetResourceAction(
  rawData: UpdateBudgetResourceInput
): Promise<ActionResponse> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = updateBudgetResourceSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os dados da atualização do recurso orçamentário.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    const updated = await updateBudgetResourceService(activeTeam.id, parsed.data);

    revalidatePath("/dashboard");
    revalidatePath("/planejamento");
    revalidatePath("/lancamentos");

    return {
      success: true,
      message: `Recurso ${updated.code} atualizado com sucesso!`,
    };
  } catch (error) {
    console.error("[updateBudgetResourceAction] Erro:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar recurso orçamentário.";
    return {
      success: false,
      message,
    };
  }
}

export async function deleteBudgetResourceAction(
  rawData: DeleteBudgetResourceInput
): Promise<ActionResponse> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = deleteBudgetResourceSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "ID de recurso inválido.",
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    const deleted = await deleteBudgetResourceService(activeTeam.id, parsed.data);

    revalidatePath("/dashboard");
    revalidatePath("/planejamento");
    revalidatePath("/lancamentos");

    return {
      success: true,
      message: `Recurso ${deleted.code} (${deleted.resourceName}) excluído com sucesso!`,
    };
  } catch (error) {
    console.error("[deleteBudgetResourceAction] Erro:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao excluir recurso orçamentário.";
    return {
      success: false,
      message,
    };
  }
}

export async function updateTransactionAction(
  rawData: UpdateTransactionInput
): Promise<ActionResponse> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = updateTransactionSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os dados da atualização do lançamento.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    await updateTransactionService(activeTeam.id, parsed.data);

    revalidatePath("/dashboard");
    revalidatePath("/planejamento");
    revalidatePath("/lancamentos");

    return {
      success: true,
      message: "Lançamento financeiro atualizado com sucesso!",
    };
  } catch (error) {
    console.error("[updateTransactionAction] Erro:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao atualizar lançamento.";
    return {
      success: false,
      message,
    };
  }
}

export async function deleteTransactionAction(
  rawData: DeleteTransactionInput
): Promise<ActionResponse> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = deleteTransactionSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "ID de lançamento inválido.",
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    const deleted = await deleteTransactionService(activeTeam.id, parsed.data);

    revalidatePath("/dashboard");
    revalidatePath("/planejamento");
    revalidatePath("/lancamentos");

    return {
      success: true,
      message: `Lançamento "${deleted.description}" excluído com sucesso!`,
    };
  } catch (error) {
    console.error("[deleteTransactionAction] Erro:", error);
    const message =
      error instanceof Error ? error.message : "Erro ao excluir lançamento.";
    return {
      success: false,
      message,
    };
  }
}

export async function createCategoryAction(
  rawData: CreateCategoryInput
): Promise<ActionResponse<CategoryDTO>> {
  const user = await requireAuthUser();

  if (user.role === UserRole.AUDITOR) {
    return {
      success: false,
      message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
    };
  }

  const parsed = createCategorySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message:
        parsed.error.issues[0]?.message ||
        "Verifique o nome da nova categoria.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { activeTeam } = await resolveActiveTeam(user);
    const created = await createCategoryService(activeTeam.id, parsed.data);

    revalidatePath("/dashboard");
    revalidatePath("/planejamento");
    revalidatePath("/lancamentos");

    return {
      success: true,
      message: `Categoria "${created.name}" cadastrada com sucesso!`,
      data: created,
    };
  } catch (error) {
    console.error("[createCategoryAction] Erro:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível cadastrar a categoria.";
    return {
      success: false,
      message,
    };
  }
}

export async function getDashboardMetricsAction(): Promise<DashboardMetricsDTO> {
  const user = await requireAuthUser();
  return getDashboardMetricsService(user);
}
