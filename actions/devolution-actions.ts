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
  itemApprovals: Array<{ itemId: string; approvedQty: number }>,
  notes?: string
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
        const requestedQty = Math.min(
          Math.max(approvalMap.get(item.id) ?? 0, 0),
          item.quantity
        );

        if (item.condition === "GOOD") {
          const previousApproved = item.approvedQty ?? 0;
          const newApprovedQty = Math.max(requestedQty, previousApproved);
          const increment = newApprovedQty - previousApproved;

          await tx.devolutionItem.update({
            where: { id: item.id },
            data: { approvedQty: newApprovedQty },
          });

          if (increment > 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment } },
            });
          }
        } else if (item.condition === "SEWING") {
          await tx.devolutionItem.update({
            where: { id: item.id },
            data: {
              approvedQty: 0,
              repairStartedAt: item.repairStartedAt ?? new Date(),
            },
          });
        } else {
          await tx.devolutionItem.update({
            where: { id: item.id },
            data: { approvedQty: 0 },
          });
        }
      }

      const allItemsFullyProcessed = devolution.items.every((item) => {
        if (item.condition === "GOOD") {
          const requested = approvalMap.get(item.id) ?? 0;
          return requested >= item.quantity;
        }
        return true;
      });

      const newStatus = allItemsFullyProcessed ? "APPROVED" : "PARTIAL";

      await tx.devolution.update({
        where: { id: devolutionId },
        data: {
          status: newStatus,
          notes: notes?.trim() ? notes.trim() : devolution.notes,
        },
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

export async function repairEntry(
  devolutionItemId: string,
  quantity: number
) {
  try {
    const item = await prisma.devolutionItem.findUnique({
      where: { id: devolutionItemId },
    });

    if (!item) {
      return { success: false as const, error: "Item não encontrado" };
    }

    if (item.condition !== "SEWING") {
      return { success: false as const, error: "Item não está em reparo" };
    }

    const remaining = item.quantity - item.repairedQty;
    const qty = Math.min(Math.max(Math.round(quantity) || 0, 0), remaining);

    if (qty <= 0) {
      return { success: false as const, error: "Quantidade inválida" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.devolutionItem.update({
        where: { id: item.id },
        data: { repairedQty: item.repairedQty + qty },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: { stockQuantity: { increment: qty } },
      });
    });

    revalidatePath("/devolutions");
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    return { success: true as const };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao dar entrada de reparo";
    return { success: false as const, error: msg };
  }
}
