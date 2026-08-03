"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  purchaseSchema,
  type PurchaseFormValues,
} from "@/lib/validations/purchase";
import { toNumber } from "@/lib/utils";

type PurchaseSerializable = {
  id: string;
  nfNumber: string;
  supplier: string;
  issueDate: Date;
  totalValue: number;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    purchaseInvoiceId: string;
    productId: string;
    quantity: number;
    unitCost: number;
    createdAt: Date;
    updatedAt: Date;
    product: {
      id: string;
      name: string;
      sku: string;
      unitCost: number | null;
    } & Record<string, unknown>;
  }>;
};

type InvoiceWithItems = Prisma.PurchaseInvoiceGetPayload<{
  include: { items: { include: { product: true } } };
}>;

// Converte Decimals do Prisma (totalValue, unitCost) para number
function serializeInvoice(invoice: InvoiceWithItems): PurchaseSerializable {
  return {
    ...invoice,
    totalValue: Number(invoice.totalValue),
    items: invoice.items.map((item) => ({
      ...item,
      unitCost: Number(item.unitCost),
      product: { ...item.product, unitCost: toNumber(item.product.unitCost) },
    })),
  };
}

export async function getPurchases(): Promise<PurchaseSerializable[]> {
  const invoices = await prisma.purchaseInvoice.findMany({
    include: {
      items: { include: { product: true } },
    },
    orderBy: { issueDate: "desc" },
  });
  return invoices.map(serializeInvoice);
}

export async function createPurchaseInvoice(rawData: PurchaseFormValues) {
  const parsed = purchaseSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Dados inválidos",
    };
  }

  const data = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Garante que todos os produtos existem
      for (const item of data.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) throw new Error("Produto não encontrado");
      }

      const totalValue = data.items.reduce(
        (sum, i) => sum + i.quantity * i.unitCost,
        0
      );

      // Cria a nota fiscal com os itens (custo de cada lote)
      const invoice = await tx.purchaseInvoice.create({
        data: {
          nfNumber: data.nfNumber.trim(),
          supplier: data.supplier.trim(),
          issueDate: new Date(data.issueDate + "T12:00:00"),
          totalValue,
          items: {
            create: data.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              unitCost: i.unitCost,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      // Incrementa estoque e atualiza "último custo" + fornecedor
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { increment: item.quantity },
            unitCost: item.unitCost,
            supplier: data.supplier.trim(),
          },
        });
      }

      return invoice;
    });

    revalidatePath("/purchases");
    revalidatePath("/stock");
    return { success: true as const, data: serializeInvoice(result) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao registrar nota fiscal";
    return { success: false as const, error: msg };
  }
}
