import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  Users,
  Package,
  ClipboardList,
  FolderKanban,
  AlertTriangle,
  Clock,
  ArrowRight,
  Boxes,
  TrendingUp,
  CalendarRange,
  Building2,
} from "lucide-react";
import { formatDateTime, formatDeliveryStatus, formatCurrency, formatNumber } from "@/lib/utils";
import { getSpendingReport } from "@/actions/reports-actions";
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
  // Busca todos os dados do dashboard em paralelo
  const [workersCount, projectsCount, deliveriesCount, products, recentDeliveries, spending] =
    await Promise.all([
      prisma.worker.count({ where: { active: true } }),
      prisma.project.count({ where: { active: true } }),
      prisma.delivery.count(),
      prisma.product.findMany({ orderBy: { name: "asc" } }),
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
    ]);

  const totalStockItems = products.reduce((acc, p) => acc + p.stockQuantity, 0);

  const stockByPiece = products.reduce<Record<string, (typeof products)[number][]>>((acc, p) => {
    (acc[p.name] ??= []).push(p);
    return acc;
  }, {});
  const pieces = Object.entries(stockByPiece)
    .map(([name, variants]) => ({
      name,
      variants: [...variants].sort((a, b) => (a.size ?? "").localeCompare(b.size ?? "")),
      total: variants.reduce((s, v) => s + v.stockQuantity, 0),
      hasCritical: variants.some((v) => v.stockQuantity <= v.minStock),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const topContracts = spending.byProject.slice(0, 6);
  const maxContractSpend = Math.max(1, ...topContracts.map((c) => c.total));

  const statsCards = [
    {
      label: "Trabalhadores Ativos",
      value: workersCount.toString(),
      icon: Users,
      color: "var(--navy-800)",
      bg: "rgba(25, 55, 109, 0.08)",
    },
    {
      label: "Contratos em Andamento",
      value: projectsCount.toString(),
      icon: FolderKanban,
      color: "#0284c7",
      bg: "#e0f2fe",
    },
    {
      label: "Total de Entregas",
      value: deliveriesCount.toString(),
      icon: ClipboardList,
      color: "#059669",
      bg: "#d1fae5",
    },
    {
      label: "Itens no Estoque",
      value: totalStockItems.toString(),
      icon: Package,
      color: "#7c3aed",
      bg: "#ede9fe",
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

      {/* Main Content Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Estoque Atual */}
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
              <Package size={18} style={{ color: "var(--navy-800)" }} />
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--navy-900)", margin: 0 }}>
                Estoque Atual
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

          {products.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--gray-400)" }}>
              <p style={{ fontSize: "14px", margin: 0 }}>Nenhum item cadastrado no estoque.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
                    {["Produto", "SKU", "Tipo", "Estoque", "Mín."].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "12px 20px",
                          textAlign: "left",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--gray-500)",
                          letterSpacing: "0.6px",
                          textTransform: "uppercase",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product, idx) => {
                    const isCritical = product.stockQuantity <= product.minStock;
                    return (
                      <tr
                        key={product.id}
                        style={{
                          borderBottom: idx < products.length - 1 ? "1px solid var(--gray-100)" : "none",
                          backgroundColor: isCritical ? "#fffbeb" : "transparent",
                        }}
                      >
                        <td style={{ padding: "12px 20px", fontWeight: 600, color: "var(--gray-900)" }}>
                          {product.name}
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <span
                            style={{
                              fontFamily: "monospace",
                              fontSize: "12px",
                              backgroundColor: "var(--gray-100)",
                              padding: "2px 7px",
                              borderRadius: "5px",
                              color: "var(--gray-700)",
                            }}
                          >
                            {product.sku}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              padding: "3px 10px",
                              borderRadius: "999px",
                              fontSize: "12px",
                              fontWeight: 600,
                              backgroundColor: product.type === "EPI" ? "rgba(25,55,109,0.08)" : "#e0f2fe",
                              color: product.type === "EPI" ? "var(--navy-800)" : "#0284c7",
                            }}
                          >
                            {product.type === "EPI" ? "EPI" : "Uniforme"}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "16px",
                              fontWeight: 800,
                              color: isCritical ? "#dc2626" : "#15803d",
                            }}
                          >
                            {product.stockQuantity}
                            {isCritical && (
                              <AlertTriangle size={14} style={{ color: "#f59e0b" }} strokeWidth={2.5} />
                            )}
                          </span>
                        </td>
                        <td style={{ padding: "12px 20px", color: "var(--gray-400)", fontSize: "13px" }}>
                          {product.minStock}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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

        {/* Estoque Disponível */}
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

          <div style={{ padding: "16px 24px" }}>
            {pieces.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--gray-400)", padding: "30px 0" }}>
                <p style={{ fontSize: "14px", margin: 0 }}>Nenhum item cadastrado no estoque.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {pieces.map((piece) => (
                  <div
                    key={piece.name}
                    style={{
                      border: "1px solid var(--gray-200)",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        backgroundColor: piece.hasCritical ? "#fffbeb" : "var(--gray-50)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                        <span
                          style={{
                            flexShrink: 0,
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 600,
                            backgroundColor: piece.variants[0].type === "EPI" ? "rgba(25,55,109,0.08)" : "#e0f2fe",
                            color: piece.variants[0].type === "EPI" ? "var(--navy-800)" : "#0284c7",
                          }}
                        >
                          {piece.variants[0].type === "EPI" ? "EPI" : "Uniforme"}
                        </span>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--gray-900)",
                            margin: 0,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {piece.name}
                        </p>
                      </div>
                      <span style={{ fontSize: "16px", fontWeight: 800, color: "var(--navy-900)", flexShrink: 0 }}>
                        {piece.total}
                      </span>
                    </div>
                    <div style={{ padding: "10px 16px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {piece.variants.map((v) => {
                        const critical = v.stockQuantity <= v.minStock;
                        return (
                          <span
                            key={v.id}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "4px 10px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: 600,
                              backgroundColor: critical ? "#fef2f2" : "#f3f4f6",
                              border: critical ? "1px solid #fecaca" : "1px solid var(--gray-200)",
                              color: critical ? "#dc2626" : "var(--gray-700)",
                            }}
                          >
                            {v.size || "Único"}
                            <span style={{ fontWeight: 800, fontSize: "14px" }}>{v.stockQuantity}</span>
                            {critical && <AlertTriangle size={12} style={{ color: "#f59e0b" }} strokeWidth={2.5} />}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
