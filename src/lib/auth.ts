import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fuab_cr_secret_key_change_in_production_2026"
);

export type UserRole = "management" | "lecturer" | "student";

export interface SessionPayload {
  userId: string;
  email?: string;
  matricNumber?: string;
  fullName: string;
  role: UserRole;
  [key: string]: unknown;
}

export const COOKIE_NAMES: Record<UserRole, string> = {
  management: "fuab_mgmt_token",
  lecturer: "fuab_lecturer_token",
  student: "fuab_student_token",
};

export async function signJWT(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(role: UserRole, token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES[role], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}

export async function clearSessionCookie(role: UserRole) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAMES[role], "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
  });
}

export async function getSession(role: UserRole): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAMES[role])?.value;
  if (!token) return null;
  return verifyJWT(token);
}
