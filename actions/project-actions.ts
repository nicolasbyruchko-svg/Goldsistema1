"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { projectSchema, type ProjectFormValues } from "@/lib/validations/project";

export async function getProjects() {
  return prisma.project.findMany({
    include: {
      _count: { select: { workers: true, deliveries: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getActiveProjects() {
  return prisma.project.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export async function createProject(rawData: ProjectFormValues) {
  const parsed = projectSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const project = await prisma.project.create({
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
        costCenterCode: parsed.data.costCenterCode?.trim() || null,
        active: parsed.data.active ?? true,
      },
    });
    revalidatePath("/projects");
    return { success: true as const, data: project };
  } catch {
    return { success: false as const, error: "Erro ao criar contrato" };
  }
}

export async function updateProject(id: string, rawData: ProjectFormValues) {
  const parsed = projectSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Dados inválidos",
    };
  }

  try {
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        description: parsed.data.description?.trim() || null,
        costCenterCode: parsed.data.costCenterCode?.trim() || null,
        active: parsed.data.active ?? true,
      },
    });
    revalidatePath("/projects");
    return { success: true as const, data: project };
  } catch {
    return { success: false as const, error: "Erro ao atualizar contrato" };
  }
}

export async function toggleProjectActive(id: string, active: boolean) {
  try {
    await prisma.project.update({ where: { id }, data: { active } });
    revalidatePath("/projects");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Erro ao atualizar status" };
  }
}
