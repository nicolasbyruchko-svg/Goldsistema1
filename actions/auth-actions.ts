"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

export async function login(
  username: string,
  password: string
): Promise<{ error: string } | undefined> {
  const user = await prisma.user.findUnique({
    where: { username: username.trim() },
  });

  if (!user || !user.active) {
    return { error: "Usuário ou senha inválidos." };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { error: "Usuário ou senha inválidos." };
  }

  await setSessionCookie(user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}