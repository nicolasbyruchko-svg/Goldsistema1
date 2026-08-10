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
  productCondition: string;
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

  const allProducts = await prisma.product.findMany({
    where: { archived: false },
    select: { id: true, name: true, size: true },
    orderBy: { name: "asc" },
  });

  const allProjects = await prisma.project.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  let matchedProductIds: string[] | undefined;
  if (filters?.productIds && filters.productIds.length > 0) {
    matchedProductIds = filters.productIds;
  } else if (filters?.size) {
    matchedProductIds = allProducts
      .filter((p) => p.size === filters.size)
      .map((p) => p.id);
  }

  const whereItems: Record<string, unknown> = {};
  if (matchedProductIds && matchedProductIds.length > 0) {
    whereItems.productId = { in: matchedProductIds };
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

  const deliveryItems = await prisma.deliveryItem.findMany({
    where: {
      delivery: whereDelivery,
      ...whereItems,
    },
    include: {
      product: { select: { id: true, name: true, size: true, condition: true } },
      delivery: {
        select: {
          deliveredAt: true,
          worker: { select: { name: true, matricula: true } },
          project: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { delivery: { deliveredAt: "desc" } },
  });

  const sizeSet = new Set<string>();

  const rows: UsageReportRow[] = deliveryItems.map((item) => {
    const unitCost = item.unitCostAtDelivery != null ? Number(item.unitCostAtDelivery) : 0;
    const size = item.product.size;
    if (size) sizeSet.add(size);
    return {
      id: item.id,
      date: item.delivery.deliveredAt,
      workerName: item.delivery.worker.name,
      workerMatricula: item.delivery.worker.matricula,
      projectName: item.delivery.project?.name ?? "Sem contrato",
      productName: item.product.name,
      productSize: size,
      productCondition: item.product.condition,
      quantity: item.quantity,
      unitCost,
      total: unitCost * item.quantity,
      reason: item.reason,
    };
  });

  const filteredProducts = filters?.size
    ? allProducts.filter((p) => p.size === filters.size)
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

export type HygieneRepairRow = {
  id: string;
  workerName: string;
  workerMatricula: string;
  projectName: string;
  productName: string;
  productSize: string | null;
  quantity: number;
  approvedQty: number;
  rejectedQty: number;
  pendingQty: number;
  repairedQty: number;
  status: "HIGIENIZACAO" | "REPARO";
  devolvedAt: Date;
  condition: string;
};

export type HygieneRepairReport = {
  generatedAt: Date;
  totals: {
    totalRows: number;
    totalHygiene: number;
    totalRepair: number;
    totalItems: number;
  };
  hygieneRows: HygieneRepairRow[];
  repairRows: HygieneRepairRow[];
};

export async function getHygieneRepairReport(): Promise<HygieneRepairReport> {
  const now = new Date();

  const devolutions = await prisma.devolution.findMany({
    where: {
      status: { in: ["PENDING", "PARTIAL"] },
    },
    include: {
      worker: { select: { name: true, matricula: true } },
      project: { select: { name: true } },
      items: {
        include: { product: { select: { name: true, size: true } } },
      },
    },
    orderBy: { devolvedAt: "desc" },
  });

  const sewingDevolutions = await prisma.devolution.findMany({
    where: {
      status: { in: ["APPROVED", "PARTIAL"] },
      items: { some: { condition: "SEWING", quantity: { gt: 0 } } },
    },
    include: {
      worker: { select: { name: true, matricula: true } },
      project: { select: { name: true } },
      items: {
        where: { condition: "SEWING" },
        include: { product: { select: { name: true, size: true } } },
      },
    },
    orderBy: { devolvedAt: "desc" },
  });

  const hygieneRows: HygieneRepairRow[] = [];
  for (const dev of devolutions) {
    for (const item of dev.items) {
      if (item.condition !== "GOOD") continue;
      const approved = item.approvedQty ?? 0;
      const rejected = item.rejectedQty ?? 0;
      const pending = item.quantity - approved - rejected;
      if (pending <= 0) continue;

      hygieneRows.push({
        id: item.id,
        workerName: dev.worker.name,
        workerMatricula: dev.worker.matricula,
        projectName: dev.project?.name ?? "Sem contrato",
        productName: item.product.name,
        productSize: item.product.size,
        quantity: item.quantity,
        approvedQty: approved,
        rejectedQty: rejected,
        pendingQty: pending,
        repairedQty: 0,
        status: "HIGIENIZACAO",
        devolvedAt: dev.devolvedAt,
        condition: item.condition,
      });
    }
  }

  const repairRows: HygieneRepairRow[] = [];
  for (const dev of sewingDevolutions) {
    for (const item of dev.items) {
      const remaining = item.quantity - item.repairedQty;
      if (remaining <= 0) continue;

      repairRows.push({
        id: item.id,
        workerName: dev.worker.name,
        workerMatricula: dev.worker.matricula,
        projectName: dev.project?.name ?? "Sem contrato",
        productName: item.product.name,
        productSize: item.product.size,
        quantity: item.quantity,
        approvedQty: 0,
        rejectedQty: 0,
        pendingQty: remaining,
        repairedQty: item.repairedQty,
        status: "REPARO",
        devolvedAt: dev.devolvedAt,
        condition: item.condition,
      });
    }
  }

  return {
    generatedAt: now,
    totals: {
      totalRows: hygieneRows.length + repairRows.length,
      totalHygiene: hygieneRows.reduce((s, r) => s + r.pendingQty, 0),
      totalRepair: repairRows.reduce((s, r) => s + r.pendingQty, 0),
      totalItems: hygieneRows.reduce((s, r) => s + r.pendingQty, 0) + repairRows.reduce((s, r) => s + r.pendingQty, 0),
    },
    hygieneRows,
    repairRows,
  };
}

export type StockReportRow = {
  id: string;
  name: string;
  sku: string;
  type: string;
  condition: string;
  size: string | null;
  caNumber: string | null;
  caValidity: Date | null;
  unitCost: number;
  supplier: string | null;
  stockQuantity: number;
  minStock: number;
  totalValue: number;
  isCritical: boolean;
};

export type StockReport = {
  generatedAt: Date;
  totals: {
    totalProducts: number;
    totalItems: number;
    totalValue: number;
    totalEpi: number;
    totalUniform: number;
    totalNovo: number;
    totalHigienizado: number;
    criticalCount: number;
  };
  rows: StockReportRow[];
};

export async function getStockReport(): Promise<StockReport> {
  const now = new Date();

  const products = await prisma.product.findMany({
    where: { archived: false },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  const rows: StockReportRow[] = products.map((p) => {
    const unitCost = p.unitCost != null ? Number(p.unitCost) : 0;
    return {
      id: p.id,
      name: p.name,
      sku: p.sku,
      type: p.type,
      condition: p.condition,
      size: p.size,
      caNumber: p.caNumber,
      caValidity: p.caValidity,
      unitCost,
      supplier: p.supplier,
      stockQuantity: p.stockQuantity,
      minStock: p.minStock,
      totalValue: unitCost * p.stockQuantity,
      isCritical: p.stockQuantity <= p.minStock,
    };
  });

  const totalProducts = rows.length;
  const totalItems = rows.reduce((s, r) => s + r.stockQuantity, 0);
  const totalValue = rows.reduce((s, r) => s + r.totalValue, 0);
  const totalEpi = rows.filter((r) => r.type === "EPI").reduce((s, r) => s + r.stockQuantity, 0);
  const totalUniform = rows.filter((r) => r.type === "UNIFORM").reduce((s, r) => s + r.stockQuantity, 0);
  const totalNovo = rows.filter((r) => r.condition === "NOVO").reduce((s, r) => s + r.stockQuantity, 0);
  const totalHigienizado = rows.filter((r) => r.condition === "HIGIENIZADO").reduce((s, r) => s + r.stockQuantity, 0);
  const criticalCount = rows.filter((r) => r.isCritical).length;

  return {
    generatedAt: now,
    totals: { totalProducts, totalItems, totalValue, totalEpi, totalUniform, totalNovo, totalHigienizado, criticalCount },
    rows,
  };
}
