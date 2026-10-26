"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import {
  createBudgetResourceSchema,
  createTransactionSchema,
  type CreateBudgetResourceInput,
  type CreateTransactionInput,
} from "@/lib/validations/financial";
import { requireAuthUser } from "@/services/auth-service";
import {
  createBudgetResourceService,
  createTransactionService,
  getDashboardMetricsService,
  resolveActiveTeam,
} from "@/services/financial-service";
import type { DashboardMetricsDTO } from "@/types/financial";

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

export async function getDashboardMetricsAction(): Promise<DashboardMetricsDTO> {
  const user = await requireAuthUser();
  return getDashboardMetricsService(user);
}
