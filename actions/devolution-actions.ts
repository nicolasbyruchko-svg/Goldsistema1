"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  devolutionSchema,
  type DevolutionFormValues,
} from "@/lib/validations/devolution";

export async function getDevolutions() {
  return prisma.devolution.findMany({
    include: {
      worker: true,
      project: true,
      items: { include: { product: true } },
    },
    orderBy: { devolvedAt: "desc" },
  });
}

export async function createDevolution(rawData: DevolutionFormValues) {
  const parsed = devolutionSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Dados inválidos",
    };
  }

  const { workerId, reason, devolvedAt, items } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Busca o trabalhador para herdar o projectId
      const worker = await tx.worker.findUnique({ where: { id: workerId } });
      if (!worker) throw new Error("Trabalhador não encontrado");

      // Garante que todos os produtos existem
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) throw new Error("Produto não encontrado");
      }

      const devolution = await tx.devolution.create({
        data: {
          workerId,
          projectId: worker.projectId,
          reason,
          devolvedAt: new Date(devolvedAt + "T12:00:00"),
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              condition: item.condition,
            })),
          },
        },
      });

      // Só reincorpora ao estoque itens em bom estado. Itens "rasgados" ou
      // "não utilizáveis" são descartados e NÃO geram entrada no estoque.
      for (const item of items) {
        if (item.condition === "GOOD") {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }

      return devolution;
    });

    revalidatePath("/devolutions");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    return { success: true as const, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao registrar devolução";
    return { success: false as const, error: msg };
  }
}
