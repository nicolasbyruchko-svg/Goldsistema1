"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  requireAdmin,
  getSessionUser,
} from "@/lib/auth";
import {
  userSchema,
  updateUserSchema,
  type UserFormValues,
  type UpdateUserFormValues,
} from "@/lib/validations/user";

export type SerializedUser = {
  id: string;
  name: string;
  username: string;
  role: string;
  active: boolean;
  createdAt: Date;
};

export async function listUsers(): Promise<SerializedUser[]> {
  await requireAdmin();
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      active: true,
      createdAt: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function createUser(
  rawData: UserFormValues
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();

  const parsed = userSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Dados inválidos",
    };
  }

  const data = parsed.data;

  try {
    await prisma.user.create({
      data: {
        name: data.name.trim(),
        username: data.username.trim().toLowerCase(),
        passwordHash: await hashPassword(data.password),
        role: data.role,
        active: data.active,
      },
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint") || msg.includes("username")) {
      return { success: false, error: "Este login já está em uso" };
    }
    return { success: false, error: "Erro ao criar usuário" };
  }
}

export async function updateUser(
  id: string,
  rawData: UpdateUserFormValues
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAdmin();

  const parsed = updateUserSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Dados inválidos",
    };
  }

  const data = parsed.data;
  const password = data.password?.trim();

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: data.name.trim(),
        username: data.username.trim().toLowerCase(),
        role: data.role,
        active: data.active,
        ...(password ? { passwordHash: await hashPassword(password) } : {}),
      },
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint") || msg.includes("username")) {
      return { success: false, error: "Este login já está em uso" };
    }
    return { success: false, error: "Erro ao atualizar usuário" };
  }
}

export async function toggleUserActive(
  id: string,
  active: boolean
): Promise<{ success: true } | { success: false; error: string }> {
  const current = await getSessionUser();
  if (!current) return { success: false, error: "Sessão expirada" };
  if (current.role !== "ADMIN")
    return { success: false, error: "Sem permissão" };
  if (current.id === id) {
    return { success: false, error: "Você não pode inativar o próprio usuário" };
  }

  try {
    await prisma.user.update({ where: { id }, data: { active } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao atualizar status" };
  }
}

export async function deleteUser(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  const current = await getSessionUser();
  if (!current) return { success: false, error: "Sessão expirada" };
  if (current.role !== "ADMIN")
    return { success: false, error: "Sem permissão" };
  if (current.id === id) {
    return { success: false, error: "Você não pode excluir o próprio usuário" };
  }

  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { success: false, error: "Erro ao excluir usuário" };
  }
}
