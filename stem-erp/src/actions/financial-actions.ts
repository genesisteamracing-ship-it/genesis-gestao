"use server";

import { revalidatePath } from "next/cache";
import {
  createBudgetResourceSchema,
  createTransactionSchema,
  type CreateBudgetResourceInput,
  type CreateTransactionInput,
} from "@/lib/validations/financial";
import {
  createBudgetResourceService,
  createTransactionService,
  getDashboardMetricsService,
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
  const parsed = createBudgetResourceSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os campos do formulário de planejamento.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const created = await createBudgetResourceService(parsed.data);

    revalidatePath("/dashboard");
    revalidatePath("/planejamento");
    revalidatePath("/lancamentos");

    return {
      success: true,
      message: `Recurso ${created.code} planejado com sucesso!`,
      data: { code: created.code },
    };
  } catch (error) {
    console.error("[createBudgetResourceAction] Erro:", error);
    return {
      success: false,
      message: "Não foi possível salvar o recurso orçamentário. Tente novamente.",
    };
  }
}

export async function createTransactionAction(
  rawData: CreateTransactionInput
): Promise<ActionResponse> {
  const parsed = createTransactionSchema.safeParse(rawData);

  if (!parsed.success) {
    return {
      success: false,
      message: "Verifique os campos do lançamento financeiro.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await createTransactionService(parsed.data);

    revalidatePath("/dashboard");
    revalidatePath("/planejamento");
    revalidatePath("/lancamentos");

    return {
      success: true,
      message: parsed.data.isBarterCounterpart
        ? "Permuta contabilizada (Origem + Aplicação) com sucesso!"
        : "Lançamento financeiro registrado com sucesso!",
    };
  } catch (error) {
    console.error("[createTransactionAction] Erro:", error);
    return {
      success: false,
      message: "Não foi possível registrar o lançamento financeiro. Tente novamente.",
    };
  }
}

export async function getDashboardMetricsAction(): Promise<DashboardMetricsDTO> {
  return getDashboardMetricsService();
}
