"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { workerSchema, type WorkerFormValues } from "@/lib/validations/worker";
import { onlyDigits, toNumber } from "@/lib/utils";

export async function getWorkers() {
  return prisma.worker.findMany({
    include: { project: true },
    orderBy: { name: "asc" },
  });
}

export async function getWorkerById(id: string) {
  const worker = await prisma.worker.findUnique({
    where: { id },
    include: {
      project: true,
      deliveries: {
        include: {
          items: { include: { product: true } },
          project: true,
        },
        orderBy: { deliveredAt: "desc" },
      },
    },
  });

  if (!worker) return null;

  // Normaliza Decimals dos produtos para trafegar com segurança até o Client Component
  return {
    ...worker,
    deliveries: worker.deliveries.map((delivery) => ({
      ...delivery,
      items: delivery.items.map((item) => ({
        ...item,
        product: { ...item.product, unitCost: toNumber(item.product.unitCost) },
      })),
    })),
  };
}

export async function createWorker(rawData: WorkerFormValues) {
  const parsed = workerSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Dados inválidos",
    };
  }

  const data = parsed.data;

  try {
    const worker = await prisma.worker.create({
      data: {
        matricula: data.matricula.trim(),
        name: data.name.trim(),
        cpf: onlyDigits(data.cpf), // salva apenas os 11 dígitos
        role: data.role.trim(),
        admissionDate: data.admissionDate ? new Date(data.admissionDate + "T12:00:00") : null,
        projectId: data.projectId || null,
        active: data.active ?? true,
      },
    });
    revalidatePath("/workers");
    return { success: true as const, data: worker };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      if (msg.includes("matricula"))
        return { success: false as const, error: "Matrícula já cadastrada" };
      if (msg.includes("cpf"))
        return { success: false as const, error: "CPF já cadastrado" };
    }
    return { success: false as const, error: "Erro ao criar trabalhador" };
  }
}

export async function updateWorker(id: string, rawData: Partial<WorkerFormValues>) {
  // Ignoramos a validação estrita completa aqui para permitir partials, 
  // mas como o formulário enviará tudo, podemos validar via schema parcial.
  const partialSchema = workerSchema.partial();
  const parsed = partialSchema.safeParse(rawData);
  
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Dados inválidos",
    };
  }

  const data = parsed.data;

  try {
    const worker = await prisma.worker.update({
      where: { id },
      data: {
        ...(data.matricula && { matricula: data.matricula.trim() }),
        ...(data.name && { name: data.name.trim() }),
        ...(data.cpf && { cpf: onlyDigits(data.cpf) }),
        ...(data.role && { role: data.role.trim() }),
        ...(data.admissionDate !== undefined && { admissionDate: data.admissionDate ? new Date(data.admissionDate + "T12:00:00") : null }),
        ...(data.projectId !== undefined && { projectId: data.projectId || null }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });
    revalidatePath("/workers");
    return { success: true as const, data: worker };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      if (msg.includes("matricula"))
        return { success: false as const, error: "Matrícula já cadastrada" };
      if (msg.includes("cpf"))
        return { success: false as const, error: "CPF já cadastrado" };
    }
    return { success: false as const, error: "Erro ao atualizar trabalhador" };
  }
}

export async function toggleWorkerActive(id: string, active: boolean) {
  try {
    await prisma.worker.update({ where: { id }, data: { active } });
    revalidatePath("/workers");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Erro ao atualizar status" };
  }
}
