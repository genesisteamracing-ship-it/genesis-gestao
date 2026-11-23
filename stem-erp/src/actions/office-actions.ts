"use server";

import { requireAuthUser } from "@/services/auth-service";
import { resolveActiveTeam } from "@/services/financial-service";
import { getOfficeSnapshotService } from "@/services/office-service";
import type { OfficeSnapshotDTO } from "@/types/office";

export interface OfficeActionResult {
  success: boolean;
  data?: OfficeSnapshotDTO;
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
