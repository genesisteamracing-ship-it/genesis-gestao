"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/services/auth-service";
import { resolveActiveTeam } from "@/services/financial-service";
import { buildWbsTree } from "@/services/wbs-rollup.service";
import {
  createWbsNodeSchema,
  updateWbsNodeSchema,
  deleteWbsNodeSchema,
  type CreateWbsNodeInput,
  type UpdateWbsNodeInput,
  type DeleteWbsNodeInput,
} from "@/lib/validations/wbs.schema";
import type { WbsNodeDTO, WbsTreeDataResult } from "@/types/wbs";

export interface ActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  fieldErrors?: Record<string, string[] | undefined>;
}

export async function getWbsTreeAction(
  targetTeamId?: string
): Promise<ActionResponse<WbsTreeDataResult>> {
  try {
    const user = await requireAuthUser();
    const { activeTeam } = await resolveActiveTeam(user);

    const teamId =
      user.role === UserRole.SUPER_ADMIN && targetTeamId
        ? targetTeamId
        : activeTeam.id;

    const [rawNodes, members] = await Promise.all([
      prisma.wbsNode.findMany({
        where: { teamId },
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      }),
      prisma.user.findMany({
        where: { teamId, isActive: true },
        select: {
          id: true,
          name: true,
          jobTitle: true,
          deliveryGroup: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

    const dtoArray: WbsNodeDTO[] = rawNodes.map((n) => ({
      id: n.id,
      teamId: n.teamId,
      parentId: n.parentId,
      code: n.code,
      title: n.title,
      description: n.description,
      discipline: n.discipline,
      ownerId: n.ownerId,
      ownerName: n.ownerName,
      status: n.status,
      estimatedCostCents: n.estimatedCostCents,
      estimatedHours: n.estimatedHours,
      sortOrder: n.sortOrder,
      depth: n.depth,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));

    const { tree, metrics } = buildWbsTree(dtoArray);

    return {
      success: true,
      message: "Estrutura da WBS carregada com sucesso.",
      data: {
        tree,
        metrics,
        members,
      },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro desconhecido ao carregar WBS";
    return {
      success: false,
      message: msg,
    };
  }
}

export async function createWbsNodeAction(
  rawData: CreateWbsNodeInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await requireAuthUser();

    if (user.role === UserRole.AUDITOR) {
      return {
        success: false,
        message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
      };
    }

    const parsed = createWbsNodeSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Dados do entregável inválidos. Corrija os erros apontados.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const {
      teamId,
      parentId,
      code,
      title,
      description,
      discipline,
      ownerId,
      status,
      estimatedCostCents,
      estimatedHours,
      sortOrder,
    } = parsed.data;

    // Verifica se já existe um nó com esse código na mesma equipe
    const existing = await prisma.wbsNode.findUnique({
      where: {
        teamId_code: {
          teamId,
          code,
        },
      },
    });

    if (existing) {
      return {
        success: false,
        message: `Já existe um entregável cadastrado com o código EAP "${code}".`,
        fieldErrors: {
          code: [`O código EAP "${code}" já está em uso na equipe.`],
        },
      };
    }

    // Calcula profundidade baseada no nó pai
    let depth = 1;
    if (parentId) {
      const parent = await prisma.wbsNode.findUnique({
        where: { id: parentId },
      });
      if (parent) {
        depth = parent.depth + 1;
      }
    }

    // Busca nome do responsável se ownerId for informado
    let ownerName: string | null = null;
    if (ownerId) {
      const ownerUser = await prisma.user.findUnique({
        where: { id: ownerId },
        select: { name: true },
      });
      ownerName = ownerUser?.name ?? null;
    }

    const created = await prisma.wbsNode.create({
      data: {
        teamId,
        parentId: parentId || null,
        code,
        title,
        description: description || null,
        discipline,
        ownerId: ownerId || null,
        ownerName,
        status,
        estimatedCostCents,
        estimatedHours,
        sortOrder,
        depth,
      },
    });

    revalidatePath("/documentos");

    return {
      success: true,
      message: `Entregável "${created.code} - ${created.title}" criado com sucesso!`,
      data: { id: created.id },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao criar entregável da WBS";
    return {
      success: false,
      message: msg,
    };
  }
}

export async function updateWbsNodeAction(
  rawData: UpdateWbsNodeInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await requireAuthUser();

    if (user.role === UserRole.AUDITOR) {
      return {
        success: false,
        message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
      };
    }

    const parsed = updateWbsNodeSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Dados de atualização inválidos.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const { id, ownerId, ...fields } = parsed.data;

    const existing = await prisma.wbsNode.findUnique({
      where: { id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Entregável não encontrado.",
      };
    }

    // Se o código for alterado, checa duplicidade
    if (fields.code && fields.code !== existing.code) {
      const duplicate = await prisma.wbsNode.findUnique({
        where: {
          teamId_code: {
            teamId: existing.teamId,
            code: fields.code,
          },
        },
      });
      if (duplicate) {
        return {
          success: false,
          message: `O código EAP "${fields.code}" já está em uso por outro entregável.`,
          fieldErrors: {
            code: [`Código EAP "${fields.code}" já cadastrado.`],
          },
        };
      }
    }

    // Se ownerId foi alterado, resolve ownerName
    let ownerName = existing.ownerName;
    if (ownerId !== undefined) {
      if (ownerId) {
        const ownerUser = await prisma.user.findUnique({
          where: { id: ownerId },
          select: { name: true },
        });
        ownerName = ownerUser?.name ?? null;
      } else {
        ownerName = null;
      }
    }

    const updated = await prisma.wbsNode.update({
      where: { id },
      data: {
        ...fields,
        ...(ownerId !== undefined && { ownerId, ownerName }),
      },
    });

    revalidatePath("/documentos");

    return {
      success: true,
      message: `Entregável "${updated.code} - ${updated.title}" atualizado com sucesso.`,
      data: { id: updated.id },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao atualizar entregável";
    return {
      success: false,
      message: msg,
    };
  }
}

export async function deleteWbsNodeAction(
  rawData: DeleteWbsNodeInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const user = await requireAuthUser();

    if (user.role === UserRole.AUDITOR) {
      return {
        success: false,
        message: "Acesso negado: o perfil Auditor possui permissão somente de leitura.",
      };
    }

    const parsed = deleteWbsNodeSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Parâmetros de exclusão inválidos.",
      };
    }

    const { id, teamId } = parsed.data;

    const existing = await prisma.wbsNode.findFirst({
      where: { id, teamId },
    });

    if (!existing) {
      return {
        success: false,
        message: "Entregável não encontrado ou você não tem acesso a esta equipe.",
      };
    }

    // Exclusão em cascata (filhos são excluídos automaticamente pela FK do Prisma onDelete: Cascade)
    await prisma.wbsNode.delete({
      where: { id },
    });

    revalidatePath("/documentos");

    return {
      success: true,
      message: `Entregável "${existing.code} - ${existing.title}" excluído com sucesso.`,
      data: { id },
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erro ao excluir entregável";
    return {
      success: false,
      message: msg,
    };
  }
}
