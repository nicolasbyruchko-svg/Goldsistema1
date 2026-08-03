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
        sku: data.sku.trim().toUpperCase(),
        type: data.type,
        size: data.size?.trim() || null,
        caNumber: data.caNumber?.trim() || null,
        caValidity: data.caValidity ? new Date(data.caValidity) : null,
        unitCost: data.unitCost != null && data.unitCost > 0 ? data.unitCost : null,
        supplier: data.supplier?.trim() || null,
        stockQuantity: data.stockQuantity,
        minStock: data.minStock,
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
    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name.trim(),
        sku: data.sku.trim().toUpperCase(),
        type: data.type,
        size: data.size?.trim() || null,
        caNumber: data.caNumber?.trim() || null,
        caValidity: data.caValidity ? new Date(data.caValidity) : null,
        unitCost: data.unitCost != null && data.unitCost > 0 ? data.unitCost : null,
        supplier: data.supplier?.trim() || null,
        stockQuantity: data.stockQuantity,
        minStock: data.minStock,
      },
    });
    revalidatePath("/stock");
    return { success: true as const, data: serializeProduct(product) };
  } catch {
    return { success: false as const, error: "Erro ao atualizar produto" };
  }
}
