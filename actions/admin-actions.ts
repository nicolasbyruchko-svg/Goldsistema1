"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

const RESET_PASSWORD = "13371337";

export type ResetModule =
  | "ALL"
  | "DELIVERIES"
  | "DEVOLUTIONS"
  | "PURCHASES";

export async function verifyResetPassword(password: string): Promise<{ valid: boolean }> {
  return { valid: password === RESET_PASSWORD };
}

export async function resetModule(
  module: ResetModule,
  password: string
): Promise<
  | { success: true; data: { deliveries: number; devolutions: number; purchases: number; stockReset: boolean } }
  | { success: false; error: string }
> {
  if (password !== RESET_PASSWORD) {
    return { success: false, error: "Senha incorreta" };
  }

  try {
    const user = await requireAdmin();
    const result = await prisma.$transaction(async (tx) => {
      const counts = {
        deliveries: 0,
        devolutions: 0,
        purchases: 0,
      };
      let stockReset = false;

      if (module === "ALL" || module === "DELIVERIES") {
        counts.deliveries = await tx.delivery.deleteMany().then((r) => r.count);
      }
      if (module === "ALL" || module === "DEVOLUTIONS") {
        counts.devolutions = await tx.devolution.deleteMany().then((r) => r.count);
      }
      if (module === "ALL" || module === "PURCHASES") {
        counts.purchases = await tx.purchaseInvoice.deleteMany().then((r) => r.count);
      }
      if (module === "ALL") {
        // Após remover entradas/saídas, o estoque é zerado para refletir o catálogo.
        await tx.product.updateMany({
          data: { stockQuantity: 0, updatedByUserId: user.id },
        });
        stockReset = true;
      }

      return { ...counts, stockReset };
    });

    revalidatePath("/dashboard");
    revalidatePath("/deliveries");
    revalidatePath("/devolutions");
    revalidatePath("/purchases");
    revalidatePath("/stock");
    revalidatePath("/reports");
    revalidatePath("/admin/reset");
    return { success: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro ao zerar dados";
    return { success: false, error: msg };
  }
}
