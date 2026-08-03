import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSpendingReport } from "@/actions/reports-actions";
import { ReportExportButtons } from "@/components/reports/export-buttons";
import { PeriodSpendCard } from "@/components/reports/period-spend-card";
import { BarChart3, TrendingUp, Package, ClipboardList, Building2, User, Tag } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Relatórios",
  description: "Gastos com EPIs e uniformes por contrato, colaborador e motivo.",
};

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const fromStr = typeof sp.from === "string" ? sp.from : "";
  const toStr = typeof sp.to === "string" ? sp.to : "";

  const report = await getSpendingReport({
    from: fromStr ? new Date(fromStr + "T00:00:00") : undefined,
    to: toStr ? new Date(toStr + "T23:59:59") : undefined,
  });
  const { totals, byProject, byWorker, byReason } = report;

  const cards = [
    {
      label: "Gasto Total",
      value: formatCurrency(totals.totalSpent),
      sub: "em EPIs e uniformes",
      icon: TrendingUp,
      color: "#059669",
      bg: "#d1fae5",
    },
    {
      label: "Itens Entregues",
      value: formatNumber(totals.totalItems),
      sub: "somados no período",
      icon: Package,
      color: "var(--navy-800)",
      bg: "rgba(25, 55, 109, 0.07)",
    },
    {
      label: "Entregas",
      value: formatNumber(totals.totalDeliveries),
      sub: "não canceladas",
      icon: ClipboardList,
      color: "#7c3aed",
      bg: "#ede9fe",
    },
  ];

  const renderTable = (
    title: string,
    icon: ReactNode,
    rows: { key: string; label: string; detail: string; total: number; itemCount: number }[],
    emptyText: string
  ) => (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "14px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
        border: "1px solid var(--gray-200)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid var(--gray-200)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {icon}
        <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--gray-800)" }}>{title}</span>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--gray-400)", fontSize: "13px" }}>
          {emptyText}
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--gray-500)", letterSpacing: "0.6px", textTransform: "uppercase" }}>
                  {title === "Por Contrato" ? "Contrato" : title === "Por Colaborador" ? "Colaborador" : "Motivo"}
                </th>
                <th style={{ padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--gray-500)", letterSpacing: "0.6px", textTransform: "uppercase" }}>
                  {title === "Por Contrato" ? "Centro de Custo" : title === "Por Colaborador" ? "Matrícula" : "Código"}
                </th>
                <th style={{ padding: "12px 24px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "var(--gray-500)", letterSpacing: "0.6px", textTransform: "uppercase" }}>
                  Itens
                </th>
                <th style={{ padding: "12px 24px", textAlign: "right", fontSize: "12px", fontWeight: 600, color: "var(--gray-500)", letterSpacing: "0.6px", textTransform: "uppercase" }}>
                  Gasto
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={row.key} style={{ borderBottom: idx < rows.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
                  <td style={{ padding: "14px 24px", fontWeight: 600, color: "var(--gray-900)" }}>{row.label}</td>
                  <td style={{ padding: "14px 24px", color: "var(--gray-600)", fontSize: "13px", fontFamily: "monospace" }}>
                    {row.detail}
                  </td>
                  <td style={{ padding: "14px 24px", textAlign: "right", color: "var(--gray-600)" }}>{formatNumber(row.itemCount)}</td>
                  <td style={{ padding: "14px 24px", textAlign: "right", fontWeight: 800, color: "#059669" }}>
                    {formatCurrency(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: "32px 40px", flex: 1 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ width: "40px", height: "40px", backgroundColor: "#ede9fe", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BarChart3 size={20} style={{ color: "#7c3aed" }} strokeWidth={2} />
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--navy-900)", letterSpacing: "-0.5px", margin: 0 }}>
              Relatórios de Gasto
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "var(--gray-500)", margin: 0 }}>
            Custo apurado pelo valor unitário registrado em cada entrega. Entregas canceladas não entram no gasto.
          </p>
        </div>
        <ReportExportButtons report={report} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        <PeriodSpendCard
          value={formatCurrency(totals.periodSpent)}
          itemsSub={`${formatNumber(totals.periodItems)} item(s) entregues`}
          from={fromStr}
          to={toStr}
        />
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: card.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={16} style={{ color: card.color }} />
                </div>
                <span style={{ fontSize: "13px", color: "var(--gray-500)", fontWeight: 500 }}>{card.label}</span>
              </div>
              <span style={{ display: "block", fontSize: "26px", fontWeight: 800, color: card.color, lineHeight: 1.1 }}>{card.value}</span>
              <span style={{ display: "block", fontSize: "12px", color: "var(--gray-400)", marginTop: "2px" }}>{card.sub}</span>
            </div>
          );
        })}
      </div>

      {/* Tabelas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: "20px", alignItems: "start" }}>
        {renderTable("Por Contrato", <Building2 size={16} style={{ color: "#0284c7" }} />, byProject, "Nenhuma entrega registrada ainda.")}
        {renderTable("Por Colaborador", <User size={16} style={{ color: "var(--navy-800)" }} />, byWorker, "Nenhuma entrega registrada ainda.")}
        {renderTable("Por Motivo", <Tag size={16} style={{ color: "#d97706" }} />, byReason, "Nenhuma entrega registrada ainda.")}
      </div>
    </div>
  );
}
