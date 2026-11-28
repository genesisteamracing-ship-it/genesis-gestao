import type { AuthenticatedUserDTO } from "@/types/auth";

export type AttendanceAccessActor = Pick<
  AuthenticatedUserDTO,
  "role" | "deliveryGroup" | "jobTitle" | "permissions"
>;

const MANAGER_TITLE_REGEX =
  /\b(gestor|gestora|gestao|gerente|coordenador|coordenadora|diretor|diretora)\b/;

function normalizeJobTitle(jobTitle?: string | null): string {
  if (!jobTitle) return "";
  return jobTitle
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Determina se o usuário autenticado pode acessar o módulo Presença nos Treinos (`/presenca`).
 * Regra de acesso:
 * - SUPER_ADMIN ou quem possui permissão administrativa (`permissions.team`) sempre acessa.
 * - AUDITOR não possui acesso.
 * - Perfis de GESTOR (`FINANCE_MANAGER`, setor `PROJECT_MANAGEMENT` ou cargo de gestão/coordenação/diretoria) têm acesso.
 */
export function canAccessTrainingAttendance(
  user: AttendanceAccessActor | null | undefined
): boolean {
  if (!user) return false;
  if (user.role === "SUPER_ADMIN") return true;
  if (Boolean(user.permissions?.team)) return true;
  if (user.role === "AUDITOR") return false;
  if (user.role === "FINANCE_MANAGER") return true;
  if (user.deliveryGroup === "PROJECT_MANAGEMENT") return true;

  const normalizedTitle = normalizeJobTitle(user.jobTitle);
  if (!normalizedTitle) return false;

  return MANAGER_TITLE_REGEX.test(normalizedTitle);
}
