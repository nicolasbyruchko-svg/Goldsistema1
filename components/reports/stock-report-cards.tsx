"use client";

import { Printer, ShieldCheck, Shirt, AlertTriangle } from "lucide-react";
import type { StockReport } from "@/actions/reports-actions";
import { formatCurrency, formatDate } from "@/lib/utils";

function StockCard({ row }: { row: StockReport["rows"][number] }) {
  const isEpi = row.type === "EPI";
  const isCritical = row.isCritical;

  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: "12px",
        border: isCritical ? "1px solid #fde68a" : "1px solid var(--gray-200)",
        overflow: "hidden",
        breakInside: "avoid",
      }}
    >
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--gray-100)",
          backgroundColor: isCritical ? "#fffbeb" : "var(--gray-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              borderRadius: "999px",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              backgroundColor: isEpi ? "rgba(25,55,109,0.08)" : "#e0f2fe",
              color: isEpi ? "var(--navy-800)" : "#0284c7",
              flexShrink: 0,
            }}
          >
            {isEpi ? <ShieldCheck size={10} style={{ marginRight: "3px" }} /> : <Shirt size={10} style={{ marginRight: "3px" }} />}
            {isEpi ? "EPI" : "UNIFORME"}
          </span>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--gray-900)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {row.name}
          </span>
        </div>
        <span
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: isCritical ? "#dc2626" : "#15803d",
            flexShrink: 0,
            lineHeight: 1,
          }}
        >
          {row.stockQuantity}
        </span>
      </div>

      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
          <div>
            <span style={{ color: "var(--gray-400)", display: "block", marginBottom: "1px" }}>Condição</span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "1px 6px",
                borderRadius: "999px",
                fontSize: "11px",
                fontWeight: 600,
                backgroundColor: row.condition === "NOVO" ? "#d1fae5" : "#e0e7ff",
                color: row.condition === "NOVO" ? "#059669" : "#4338ca",
              }}
            >
              {row.condition === "NOVO" ? "Novo" : "Higienizado"}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--gray-400)", display: "block", marginBottom: "1px" }}>Tamanho</span>
            <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--gray-700)" }}>
              {row.size || "Único"}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--gray-400)", display: "block", marginBottom: "1px" }}>Custo Unit.</span>
            <span style={{ fontWeight: 600, color: "var(--gray-700)" }}>
              {row.unitCost > 0 ? formatCurrency(row.unitCost) : "—"}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--gray-400)", display: "block", marginBottom: "1px" }}>Valor Total</span>
            <span style={{ fontWeight: 700, color: "#059669" }}>
              {row.totalValue > 0 ? formatCurrency(row.totalValue) : "—"}
            </span>
          </div>
          {row.caNumber && (
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ color: "var(--gray-400)", display: "block", marginBottom: "1px" }}>CA</span>
              <span style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--gray-600)" }}>
                {row.caNumber}
                {row.caValidity && (
                  <span style={{ marginLeft: "6px", color: new Date(row.caValidity) < new Date() ? "#dc2626" : "var(--gray-400)" }}>
                    (val: {formatDate(row.caValidity)})
                  </span>
                )}
              </span>
            </div>
          )}
          {row.supplier && (
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ color: "var(--gray-400)", display: "block", marginBottom: "1px" }}>Fornecedor</span>
              <span style={{ fontSize: "11px", color: "var(--gray-600)" }}>{row.supplier}</span>
            </div>
          )}
        </div>
        {isCritical && (
          <div
            style={{
              marginTop: "10px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "4px 8px",
              borderRadius: "6px",
              backgroundColor: "#fef3c7",
              fontSize: "11px",
              fontWeight: 600,
              color: "#92400e",
            }}
          >
            <AlertTriangle size={12} />
            Estoque crítico (mín: {row.minStock})
          </div>
        )}
      </div>
    </div>
  );
}

export function StockReportCards({ report }: { report: StockReport }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .stock-report-print area, .stock-report-print area * { visibility: visible; }
          .stock-report-print { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .stock-card-grid { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: "16px" }}>
        <button
          type="button"
          onClick={handlePrint}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            borderRadius: "10px",
            fontSize: "14px",
            fontWeight: 600,
            border: "1px solid var(--gray-200)",
            backgroundColor: "#fff",
            color: "var(--navy-900)",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          }}
        >
          <Printer size={16} /> Imprimir
        </button>
      </div>

      <div className="stock-report-print">
        <div
          className="stock-card-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
          }}
        >
          {report.rows.map((row) => (
            <StockCard key={row.id} row={row} />
          ))}
        </div>
      </div>
    </div>
  );
}
