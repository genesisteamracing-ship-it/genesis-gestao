import { UserRole } from "@prisma/client";

export type TaskAuthorityActor = {
  id: string;
  role: UserRole;
  jobTitle?: string | null;
};

function normalizeJobTitle(jobTitle?: string | null): string {
  if (!jobTitle) return "";
  return jobTitle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const ELEVATED_JOB_KEYWORDS = [
  "superadmin",
  "super admin",
  "admin",
  "administrador",
  "administradora",
  "tecnico",
  "tecnica",
  "gestora de projetos",
  "gestor de projetos",
  "gerente de projetos",
  "gestao de projetos",
] as const;

export function hasElevatedTaskAuthority(actor: TaskAuthorityActor): boolean {
  if (actor.role === UserRole.AUDITOR) return false;
  if (actor.role === UserRole.SUPER_ADMIN) return true;

  const normalized = normalizeJobTitle(actor.jobTitle);
  if (!normalized) return false;

  return ELEVATED_JOB_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function canManageTask(
  actor: TaskAuthorityActor,
  creatorId: string | null | undefined,
): boolean {
  if (actor.role === UserRole.AUDITOR) return false;
  if (hasElevatedTaskAuthority(actor)) return true;
  return Boolean(creatorId && actor.id === creatorId);
}
