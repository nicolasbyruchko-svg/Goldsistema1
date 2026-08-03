"use server";

import { prisma } from "@/lib/prisma";
import { formatReason } from "@/lib/utils";

export type SpendingRow = {
  key: string;
  label: string;
  detail: string;
  total: number;
  itemCount: number;
};

export type SpendingPeriod = {
  from?: Date;
  to?: Date;
};

export type SpendingReport = {
  generatedAt: Date;
  totals: {
    totalSpent: number;
    totalItems: number;
    totalDeliveries: number;
    periodSpent: number;
    periodItems: number;
  };
  byProject: SpendingRow[];
  byWorker: SpendingRow[];
  byReason: SpendingRow[];
};

const REASON_KEYS = ["FIRST_DELIVERY", "REPLACEMENT_WEAR", "REPLACEMENT_LOSS"];

/**
 * Relatório de gastos com EPIs/uniformes a partir do custo capturado no
 * momento de cada entrega (unitCostAtDelivery × quantidade).
 *
 * Regra definida com o cliente: entregas CANCELADAS (status "CANCELLED")
 * NÃO entram no gasto — o item volta ao estoque e não representa despesa.
 */
export async function getSpendingReport(period?: SpendingPeriod): Promise<SpendingReport> {
  const deliveries = await prisma.delivery.findMany({
    where: { status: { not: "CANCELLED" } },
    include: {
      worker: { select: { id: true, name: true, matricula: true } },
      project: { select: { id: true, name: true, costCenterCode: true } },
      items: { select: { quantity: true, unitCostAtDelivery: true, reason: true } },
    },
    orderBy: { deliveredAt: "asc" },
  });

  const now = new Date();
  // Sem período informado, considera o mês corrente (do dia 1 até agora)
  const from = period?.from ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const to = period?.to;

  const projectMap = new Map<string, SpendingRow>();
  const workerMap = new Map<string, SpendingRow>();
  const reasonMap = new Map<string, SpendingRow>();

  let totalSpent = 0;
  let totalItems = 0;
  let periodSpent = 0;
  let periodItems = 0;

  for (const delivery of deliveries) {
    const inPeriod =
      delivery.deliveredAt >= from && (!to || delivery.deliveredAt <= to);

    // Agregação por contrato (projeto)
    const projectId = delivery.projectId ?? "SEM_CONTRATO";
    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, {
        key: projectId,
        label: delivery.project?.name ?? "Sem contrato",
        detail: delivery.project?.costCenterCode ?? "—",
        total: 0,
        itemCount: 0,
      });
    }

    // Agregação por colaborador
    if (!workerMap.has(delivery.workerId)) {
      workerMap.set(delivery.workerId, {
        key: delivery.workerId,
        label: delivery.worker.name,
        detail: `Mat. ${delivery.worker.matricula}`,
        total: 0,
        itemCount: 0,
      });
    }

    for (const item of delivery.items) {
      const cost = item.unitCostAtDelivery != null ? Number(item.unitCostAtDelivery) : 0;
      const line = cost * item.quantity;

      totalSpent += line;
      totalItems += item.quantity;
      if (inPeriod) {
        periodSpent += line;
        periodItems += item.quantity;
      }

      const projectRow = projectMap.get(projectId)!;
      projectRow.total += line;
      projectRow.itemCount += item.quantity;

      const workerRow = workerMap.get(delivery.workerId)!;
      workerRow.total += line;
      workerRow.itemCount += item.quantity;

      const reasonKey = REASON_KEYS.includes(item.reason) ? item.reason : "OUTRO";
      if (!reasonMap.has(reasonKey)) {
        reasonMap.set(reasonKey, {
          key: reasonKey,
          label: formatReason(reasonKey),
          detail: reasonKey,
          total: 0,
          itemCount: 0,
        });
      }
      const reasonRow = reasonMap.get(reasonKey)!;
      reasonRow.total += line;
      reasonRow.itemCount += item.quantity;
    }
  }

  const sortByTotal = (a: SpendingRow, b: SpendingRow) => b.total - a.total;

  return {
    generatedAt: now,
    totals: {
      totalSpent,
      totalItems,
      totalDeliveries: deliveries.length,
      periodSpent,
      periodItems,
    },
    byProject: [...projectMap.values()].sort(sortByTotal),
    byWorker: [...workerMap.values()].sort(sortByTotal),
    byReason: [...reasonMap.values()].sort(sortByTotal),
  };
}
