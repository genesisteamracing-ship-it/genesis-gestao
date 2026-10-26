import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { AuthEventType, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SESSION_COOKIE_NAME,
  SESSION_DURATION_SECONDS,
  getHttpOnlyCookieOptions,
  signSessionToken,
  verifySessionToken,
} from "@/lib/auth-token";
import type {
  CreateMemberInput,
  LoginInput,
  UpdateMemberAccessInput,
} from "@/lib/validations/auth";
import type {
  AuthenticatedUserDTO,
  TeamManagementMetricsDTO,
  TeamMemberDTO,
} from "@/types/auth";

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutos
// Hash bcrypt válido para comparação em tempo constante quando o e-mail não existe
const DUMMY_BCRYPT_HASH =
  "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4oL2.7y0W.";

async function getRequestMetadata() {
  try {
    const hdrs = await headers();
    const forwardedFor = hdrs.get("x-forwarded-for");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : hdrs.get("x-real-ip") ?? "127.0.0.1";
    const userAgent = hdrs.get("user-agent") ?? "Unknown";
    return { ipAddress, userAgent };
  } catch {
    return { ipAddress: "127.0.0.1", userAgent: "Server" };
  }
}

export async function authenticateUserService(input: LoginInput): Promise<{
  success: boolean;
  message: string;
}> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const { ipAddress, userAgent } = await getRequestMetadata();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    // Mitigação de Timing Attack: consome o mesmo tempo de CPU de um usuário existente
    await bcrypt.compare(input.password, DUMMY_BCRYPT_HASH);

    await prisma.authAuditLog.create({
      data: {
        emailAttempt: normalizedEmail,
        event: AuthEventType.LOGIN_FAILED,
        ipAddress,
        userAgent,
        details: "Tentativa de login com e-mail não cadastrado.",
      },
    });

    return {
      success: false,
      message: "Credenciais inválidas. Verifique seu e-mail e senha.",
    };
  }

  if (!user.isActive) {
    await prisma.authAuditLog.create({
      data: {
        userId: user.id,
        emailAttempt: normalizedEmail,
        event: AuthEventType.LOGIN_FAILED,
        ipAddress,
        userAgent,
        details: "Tentativa de login em conta desativada pelo SuperAdmin.",
      },
    });

    return {
      success: false,
      message: "Sua conta está desativada. Contate o SuperAdmin da equipe.",
    };
  }

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    const remainingMinutes = Math.ceil(
      (user.lockedUntil.getTime() - now.getTime()) / 60000
    );

    await prisma.authAuditLog.create({
      data: {
        userId: user.id,
        emailAttempt: normalizedEmail,
        event: AuthEventType.ACCOUNT_LOCKED,
        ipAddress,
        userAgent,
        details: `Acesso recusado durante bloqueio anti-invasão (${remainingMinutes} min restantes).`,
      },
    });

    return {
      success: false,
      message: `Conta bloqueada temporariamente por segurança contra tentativas de invasão. Tente novamente em ${remainingMinutes} min ou solicite desbloqueio ao SuperAdmin.`,
    };
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    const nextFailedAttempts = user.failedLoginAttempts + 1;
    const shouldLockAccount = nextFailedAttempts >= MAX_FAILED_LOGIN_ATTEMPTS;
    const lockedUntil = shouldLockAccount
      ? new Date(now.getTime() + LOCKOUT_DURATION_MS)
      : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: nextFailedAttempts,
        lockedUntil,
      },
    });

    await prisma.authAuditLog.create({
      data: {
        userId: user.id,
        emailAttempt: normalizedEmail,
        event: shouldLockAccount
          ? AuthEventType.ACCOUNT_LOCKED
          : AuthEventType.LOGIN_FAILED,
        ipAddress,
        userAgent,
        details: shouldLockAccount
          ? `Conta bloqueada após ${nextFailedAttempts} tentativas consecutivas de senha inválida.`
          : `Senha incorreta (tentativa ${nextFailedAttempts}/${MAX_FAILED_LOGIN_ATTEMPTS}).`,
      },
    });

    if (shouldLockAccount) {
      return {
        success: false,
        message:
          "Limite de 5 tentativas excedido! Conta bloqueada por 15 minutos para proteção contra invasão.",
      };
    }

    return {
      success: false,
      message: `Credenciais inválidas. Restam ${
        MAX_FAILED_LOGIN_ATTEMPTS - nextFailedAttempts
      } tentativa(s) antes do bloqueio de segurança.`,
    };
  }

  // Login autorizado: reseta contador de falhas, cria sessão e emite cookie httpOnly
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_SECONDS * 1000);

  const session = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: now,
      },
    });

    const createdSession = await tx.session.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    await tx.authAuditLog.create({
      data: {
        userId: user.id,
        emailAttempt: normalizedEmail,
        event: AuthEventType.LOGIN_SUCCESS,
        ipAddress,
        userAgent,
        details: "Sessão autenticada com cookie httpOnly.",
      },
    });

    return createdSession;
  });

  const jwtToken = await signSessionToken({
    sub: user.id,
    jti: session.id,
    name: user.name,
    email: user.email,
    role: user.role,
    deliveryGroup: user.deliveryGroup,
    jobTitle: user.jobTitle,
  });

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    jwtToken,
    getHttpOnlyCookieOptions(expiresAt)
  );

  return {
    success: true,
    message: `Bem-vindo(a), ${user.name}!`,
  };
}

