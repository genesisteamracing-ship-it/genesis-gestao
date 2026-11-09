import { UserRole } from "@prisma/client";
import type { SystemModuleKey, UserModulePermissionsDTO } from "@/types/auth";

export interface SystemModuleMetadata {
  key: SystemModuleKey;
  label: string;
  description: string;
  defaultRoute: string;
}

export const SYSTEM_MODULES_META: Record<SystemModuleKey, SystemModuleMetadata> = {
  finance: {
    key: "finance",
    label: "Financeiro",
    description: "Dashboard Financeiro, Planejamento Orçamentário e Livro Caixa",
    defaultRoute: "/dashboard",
  },
  roi: {
    key: "roi",
    label: "ROI & Patrocínio",
    description: "Visão Geral, Contrapartidas e Ações de Retorno",
    defaultRoute: "/roi",
  },
  communication: {
    key: "communication",
    label: "Comunicação",
    description: "Mapa Hierárquico, Relatórios, Diretório, Agendamentos e Matriz",
    defaultRoute: "/comunicacao",
  },
  team: {
    key: "team",
    label: "Equipe & Acessos",
    description: "Gestão de Equipes, Integrantes e Permissões de Acesso",
    defaultRoute: "/equipe",
  },
  tasks: {
    key: "tasks",
    label: "Tarefas",
    description: "Tarefas por setor, Gantt, riscos e RACI",
    defaultRoute: "/tarefas",
  },
  documents: {
    key: "documents",
    label: "Documentos",
    description: "Estrutura Analítica do Projeto (WBS / EAP) e Governança de Escopo",
    defaultRoute: "/documentos",
  },
};

export const SYSTEM_MODULE_KEYS: SystemModuleKey[] = [
  "finance",
  "roi",
  "communication",
  "documents",
  "tasks",
  "team",
];

export function getDefaultModulePermissionsByRole(
  role: UserRole
): UserModulePermissionsDTO {
  if (role === UserRole.SUPER_ADMIN) {
    return {
      finance: true,
      roi: true,
      communication: true,
      team: true,
      documents: true,
      tasks: true,
    };
  }

  return {
    finance: true,
    roi: true,
    communication: true,
    team: false,
    documents: true,
    tasks: false,
  };
}

export function canModifyUserModulePermission(params: {
  currentAdminUserId: string;
  targetUserId: string;
  moduleKey: SystemModuleKey;
  nextAllowed: boolean;
}): { allowed: boolean; reason?: string } {
  const { currentAdminUserId, targetUserId, moduleKey, nextAllowed } = params;

  // Trava de segurança inegociável: Auto-bloqueio administrativo
  if (
    currentAdminUserId === targetUserId &&
    moduleKey === "team" &&
    nextAllowed === false
  ) {
    return {
      allowed: false,
      reason:
        "Você não pode revogar seu próprio acesso ao módulo de Equipe & Permissões.",
    };
  }

  return { allowed: true };
}

export function getFirstAllowedRoute(
  permissions?: UserModulePermissionsDTO | null
): string {
  if (!permissions) return "/login";

  if (permissions.finance) return "/dashboard";
  if (permissions.roi) return "/roi";
  if (permissions.communication) return "/comunicacao";
  if (permissions.documents) return "/documentos";
  if (permissions.tasks) return "/tarefas";
  if (permissions.team) return "/equipe";

  return "/dashboard";
}

export function hasModuleAccess(
  permissions: UserModulePermissionsDTO | null | undefined,
  moduleKey: SystemModuleKey
): boolean {
  if (!permissions) return false;
  return Boolean(permissions[moduleKey]);
}
