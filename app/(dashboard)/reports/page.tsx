import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getSpendingReport, getUsageReport, getHygieneRepairReport } from "@/actions/reports-actions";
import { ReportExportButtons } from "@/components/reports/export-buttons";
import { PeriodSpendCard } from "@/components/reports/period-spend-card";
import { UsageReportFilters } from "@/components/reports/usage-report-filters";
import { UsageReportExportButtons } from "@/components/reports/usage-report-export-buttons";
import { HygieneRepairReportExportButtons } from "@/components/reports/hygiene-repair-report-export-buttons";
import { BarChart3, TrendingUp, Package, ClipboardList, Building2, User, Tag, ClipboardCheck, Droplets, Wrench } from "lucide-react";
import { formatCurrency, formatNumber, formatDate, formatReason } from "@/lib/utils";

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

  const toArr = (v: string | string[] | undefined): string[] => {
    if (!v) return [];
    return Array.isArray(v) ? v.filter(Boolean) : v ? [v] : [];
  };

  const usageProductIds = toArr(sp.usageProductId);
  const usageSize = typeof sp.usageSize === "string" ? sp.usageSize : "";
  const usageProjectIds = toArr(sp.usageProjectId);
  const usageFromStr = typeof sp.usageFrom === "string" ? sp.usageFrom : "";
  const usageToStr = typeof sp.usageTo === "string" ? sp.usageTo : "";

  const [report, usageReport, hygieneRepairReport] = await Promise.all([
    getSpendingReport({
      from: fromStr ? new Date(fromStr + "T00:00:00") : undefined,
      to: toStr ? new Date(toStr + "T23:59:59") : undefined,
    }),
    getUsageReport({
      productIds: usageProductIds.length > 0 ? usageProductIds : undefined,
      size: usageSize || undefined,
      projectIds: usageProjectIds.length > 0 ? usageProjectIds : undefined,
      from: usageFromStr ? new Date(usageFromStr + "T00:00:00") : undefined,
      to: usageToStr ? new Date(usageToStr + "T23:59:59") : undefined,
    }),
    getHygieneRepairReport(),
  ]);
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

      {/* Relatório de Uso */}
      <div style={{ marginTop: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "9px", backgroundColor: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClipboardCheck size={18} style={{ color: "#d97706" }} />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--navy-900)", margin: 0 }}>
              Relatório de Uso
            </h2>
          </div>
          <UsageReportExportButtons report={usageReport} />
        </div>

        <UsageReportFilters
          products={usageReport.products}
          sizes={usageReport.sizes}
          projects={usageReport.projects}
          currentFilters={{
            productIds: usageProductIds,
            size: usageSize,
            projectIds: usageProjectIds,
            from: usageFromStr,
            to: usageToStr,
          }}
        />

        {/* Stats do Relatório de Uso */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "16px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)" }}>
            <span style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: 500 }}>Registros</span>
            <span style={{ display: "block", fontSize: "22px", fontWeight: 800, color: "var(--navy-900)", lineHeight: 1.1, marginTop: "2px" }}>
              {formatNumber(usageReport.totals.totalRows)}
            </span>
          </div>
          <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)" }}>
            <span style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: 500 }}>Itens Entregues</span>
            <span style={{ display: "block", fontSize: "22px", fontWeight: 800, color: "#0284c7", lineHeight: 1.1, marginTop: "2px" }}>
              {formatNumber(usageReport.totals.totalItems)}
            </span>
          </div>
          <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)" }}>
            <span style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: 500 }}>Gasto Total</span>
            <span style={{ display: "block", fontSize: "22px", fontWeight: 800, color: "#059669", lineHeight: 1.1, marginTop: "2px" }}>
              {formatCurrency(usageReport.totals.totalSpent)}
            </span>
          </div>
        </div>

        {/* Tabela de Uso */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "14px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
            border: "1px solid var(--gray-200)",
            overflow: "hidden",
            marginTop: "16px",
          }}
        >
          {usageReport.rows.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--gray-400)", fontSize: "13px" }}>
              Nenhum registro de uso encontrado para os filtros selecionados.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
                    {["Data", "Colaborador", "Contrato", "Peça", "Tamanho", "Qtd", "Custo Unit.", "Total", "Motivo"].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "12px 20px",
                          textAlign: col === "Qtd" || col === "Custo Unit." || col === "Total" ? "right" : "left",
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
                  {usageReport.rows.map((row, idx) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: idx < usageReport.rows.length - 1 ? "1px solid var(--gray-100)" : "none" }}
                    >
                      <td style={{ padding: "12px 20px", whiteSpace: "nowrap", color: "var(--gray-600)" }}>
                        {formatDate(row.date)}
                      </td>
                      <td style={{ padding: "12px 20px", fontWeight: 600, color: "var(--gray-900)" }}>
                        {row.workerName}
                      </td>
                      <td style={{ padding: "12px 20px", color: "var(--gray-600)", fontSize: "13px" }}>
                        {row.projectName}
                      </td>
                      <td style={{ padding: "12px 20px", fontWeight: 600, color: "var(--gray-900)" }}>
                        {row.productName}
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
                          {row.productSize || "Único"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 600, color: "var(--gray-700)" }}>
                        {row.quantity}
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", color: "var(--gray-600)" }}>
                        {formatCurrency(row.unitCost)}
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 800, color: "#059669" }}>
                        {formatCurrency(row.total)}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "3px 10px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 600,
                            backgroundColor: row.reason === "FIRST_DELIVERY" ? "#d1fae5" : row.reason === "REPLACEMENT_LOSS" ? "#fef3c7" : "#ede9fe",
                            color: row.reason === "FIRST_DELIVERY" ? "#059669" : row.reason === "REPLACEMENT_LOSS" ? "#92400e" : "#7c3aed",
                          }}
                        >
                          {formatReason(row.reason)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Relatório de Higienização e Reparo */}
      <div style={{ marginTop: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "9px", backgroundColor: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Droplets size={18} style={{ color: "#4338ca" }} />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "var(--navy-900)", margin: 0 }}>
              Higienização e Reparo
            </h2>
          </div>
          <HygieneRepairReportExportButtons report={hygieneRepairReport} />
        </div>

        <p style={{ fontSize: "13px", color: "var(--gray-500)", margin: "0 0 16px 0" }}>
          Itens devolvidos aguardando triagem (higienização) e itens em processo de reparo (costura).
        </p>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)" }}>
            <span style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: 500 }}>Total Pendente</span>
            <span style={{ display: "block", fontSize: "22px", fontWeight: 800, color: "var(--navy-900)", lineHeight: 1.1, marginTop: "2px" }}>
              {formatNumber(hygieneRepairReport.totals.totalItems)}
            </span>
          </div>
          <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Droplets size={14} style={{ color: "#d97706" }} />
              <span style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: 500 }}>Em Higienização</span>
            </div>
            <span style={{ display: "block", fontSize: "22px", fontWeight: 800, color: "#d97706", lineHeight: 1.1, marginTop: "2px" }}>
              {formatNumber(hygieneRepairReport.totals.totalHygiene)}
            </span>
          </div>
          <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
              <Wrench size={14} style={{ color: "#4338ca" }} />
              <span style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: 500 }}>Em Reparo</span>
            </div>
            <span style={{ display: "block", fontSize: "22px", fontWeight: 800, color: "#4338ca", lineHeight: 1.1, marginTop: "2px" }}>
              {formatNumber(hygieneRepairReport.totals.totalRepair)}
            </span>
          </div>
        </div>

        {/* Tabela Higienização */}
        {hygieneRepairReport.hygieneRows.length > 0 && (
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: "14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.07)",
              border: "1px solid var(--gray-200)",
              overflow: "hidden",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                padding: "14px 24px",
                borderBottom: "1px solid var(--gray-200)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Droplets size={16} style={{ color: "#d97706" }} />
              <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--gray-800)" }}>
                Itens em Higienização — Aguardando triagem
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
                    {["Colaborador", "Contrato", "Peça", "Tamanho", "Total", "Aprovadas", "Reprovadas", "Pendentes", "Devolução"].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "12px 20px",
                          textAlign: ["Total", "Aprovadas", "Reprovadas", "Pendentes"].includes(col) ? "right" : "left",
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
                  {hygieneRepairReport.hygieneRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: idx < hygieneRepairReport.hygieneRows.length - 1 ? "1px solid var(--gray-100)" : "none" }}
                    >
                      <td style={{ padding: "12px 20px", fontWeight: 600, color: "var(--gray-900)" }}>
                        {row.workerName}
                      </td>
                      <td style={{ padding: "12px 20px", color: "var(--gray-600)", fontSize: "13px" }}>
                        {row.projectName}
                      </td>
                      <td style={{ padding: "12px 20px", fontWeight: 600, color: "var(--gray-900)" }}>
                        {row.productName}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", backgroundColor: "var(--gray-100)", padding: "2px 7px", borderRadius: "5px", color: "var(--gray-700)" }}>
                          {row.productSize || "Único"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 600, color: "var(--gray-700)" }}>
                        {row.quantity}
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 600, color: "#059669" }}>
                        {row.approvedQty}
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 600, color: "#dc2626" }}>
                        {row.rejectedQty}
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 700, color: "#d97706" }}>
                        {row.pendingQty}
                      </td>
                      <td style={{ padding: "12px 20px", whiteSpace: "nowrap", color: "var(--gray-600)" }}>
                        {formatDate(row.devolvedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tabela Reparo */}
        {hygieneRepairReport.repairRows.length > 0 && (
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
                padding: "14px 24px",
                borderBottom: "1px solid var(--gray-200)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Wrench size={16} style={{ color: "#4338ca" }} />
              <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--gray-800)" }}>
                Itens em Reparo — Aguardando conserto
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
                    {["Colaborador", "Contrato", "Peça", "Tamanho", "Total", "Já Reparados", "Pendentes", "Devolução"].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "12px 20px",
                          textAlign: ["Total", "Já Reparados", "Pendentes"].includes(col) ? "right" : "left",
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
                  {hygieneRepairReport.repairRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: idx < hygieneRepairReport.repairRows.length - 1 ? "1px solid var(--gray-100)" : "none" }}
                    >
                      <td style={{ padding: "12px 20px", fontWeight: 600, color: "var(--gray-900)" }}>
                        {row.workerName}
                      </td>
                      <td style={{ padding: "12px 20px", color: "var(--gray-600)", fontSize: "13px" }}>
                        {row.projectName}
                      </td>
                      <td style={{ padding: "12px 20px", fontWeight: 600, color: "var(--gray-900)" }}>
                        {row.productName}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", backgroundColor: "var(--gray-100)", padding: "2px 7px", borderRadius: "5px", color: "var(--gray-700)" }}>
                          {row.productSize || "Único"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 600, color: "var(--gray-700)" }}>
                        {row.quantity}
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 600, color: "#059669" }}>
                        {row.repairedQty}
                      </td>
                      <td style={{ padding: "12px 20px", textAlign: "right", fontWeight: 700, color: "#4338ca" }}>
                        {row.pendingQty}
                      </td>
                      <td style={{ padding: "12px 20px", whiteSpace: "nowrap", color: "var(--gray-600)" }}>
                        {formatDate(row.devolvedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {hygieneRepairReport.totals.totalRows === 0 && (
          <div style={{ backgroundColor: "#fff", borderRadius: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)", padding: "40px 24px", textAlign: "center", color: "var(--gray-400)", fontSize: "13px" }}>
            Nenhum item em higienização ou reparo no momento.
          </div>
        )}
      </div>
    </div>
  );
}