export async function logoutUserService(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const { ipAddress, userAgent } = await getRequestMetadata();

  if (token) {
    const payload = await verifySessionToken(token);
    if (payload) {
      await prisma.session
        .update({
          where: { id: payload.jti },
          data: { revokedAt: new Date() },
        })
        .catch(() => null);

      await prisma.authAuditLog
        .create({
          data: {
            userId: payload.sub,
            emailAttempt: payload.email,
            event: AuthEventType.LOGOUT,
            ipAddress,
            userAgent,
            details: "Logout realizado e sessão httpOnly encerrada.",
          },
        })
        .catch(() => null);
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUserFromSession(): Promise<AuthenticatedUserDTO | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload) return null;

    const session = await prisma.session.findUnique({
      where: { id: payload.jti },
      include: { user: true },
    });

    if (
      !session ||
      session.revokedAt !== null ||
      session.expiresAt <= new Date() ||
      !session.user.isActive
    ) {
      return null;
    }

    return {
      id: session.user.id,
      sessionId: session.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      deliveryGroup: session.user.deliveryGroup,
      jobTitle: session.user.jobTitle,
    };
  } catch {
    return null;
  }
}

export async function requireAuthUser(): Promise<AuthenticatedUserDTO> {
  const user = await getCurrentUserFromSession();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireSuperAdmin(): Promise<AuthenticatedUserDTO> {
  const user = await requireAuthUser();
  if (user.role !== UserRole.SUPER_ADMIN) {
    redirect("/dashboard");
  }
  return user;
}

export async function createTeamMemberService(
  superAdmin: AuthenticatedUserDTO,
  input: CreateMemberInput
) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new Error("Já existe um integrante cadastrado com este e-mail.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const { ipAddress, userAgent } = await getRequestMetadata();

  return prisma.$transaction(async (tx) => {
    const createdUser = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
        deliveryGroup: input.deliveryGroup,
        jobTitle: input.jobTitle,
        isActive: true,
        createdById: superAdmin.id,
      },
    });

    await tx.authAuditLog.create({
      data: {
        userId: superAdmin.id,
        emailAttempt: createdUser.email,
        event: AuthEventType.USER_CREATED,
        ipAddress,
        userAgent,
        details: `Cadastrado por ${superAdmin.name} com função ${input.role} na equipe ${input.deliveryGroup}.`,
      },
    });

    return createdUser;
  });
}

