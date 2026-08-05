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
      const worker = await tx.worker.findUnique({ where: { id: workerId } });
      if (!worker) throw new Error("Trabalhador não encontrado");

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
          status: "PENDING",
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

      return devolution;
    });

    revalidatePath("/devolutions");
    return { success: true as const, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao registrar devolução";
    return { success: false as const, error: msg };
  }
}

export async function approveDevolution(
  devolutionId: string,
  itemApprovals: Array<{ itemId: string; approvedQty: number }>
) {
  try {
    const devolution = await prisma.devolution.findUnique({
      where: { id: devolutionId },
      include: { items: true },
    });

    if (!devolution) {
      return { success: false as const, error: "Devolução não encontrada" };
    }

    if (devolution.status === "APPROVED") {
      return { success: false as const, error: "Devolução já foi aprovada" };
    }

    const approvalMap = new Map(itemApprovals.map((a) => [a.itemId, a.approvedQty]));

    await prisma.$transaction(async (tx) => {
      for (const item of devolution.items) {
        const approvedQty = Math.min(
          Math.max(approvalMap.get(item.id) ?? 0, 0),
          item.quantity
        );

        await tx.devolutionItem.update({
          where: { id: item.id },
          data: { approvedQty },
        });

        if (approvedQty > 0 && item.condition === "GOOD") {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: approvedQty } },
          });
        }
      }

      await tx.devolution.update({
        where: { id: devolutionId },
        data: { status: "APPROVED" },
      });
    });

    revalidatePath("/devolutions");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    return { success: true as const };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao aprovar devolução";
    return { success: false as const, error: msg };
  }
}
