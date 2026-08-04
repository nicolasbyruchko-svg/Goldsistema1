"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { productSchema, type ProductFormValues } from "@/lib/validations/product";
import { toNumber } from "@/lib/utils";
import type { SerializableProduct } from "@/lib/types";

// Converte Decimal do Prisma para number (serializável para Client Components)
function serializeProduct<T extends { unitCost: unknown }>(p: T): Omit<T, "unitCost"> & { unitCost: number | null } {
  return { ...p, unitCost: toNumber(p.unitCost) };
}

export async function getProducts(): Promise<SerializableProduct[]> {
  const products = await prisma.product.findMany({
    where: { archived: false },
    orderBy: { name: "asc" },
  });
  return products.map(serializeProduct);
}

export async function createProduct(rawData: ProductFormValues) {
  const parsed = productSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Dados inválidos",
    };
  }

  const data = parsed.data;

  try {
    const product = await prisma.product.create({
      data: {
        name: data.name.trim(),
        sku: `SKU-${Date.now()}`,
        type: data.type,
        condition: data.condition,
        size: data.size?.trim() || null,
        caNumber: data.caNumber?.trim() || null,
        caValidity: data.caValidity ? new Date(data.caValidity) : null,
        unitCost: data.unitCost != null && data.unitCost > 0 ? data.unitCost : null,
        supplier: data.supplier?.trim() || null,
        stockQuantity: data.stockQuantity ?? 0,
        minStock: data.minStock ?? 5,
      },
    });
    revalidatePath("/stock");
    return { success: true as const, data: serializeProduct(product) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unique constraint") || msg.includes("unique")) {
      return { success: false as const, error: "SKU já cadastrado" };
    }
    return { success: false as const, error: "Erro ao criar produto" };
  }
}

export async function updateProduct(id: string, rawData: ProductFormValues) {
  const parsed = productSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.errors[0]?.message ?? "Dados inválidos",
    };
  }

  const data = parsed.data;

  try {
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name.trim(),
        sku: existingProduct?.sku || `SKU-${Date.now()}`,
        type: data.type,
        condition: data.condition,
        size: data.size?.trim() || null,
        caNumber: data.caNumber?.trim() || null,
        caValidity: data.caValidity ? new Date(data.caValidity) : null,
        unitCost: data.unitCost != null && data.unitCost > 0 ? data.unitCost : null,
        supplier: data.supplier?.trim() || null,
        stockQuantity: data.stockQuantity ?? 0,
        minStock: data.minStock ?? 5,
      },
    });
    revalidatePath("/stock");
    return { success: true as const, data: serializeProduct(product) };
  } catch {
    return { success: false as const, error: "Erro ao atualizar produto" };
  }
}

export async function deleteProduct(id: string) {
  try {
    // Exclusão lógica: o produto sai do catálogo/estoque, mas os lançamentos
    // antigos (fichas de EPI, entregas, compras, devoluções) são preservados.
    await prisma.product.update({
      where: { id },
      data: { archived: true },
    });
    revalidatePath("/stock");
    revalidatePath("/dashboard");
    return { success: true as const };
  } catch {
    return { success: false as const, error: "Erro ao excluir produto" };
  }
}
