import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  ClipboardList,
  Clock,
  ArrowRight,
  Boxes,
  TrendingUp,
  CalendarRange,
  Building2,
  Sofa,
} from "lucide-react";
import { formatDateTime, formatDeliveryStatus, formatCurrency, formatNumber } from "@/lib/utils";
import { getSpendingReport } from "@/actions/reports-actions";
import { StockCharts } from "@/components/dashboard/stock-charts";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Visão geral do sistema GoldService.",
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string }> = {
    PENDING_SIGNATURE: { bg: "#fef9c3", color: "#92400e" },
    SIGNED: { bg: "#dcfce7", color: "#15803d" },
    CANCELLED: { bg: "#fee2e2", color: "#dc2626" },
  };
  const style = config[status] ?? { bg: "#f3f4f6", color: "#6b7280" };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
      }}
    >
      {formatDeliveryStatus(status)}
    </span>
  );
}

export default async function DashboardPage() {
  const now = new Date();
  // Busca todos os dados do dashboard em paralelo
  const [deliveriesCount, products, recentDeliveries, spending, repairItems] =
    await Promise.all([
      prisma.delivery.count(),
      prisma.product.findMany({ where: { archived: false }, orderBy: { name: "asc" } }),
      prisma.delivery.findMany({
        take: 5,
        orderBy: { deliveredAt: "desc" },
        include: {
          worker: true,
          project: true,
          items: { include: { product: true } },
        },
      }),
      getSpendingReport(),
      prisma.devolutionItem.findMany({
        where: {
          condition: "SEWING",
        },
        include: {
          product: true,
          devolution: { include: { worker: true } },
        },
      }),
    ]);

  const inRepair = repairItems
    .map((item) => {
      const remaining = item.quantity - item.repairedQty;
      const startedAt = item.repairStartedAt ?? item.createdAt;
      const days = Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 86400000));
      return { ...item, remaining, days };
    })
    .filter((i) => i.remaining > 0)
    .sort((a, b) => b.days - a.days);

  const inRepairQty = inRepair.reduce((s, i) => s + i.remaining, 0);

  const stockByPiece = products.reduce<Record<string, (typeof products)[number][]>>((acc, p) => {
    (acc[p.name] ??= []).push(p);
    return acc;
  }, {});
  const pieces = Object.entries(stockByPiece)
    .map(([name, variants]) => {
      const sorted = [...variants].sort((a, b) => (a.size ?? "").localeCompare(b.size ?? ""));
      const novoCount = variants.filter((v) => v.condition === "NOVO").reduce((s, v) => s + v.stockQuantity, 0);
      const higienizadoCount = variants.filter((v) => v.condition === "HIGIENIZADO").reduce((s, v) => s + v.stockQuantity, 0);
      return {
        name,
        variants: sorted,
        total: variants.reduce((s, v) => s + v.stockQuantity, 0),
        novoCount,
        higienizadoCount,
        hasCritical: variants.some((v) => v.stockQuantity <= v.minStock),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const topContracts = spending.byProject.slice(0, 6);
  const maxContractSpend = Math.max(1, ...topContracts.map((c) => c.total));

  const statsCards = [
    {
      label: "Total de Entregas",
      value: deliveriesCount.toString(),
      icon: ClipboardList,
      color: "#059669",
      bg: "#d1fae5",
    },
    {
      label: "Gasto Total (EPI/Uniforme)",
      value: formatCurrency(spending.totals.totalSpent),
      icon: TrendingUp,
      color: "#059669",
      bg: "#d1fae5",
    },
    {
      label: "Gasto no Mês",
      value: formatCurrency(spending.totals.periodSpent),
      icon: CalendarRange,
      color: "#0284c7",
      bg: "#e0f2fe",
    },
    {
      label: "Peças em reparo",
      value: inRepairQty.toString(),
      icon: Sofa,
      color: "#4338ca",
      bg: "#e0e7ff",
    },
  ];

  return (
    <div style={{ padding: "32px 40px", flex: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 700,
            color: "var(--navy-900)",
            letterSpacing: "-0.5px",
            margin: 0,
          }}
        >
          Dashboard
        </h1>
        <p style={{ fontSize: "14px", color: "var(--gray-500)", marginTop: "4px" }}>
          Visão geral e indicadores do sistema GoldService.
        </p>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "32px",
        }}
      >
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "14px",
                padding: "24px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.04)",
                border: "1px solid var(--gray-200)",
                display: "flex",
                alignItems: "flex-start",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "10px",
                  backgroundColor: card.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon size={20} style={{ color: card.color }} strokeWidth={2} />
              </div>
              <div>
                <span
                  style={{
                    display: "block",
                    fontSize: "13px",
                    color: "var(--gray-500)",
                    fontWeight: 500,
                  }}
                >
                  {card.label}
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "30px",
                    fontWeight: 800,
                    color: card.color,
                    lineHeight: 1.1,
                    marginTop: "4px",
                  }}
                >
                  {card.value}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Peças em reparo */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          border: "1px solid var(--gray-200)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--gray-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "34px", height: "34px", borderRadius: "9px", backgroundColor: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sofa size={17} style={{ color: "#4338ca" }} />
            </div>
            <div>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--navy-900)", margin: 0 }}>
                Peças em Reparo
              </h2>
              <p style={{ fontSize: "12px", color: "var(--gray-500)", margin: "2px 0 0" }}>
                Peças de costura aguardando reparo e há quanto tempo.
              </p>
            </div>
          </div>
          <Link
            href="/devolutions"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#0284c7",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Devoluções <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {inRepair.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--gray-400)", padding: "20px 0" }}>
              <p style={{ fontSize: "14px", margin: 0 }}>Nenhuma peça em reparo no momento.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {inRepair.map((item) => {
              const daysLabel = item.days === 0 ? "hoje" : item.days === 1 ? "1 dia" : `${item.days} dias`;
              return (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    backgroundColor: "#fafafa",
                    borderRadius: "10px",
                    border: "1px solid var(--gray-200)",
                  }}
                >
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Sofa size={16} style={{ color: "#4338ca" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--gray-900)", margin: 0 }}>
                      {item.remaining}x {item.product.name}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--gray-500)", margin: "2px 0 0" }}>
                      {item.devolution.worker.name} · {item.quantity - item.repairedQty} de {item.quantity} em reparo
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: item.days > 7 ? "#dc2626" : item.days > 3 ? "#b45309" : "#4338ca",
                      backgroundColor: "#fff",
                      border: "1px solid var(--gray-200)",
                      padding: "4px 10px",
                      borderRadius: "999px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {daysLabel}
                  </span>
                </div>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* Gasto por Contrato */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          border: "1px solid var(--gray-200)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--gray-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Building2 size={18} style={{ color: "var(--navy-800)" }} />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--navy-900)", margin: 0 }}>
              Gasto por Contrato
            </h2>
          </div>
          <Link
            href="/reports"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#0284c7",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Relatórios <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ padding: "24px" }}>
          {topContracts.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--gray-400)", padding: "20px 0" }}>
              <p style={{ fontSize: "14px", margin: 0 }}>Nenhuma entrega registrada ainda.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {topContracts.map((contract) => (
                <div key={contract.key} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "220px", flexShrink: 0, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--gray-800)",
                        margin: "0 0 2px 0",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {contract.label}
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--gray-400)", margin: 0, fontFamily: "monospace" }}>
                      {contract.detail}
                    </p>
                  </div>
                  <div style={{ flex: 1, height: "22px", backgroundColor: "var(--gray-50)", borderRadius: "6px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${(contract.total / maxContractSpend) * 100}%`,
                        backgroundColor: "#059669",
                        borderRadius: "6px",
                        minWidth: "4px",
                      }}
                    />
                  </div>
                  <div style={{ width: "130px", flexShrink: 0, textAlign: "right" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--navy-900)" }}>
                      {formatCurrency(contract.total)}
                    </span>
                    <span style={{ display: "block", fontSize: "11px", color: "var(--gray-400)" }}>
                      {formatNumber(contract.itemCount)} item(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Estoque Disponível */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          border: "1px solid var(--gray-200)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--gray-200)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Boxes size={18} style={{ color: "var(--navy-800)" }} />
            <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--navy-900)", margin: 0 }}>
              Estoque Disponível
            </h2>
          </div>
          <Link
            href="/stock"
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#0284c7",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            Ver estoque <ArrowRight size={14} />
          </Link>
        </div>

        <div style={{ padding: "20px 24px" }}>
          {pieces.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--gray-400)", padding: "30px 0" }}>
              <p style={{ fontSize: "14px", margin: 0 }}>Nenhum item cadastrado no estoque.</p>
            </div>
          ) : (
            <StockCharts pieces={pieces} />
          )}
        </div>
      </div>

      {/* Últimas Entregas */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          border: "1px solid var(--gray-200)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
          overflow: "hidden",
        }}
      >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: "1px solid var(--gray-200)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Clock size={18} style={{ color: "var(--navy-800)" }} />
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--navy-900)", margin: 0 }}>
                Últimas Entregas
              </h2>
            </div>
            <Link
              href="/deliveries"
              style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "#0284c7",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              Ver todas <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ padding: "0 24px" }}>
            {recentDeliveries.length === 0 ? (
              <div style={{ padding: "40px 0", textAlign: "center", color: "var(--gray-400)" }}>
                <p style={{ fontSize: "14px", margin: 0 }}>Nenhuma entrega registrada ainda.</p>
              </div>
            ) : (
              recentDeliveries.map((delivery, idx) => (
                <div
                  key={delivery.id}
                  style={{
                    padding: "20px 0",
                    borderBottom: idx < recentDeliveries.length - 1 ? "1px solid var(--gray-100)" : "none",
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "16px",
                  }}
                >
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--gray-900)", margin: "0 0 4px 0" }}>
                      {delivery.worker.name}{" "}
                      <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--gray-500)" }}>
                        (Mat: {delivery.worker.matricula})
                      </span>
                    </p>
                    <p style={{ fontSize: "13px", color: "var(--gray-600)", margin: "0 0 8px 0" }}>
                      {delivery.project?.name || "Sem contrato vinculado"}
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {delivery.items.map((item) => (
                        <span
                          key={item.id}
                          style={{
                            fontSize: "12px",
                            backgroundColor: "var(--gray-50)",
                            border: "1px solid var(--gray-200)",
                            padding: "2px 8px",
                            borderRadius: "6px",
                            color: "var(--gray-700)",
                          }}
                        >
                          {item.quantity}x {item.product.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: "12px", color: "var(--gray-400)", margin: "0 0 6px 0" }}>
                      {formatDateTime(delivery.deliveredAt)}
                    </p>
                    <StatusBadge status={delivery.status} />
                  </div>
                </div>
              ))
            )}
          </div>
      </div>
    </div>
  );
}
