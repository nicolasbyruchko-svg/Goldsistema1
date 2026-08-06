import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from "crypto";
import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE } from "@/lib/constants";

/* ────────────────────────────────────────────────────────────
   Autenticação própria baseada na tabela de usuários.
   A sessão é um token assinado (HMAC-SHA256) em cookie httpOnly.
   ──────────────────────────────────────────────────────────── */

export const ROLE_ADMIN = "ADMIN";
export const ROLE_OPERATOR = "OPERATOR";

export type UserRole = "ADMIN" | "OPERATOR";

export type SessionUser = {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  active: boolean;
};

const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 dias
const SECRET = process.env.SESSION_SECRET ?? "";

const SCRYPT_PARAMS = {
  N: 16384,
  r: 8,
  p: 1,
  keylen: 64,
};

/* ── Senha ────────────────────────────────────────────────── */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      SCRYPT_PARAMS.keylen,
      SCRYPT_PARAMS,
      (err, derivedKey) => (err ? reject(err) : resolve(derivedKey))
    );
  });
  return `scrypt:${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [scheme, salt, hashHex] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const derived = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      expected.length,
      SCRYPT_PARAMS,
      (err, derivedKey) => (err ? reject(err) : resolve(derivedKey))
    );
  });
  return (
    derived.length === expected.length && timingSafeEqual(derived, expected)
  );
}

/* ── Sessão ───────────────────────────────────────────────── */

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function createSessionToken(userId: string): string {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = Buffer.from(JSON.stringify({ userId, exp })).toString(
    "base64url"
  );
  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(
  token: string
): { userId: string; exp: number } | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const received = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (
    received.length !== expectedBuf.length ||
    !timingSafeEqual(received, expectedBuf)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      userId?: unknown;
      exp?: unknown;
    };
    if (typeof data.userId !== "string" || typeof data.exp !== "number") {
      return null;
    }
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: data.userId, exp: data.exp };
  } catch {
    return null;
  }
}

/** Define o cookie de sessão. Só pode ser chamado em Server Function/Route Handler. */
export async function setSessionCookie(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, createSessionToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

/** Remove o cookie de sessão. Só pode ser chamado em Server Function/Route Handler. */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/** Retorna o usuário autenticado, ou null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const data = verifySessionToken(token);
  if (!data) return null;

  const user = await prisma.user.findUnique({ where: { id: data.userId } });
  if (!user || !user.active) return null;

  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role as UserRole,
    active: user.active,
  };
}

/** Exige usuário autenticado; redireciona para o login caso contrário. */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Exige usuário autenticado com perfil ADMIN; caso contrário, redireciona. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== ROLE_ADMIN) redirect("/dashboard");
  return user;
}
