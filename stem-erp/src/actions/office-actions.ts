"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { requireAuthUser } from "@/services/auth-service";
import { resolveActiveTeam } from "@/services/financial-service";
import {
  getOfficeSnapshotService,
  markTrainingAttendanceService,
} from "@/services/office-service";
import type { OfficeSnapshotDTO } from "@/types/office";

export interface OfficeActionResult {
  success: boolean;
  data?: OfficeSnapshotDTO;
  message?: string;
  alreadyMarked?: boolean;
  error?: string;
}

export async function getOfficeSnapshotAction(): Promise<OfficeActionResult> {
  try {
    const user = await requireAuthUser();
    const { activeTeam } = await resolveActiveTeam(user);
    const snapshot = await getOfficeSnapshotService(
      user,
      activeTeam.id,
      activeTeam.name
    );

    return {
      success: true,
      data: snapshot,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível carregar os dados do escritório virtual.";

    return {
      success: false,
      error: message,
    };
  }
}

export async function markTrainingAttendanceAction(
  notes?: string
): Promise<OfficeActionResult> {
  try {
    const user = await requireAuthUser();

    if (user.role === UserRole.AUDITOR) {
      return {
        success: false,
        error: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
      };
    }

    const { activeTeam } = await resolveActiveTeam(user);
    const { alreadyMarked } = await markTrainingAttendanceService(
      user,
      activeTeam.id,
      notes
    );

    const snapshot = await getOfficeSnapshotService(
      user,
      activeTeam.id,
      activeTeam.name
    );

    revalidatePath("/office");

    return {
      success: true,
      alreadyMarked,
      message: alreadyMarked
        ? "Sua presença no treino de hoje já foi registrada."
        : "Presença marcada com sucesso no treino de hoje!",
      data: snapshot,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível marcar presença no treino.";

    return {
      success: false,
      error: message,
    };
  }
}
