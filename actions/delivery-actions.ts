"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import {
  deliverySchema,
  type DeliveryFormValues,
} from "@/lib/validations/delivery";

export async function getDeliveries(projectId?: string) {
  return prisma.delivery.findMany({
    where: projectId ? { projectId } : undefined,
    include: {
      worker: true,
      project: true,
      createdBy: { select: { id: true, name: true, username: true } },
      items: {
        include: { product: true },
      },
    },
    orderBy: { deliveredAt: "desc" },
  });
}

export async function createDelivery(rawData: DeliveryFormValues) {
  const parsed = deliverySchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Dados inválidos",
    };
  }

  const { workerId, items } = parsed.data;

  try {
    const user = await getSessionUser();
    const result = await prisma.$transaction(async (tx) => {
      // Busca o trabalhador para herdar o projectId
      const worker = await tx.worker.findUnique({ where: { id: workerId } });
      if (!worker) throw new Error("Trabalhador não encontrado");

      // Verifica estoque disponível para cada item e captura o custo atual
      const productCosts = new Map<string, number>();
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) throw new Error("Produto não encontrado");
        if (product.stockQuantity < item.quantity) {
          throw new Error(
            `Estoque insuficiente para "${product.name}". Disponível: ${product.stockQuantity}`
          );
        }
        if (product.unitCost != null) {
          productCosts.set(item.productId, Number(product.unitCost));
        }
      }

      // Cria a entrega com os itens
      const delivery = await tx.delivery.create({
        data: {
          workerId,
          projectId: worker.projectId,
          createdByUserId: user?.id ?? null,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              reason: item.reason,
              unitCostAtDelivery: productCosts.get(item.productId),
            })),
          },
        },
      });

      // Decrementa o estoque de cada produto
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { decrement: item.quantity },
            updatedByUserId: user?.id ?? null,
          },
        });
      }

      return delivery;
    });

    revalidatePath("/deliveries");
    revalidatePath("/stock");
    return { success: true as const, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao criar entrega";
    return { success: false as const, error: msg };
  }
}

export async function updateDeliveryStatus(id: string, status: string) {
  try {
    await prisma.delivery.update({ where: { id }, data: { status } });
    revalidatePath("/deliveries");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Erro ao atualizar status" };
  }
}
