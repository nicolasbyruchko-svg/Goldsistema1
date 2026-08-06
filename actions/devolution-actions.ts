"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  devolutionSchema,
  type DevolutionFormValues,
} from "@/lib/validations/devolution";

export async function getDevolutions() {
  return prisma.devolution.findMany({
    include: {
      worker: true,
      project: true,
      createdBy: { select: { id: true, name: true, username: true } },
      approvedBy: { select: { id: true, name: true, username: true } },
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
    const user = await getSessionUser();
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
          createdByUserId: user?.id ?? null,
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
  itemApprovals: Array<{ itemId: string; approvedQty: number; rejectedQty: number }>,
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

    const user = await getSessionUser();
    const approvalMap = new Map(itemApprovals.map((a) => [a.itemId, a]));

    await prisma.$transaction(async (tx) => {
      for (const item of devolution.items) {
        const data = approvalMap.get(item.id);
        const requestedApproved = data?.approvedQty ?? 0;
        const requestedRejected = data?.rejectedQty ?? 0;

        if (item.condition === "GOOD") {
          const previousApproved = item.approvedQty ?? 0;
          const previousRejected = item.rejectedQty ?? 0;

          const newRejectedQty = Math.min(
            Math.max(requestedRejected, previousRejected),
            item.quantity - previousApproved
          );
          const maxApproved = item.quantity - previousApproved - newRejectedQty;
          const newAdditionalApproved = Math.min(
            Math.max(requestedApproved, 0),
            maxApproved
          );
          const newApprovedQty = previousApproved + newAdditionalApproved;

          await tx.devolutionItem.update({
            where: { id: item.id },
            data: { approvedQty: newApprovedQty, rejectedQty: newRejectedQty },
          });

          if (newAdditionalApproved > 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: { increment: newAdditionalApproved },
                updatedByUserId: user?.id ?? null,
              },
            });
          }
        } else if (item.condition === "SEWING") {
          await tx.devolutionItem.update({
            where: { id: item.id },
            data: {
              approvedQty: 0,
              rejectedQty: 0,
              repairStartedAt: item.repairStartedAt ?? new Date(),
            },
          });
        } else {
          await tx.devolutionItem.update({
            where: { id: item.id },
            data: { approvedQty: 0, rejectedQty: item.quantity },
          });
        }
      }

      const allItemsFullyProcessed = devolution.items.every((item) => {
        if (item.condition === "GOOD") {
          const data = approvalMap.get(item.id);
          const totalDecided = (data?.approvedQty ?? 0) + (data?.rejectedQty ?? 0);
          return totalDecided >= item.quantity;
        }
        return true;
      });

      const newStatus = allItemsFullyProcessed ? "APPROVED" : "PARTIAL";

      await tx.devolution.update({
        where: { id: devolutionId },
        data: {
          status: newStatus,
          approvedByUserId: user?.id ?? null,
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

    const user = await getSessionUser();
    await prisma.$transaction(async (tx) => {
      await tx.devolutionItem.update({
        where: { id: item.id },
        data: { repairedQty: item.repairedQty + qty, repairedByUserId: user?.id ?? null },
      });

      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: { increment: qty },
          updatedByUserId: user?.id ?? null,
        },
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