export async function updateTeamMemberAccessService(
  superAdmin: AuthenticatedUserDTO,
  input: UpdateMemberAccessInput
) {
  const targetUser = await prisma.user.findUnique({
    where: { id: input.userId },
  });

  if (!targetUser) {
    throw new Error("Integrante não encontrado.");
  }

  // Impede que o último SuperAdmin se desative ou remova seu próprio perfil de SuperAdmin
  if (
    targetUser.id === superAdmin.id &&
    (!input.isActive || input.role !== UserRole.SUPER_ADMIN)
  ) {
    const activeSuperAdminsCount = await prisma.user.count({
      where: {
        role: UserRole.SUPER_ADMIN,
        isActive: true,
      },
    });

    if (activeSuperAdminsCount <= 1) {
      throw new Error(
        "Você é o único SuperAdmin ativo e não pode remover seu próprio acesso de SuperAdmin."
      );
    }
  }

  const { ipAddress, userAgent } = await getRequestMetadata();

  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: input.userId },
      data: {
        role: input.role,
        deliveryGroup: input.deliveryGroup,
        jobTitle: input.jobTitle,
        isActive: input.isActive,
      },
    });

    // Revoga sessões ativas para forçar atualização imediata de escopo de equipe/permissão
    await tx.session.updateMany({
      where: {
        userId: updated.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    await tx.authAuditLog.create({
      data: {
        userId: superAdmin.id,
        emailAttempt: updated.email,
        event: AuthEventType.USER_ROLE_UPDATED,
        ipAddress,
        userAgent,
        details: `Acesso atualizado para ${input.role} | Equipe: ${input.deliveryGroup} | Ativo: ${input.isActive}.`,
      },
    });

    return updated;
  });
}

export async function unlockUserAccountService(
  superAdmin: AuthenticatedUserDTO,
  userId: string
) {
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    throw new Error("Integrante não encontrado.");
  }

  const { ipAddress, userAgent } = await getRequestMetadata();

  return prisma.$transaction(async (tx) => {
    const unlocked = await tx.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        isActive: true,
      },
    });

    await tx.authAuditLog.create({
      data: {
        userId: superAdmin.id,
        emailAttempt: unlocked.email,
        event: AuthEventType.USER_ROLE_UPDATED,
        ipAddress,
        userAgent,
        details: `Conta desbloqueada manualmente pelo SuperAdmin ${superAdmin.name}.`,
      },
    });

    return unlocked;
  });
}

export async function getTeamManagementMetricsService(): Promise<TeamManagementMetricsDTO> {
  const now = new Date();

  const [rawUsers, rawAuditLogs, activeSessionsCount, blockedAttemptsCount] =
    await Promise.all([
      prisma.user.findMany({
        include: {
          sessions: {
            where: {
              revokedAt: null,
              expiresAt: { gt: now },
            },
            select: { id: true },
          },
        },
        orderBy: [{ role: "asc" }, { name: "asc" }],
      }),
      prisma.authAuditLog.findMany({
        include: {
          user: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 40,
      }),
      prisma.session.count({
        where: {
          revokedAt: null,
          expiresAt: { gt: now },
        },
      }),
      prisma.authAuditLog.count({
        where: {
          event: {
            in: [AuthEventType.LOGIN_FAILED, AuthEventType.ACCOUNT_LOCKED],
          },
        },
      }),
    ]);

  const members: TeamMemberDTO[] = rawUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    deliveryGroup: u.deliveryGroup,
    jobTitle: u.jobTitle,
    isActive: u.isActive,
    failedLoginAttempts: u.failedLoginAttempts,
    lockedUntil: u.lockedUntil ? u.lockedUntil.toISOString() : null,
    isLocked: Boolean(u.lockedUntil && u.lockedUntil > now),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    activeSessionsCount: u.sessions.length,
    createdAt: u.createdAt.toISOString(),
  }));

  const auditLogs = rawAuditLogs.map((log) => ({
    id: log.id,
    userId: log.userId,
    userName: log.user?.name ?? null,
    emailAttempt: log.emailAttempt,
    event: log.event,
    ipAddress: log.ipAddress,
    details: log.details,
    createdAt: log.createdAt.toISOString(),
  }));

  return {
    members,
    auditLogs,
    stats: {
      totalMembers: members.length,
      activeMembers: members.filter((m) => m.isActive && !m.isLocked).length,
      activeSessions: activeSessionsCount,
      blockedInvasionAttempts: blockedAttemptsCount,
    },
  };
}
