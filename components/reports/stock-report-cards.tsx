"use client";

import { Printer, ShieldCheck, Shirt, AlertTriangle } from "lucide-react";
import type { StockReport } from "@/actions/reports-actions";
import { formatCurrency, formatDate } from "@/lib/utils";

type GroupedProduct = {
  key: string;
  name: string;
  sku: string;
  type: string;
  size: string | null;
  caNumber: string | null;
  caValidity: Date | null;
  unitCost: number;
  supplier: string | null;
  minStock: number;
  novo: { stockQuantity: number; totalValue: number };
  higienizado: { stockQuantity: number; totalValue: number };
};

function StockCard({ group }: { group: GroupedProduct }) {
  const isEpi = group.type === "EPI";
  const totalQty = group.novo.stockQuantity + group.higienizado.stockQuantity;
  const totalValue = group.novo.totalValue + group.higienizado.totalValue;
  const isCritical = totalQty <= group.minStock;

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
      {/* Header */}
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
            {group.name}
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
          {totalQty}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "12px 16px" }}>
        {/* Novo / Higienizado side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#059669" }}>Novo</span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#15803d", lineHeight: 1 }}>
                {group.novo.stockQuantity}
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "#059669", opacity: 0.8 }}>
              {group.novo.totalValue > 0 ? formatCurrency(group.novo.totalValue) : "—"}
            </span>
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              backgroundColor: "#eef2ff",
              border: "1px solid #c7d2fe",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#4338ca" }}>Higienizado</span>
              <span style={{ fontSize: "18px", fontWeight: 800, color: "#4338ca", lineHeight: 1 }}>
                {group.higienizado.stockQuantity}
              </span>
            </div>
            <span style={{ fontSize: "11px", color: "#4338ca", opacity: 0.8 }}>
              {group.higienizado.totalValue > 0 ? formatCurrency(group.higienizado.totalValue) : "—"}
            </span>
          </div>
        </div>

        {/* Details grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
          <div>
            <span style={{ color: "var(--gray-400)", display: "block", marginBottom: "1px" }}>Tamanho</span>
            <span style={{ fontFamily: "monospace", fontWeight: 600, color: "var(--gray-700)" }}>
              {group.size || "Único"}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--gray-400)", display: "block", marginBottom: "1px" }}>Custo Unit.</span>
            <span style={{ fontWeight: 600, color: "var(--gray-700)" }}>
              {group.unitCost > 0 ? formatCurrency(group.unitCost) : "—"}
            </span>
          </div>
          <div>
            <span style={{ color: "var(--gray-400)", display: "block", marginBottom: "1px" }}>Valor Total</span>
            <span style={{ fontWeight: 700, color: "#059669" }}>
              {totalValue > 0 ? formatCurrency(totalValue) : "—"}
            </span>
          </div>
          {group.caNumber && (
            <div>
              <span style={{ color: "var(--gray-400)", display: "block", marginBottom: "1px" }}>CA</span>
              <span style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--gray-600)" }}>
                {group.caNumber}
                {group.caValidity && (
                  <span style={{ marginLeft: "4px", color: new Date(group.caValidity) < new Date() ? "#dc2626" : "var(--gray-400)" }}>
                    (val: {formatDate(group.caValidity)})
                  </span>
                )}
              </span>
            </div>
          )}
          {group.supplier && (
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ color: "var(--gray-400)", display: "block", marginBottom: "1px" }}>Fornecedor</span>
              <span style={{ fontSize: "11px", color: "var(--gray-600)" }}>{group.supplier}</span>
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
            Estoque crítico (mín: {group.minStock})
          </div>
        )}
      </div>
    </div>
  );
}

function groupRows(rows: StockReport["rows"]): GroupedProduct[] {
  const map = new Map<string, GroupedProduct>();

  for (const row of rows) {
    const key = `${row.sku}|${row.size ?? ""}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: row.name,
        sku: row.sku,
        type: row.type,
        size: row.size,
        caNumber: row.caNumber,
        caValidity: row.caValidity,
        unitCost: row.unitCost,
        supplier: row.supplier,
        minStock: row.minStock,
        novo: { stockQuantity: 0, totalValue: 0 },
        higienizado: { stockQuantity: 0, totalValue: 0 },
      });
    }
    const group = map.get(key)!;
    if (row.condition === "NOVO") {
      group.novo.stockQuantity += row.stockQuantity;
      group.novo.totalValue += row.totalValue;
    } else {
      group.higienizado.stockQuantity += row.stockQuantity;
      group.higienizado.totalValue += row.totalValue;
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    if (a.type !== b.type) return a.type === "EPI" ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });
}

export function StockReportCards({ report }: { report: StockReport }) {
  const handlePrint = () => {
    window.print();
  };

  const groups = groupRows(report.rows);

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .stock-report-print, .stock-report-print * { visibility: visible !important; }
          .stock-report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
          .stock-card-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important; }
          .stock-card-grid > div { break-inside: avoid; }
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
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "16px",
          }}
        >
          {groups.map((group) => (
            <StockCard key={group.key} group={group} />
          ))}
        </div>
      </div>
    </div>
  );
}
