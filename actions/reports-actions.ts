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

export type UsageReportFilters = {
  productIds?: string[];
  size?: string;
  projectIds?: string[];
  from?: Date;
  to?: Date;
};

export type UsageReportRow = {
  id: string;
  date: Date;
  workerName: string;
  workerMatricula: string;
  projectName: string;
  productName: string;
  productSize: string | null;
  quantity: number;
  unitCost: number;
  total: number;
  reason: string;
};

export type UsageReport = {
  generatedAt: Date;
  filters: {
    productIds?: string[];
    size?: string;
    projectIds?: string[];
    from?: Date;
    to?: Date;
  };
  totals: {
    totalItems: number;
    totalSpent: number;
    totalRows: number;
  };
  rows: UsageReportRow[];
  products: { id: string; name: string; size: string | null }[];
  sizes: string[];
  projects: { id: string; name: string }[];
};

const REASON_KEYS = ["FIRST_DELIVERY", "REPLACEMENT_WEAR", "REPLACEMENT_LOSS"];

/**
 * Relatório de gastos com EPIs/uniformes a partir do custo capturado no
 * momento de cada entrega (unitCostAtDelivery × quantidade).
 *
 * Regra definida com o cliente: entregas CANCELADAS (status "CANCELLED")
 * NÃO entram no gasto — o item volta ao estoque e não representa despesa.
 */
export async function getUsageReport(filters?: UsageReportFilters): Promise<UsageReport> {
  const now = new Date();

  const whereItems: Record<string, unknown> = {};
  if (filters?.productIds && filters.productIds.length > 0) {
    whereItems.productId = { in: filters.productIds };
  }

  const whereDelivery: Record<string, unknown> = { status: { not: "CANCELLED" } };
  if (filters?.projectIds && filters.projectIds.length > 0) {
    whereDelivery.projectId = { in: filters.projectIds };
  }
  if (filters?.from || filters?.to) {
    whereDelivery.deliveredAt = {
      ...(filters.from && { gte: filters.from }),
      ...(filters.to && { lte: filters.to }),
    };
  }

  const [deliveryItems, allProducts, allProjects] = await Promise.all([
    prisma.deliveryItem.findMany({
      where: {
        delivery: whereDelivery,
        ...whereItems,
      },
      include: {
        product: { select: { id: true, name: true, size: true } },
        delivery: {
          select: {
            deliveredAt: true,
            worker: { select: { name: true, matricula: true } },
            project: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { delivery: { deliveredAt: "desc" } },
    }),
    prisma.product.findMany({
      where: { archived: false },
      select: { id: true, name: true, size: true },
      orderBy: { name: "asc" },
    }),
    prisma.project.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const sizeSet = new Set<string>();
  const productSizeMap = new Map<string, Set<string>>();

  const rows: UsageReportRow[] = deliveryItems
    .filter((item) => {
      if (filters?.size) {
        const itemSize = item.product.size ?? "";
        if (itemSize !== filters.size) return false;
      }
      return true;
    })
    .map((item) => {
      const unitCost = item.unitCostAtDelivery != null ? Number(item.unitCostAtDelivery) : 0;
      const size = item.product.size;
      if (size) {
        sizeSet.add(size);
        const key = item.product.id;
        if (!productSizeMap.has(key)) productSizeMap.set(key, new Set());
        productSizeMap.get(key)!.add(size);
      }
      return {
        id: item.id,
        date: item.delivery.deliveredAt,
        workerName: item.delivery.worker.name,
        workerMatricula: item.delivery.worker.matricula,
        projectName: item.delivery.project?.name ?? "Sem contrato",
        productName: item.product.name,
        productSize: size,
        quantity: item.quantity,
        unitCost,
        total: unitCost * item.quantity,
        reason: item.reason,
      };
    });

  const filteredProducts = filters?.size
    ? allProducts.filter((p) => productSizeMap.get(p.id)?.has(filters.size!))
    : allProducts;

  const totalItems = rows.reduce((s, r) => s + r.quantity, 0);
  const totalSpent = rows.reduce((s, r) => s + r.total, 0);

  return {
    generatedAt: now,
    filters: {
      productIds: filters?.productIds,
      size: filters?.size,
      projectIds: filters?.projectIds,
      from: filters?.from,
      to: filters?.to,
    },
    totals: { totalItems, totalSpent, totalRows: rows.length },
    rows,
    products: filteredProducts,
    sizes: [...sizeSet].sort(),
    projects: allProjects,
  };
}

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
