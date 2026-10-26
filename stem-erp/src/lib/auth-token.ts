import { SignJWT, jwtVerify } from "jose";
import type { DeliveryGroup, UserRole } from "@prisma/client";

export const SESSION_COOKIE_NAME = "stem_erp_session";
export const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 horas

export interface SessionTokenPayload {
  sub: string;
  jti: string;
  name: string;
  email: string;
  role: UserRole;
  deliveryGroup: DeliveryGroup | null;
  jobTitle: string | null;
}

function getJwtSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    "genesis-stem-racing-erp-http-only-secret-key-2026-secure-v1";
  return new TextEncoder().encode(secret);
}

export async function signSessionToken(
  payload: SessionTokenPayload
): Promise<string> {
  return new SignJWT({
    name: payload.name,
    email: payload.email,
    role: payload.role,
    deliveryGroup: payload.deliveryGroup,
    jobTitle: payload.jobTitle,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setJti(payload.jti)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getJwtSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey(), {
      algorithms: ["HS256"],
    });

    if (!payload.sub || !payload.jti || !payload.email || !payload.role) {
      return null;
    }

    return {
      sub: String(payload.sub),
      jti: String(payload.jti),
      name: String(payload.name ?? ""),
      email: String(payload.email),
      role: payload.role as UserRole,
      deliveryGroup: (payload.deliveryGroup as DeliveryGroup | null) ?? null,
      jobTitle: payload.jobTitle ? String(payload.jobTitle) : null,
    };
  } catch {
    return null;
  }
}

export function getHttpOnlyCookieOptions(expiresAt?: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
    ...(expiresAt ? { expires: expiresAt } : {}),
  };
}
