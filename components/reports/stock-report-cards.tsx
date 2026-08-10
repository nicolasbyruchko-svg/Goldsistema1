"use client";

import { Printer, ShieldCheck, Shirt, AlertTriangle } from "lucide-react";
import type { StockReport } from "@/actions/reports-actions";
import { formatCurrency, formatDate } from "@/lib/utils";

type SizeEntry = { size: string | null; qty: number; value: number };

type GroupedProduct = {
  key: string;
  name: string;
  type: string;
  caNumber: string | null;
  caValidity: Date | null;
  supplier: string | null;
  minStock: number;
  novo: SizeEntry[];
  higienizado: SizeEntry[];
  novoTotal: number;
  higienizadoTotal: number;
};

function SizeGrid({ entries, color }: { entries: SizeEntry[]; color: string }) {
  if (entries.length === 0) {
    return <span style={{ fontSize: "11px", color: "var(--gray-300)" }}>—</span>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
      {entries.map((e) => (
        <span
          key={e.size ?? "__"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
            padding: "2px 7px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: 600,
            fontFamily: "monospace",
            backgroundColor: color === "green" ? "#dcfce7" : "#e0e7ff",
            color: color === "green" ? "#15803d" : "#4338ca",
          }}
        >
          {e.size || "Único"}: {e.qty}
        </span>
      ))}
    </div>
  );
}

function StockCard({ group }: { group: GroupedProduct }) {
  const isEpi = group.type === "EPI";
  const totalQty = group.novoTotal + group.higienizadoTotal;
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
        {/* Novo / Higienizado grids side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              backgroundColor: "#f0fdf4",
              border: "1px solid #bbf7d0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#059669" }}>Novo</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#15803d", lineHeight: 1 }}>
                {group.novoTotal}
              </span>
            </div>
            <SizeGrid entries={group.novo} color="green" />
          </div>

          <div
            style={{
              padding: "10px 12px",
              borderRadius: "8px",
              backgroundColor: "#eef2ff",
              border: "1px solid #c7d2fe",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#4338ca" }}>Higienizado</span>
              <span style={{ fontSize: "16px", fontWeight: 800, color: "#4338ca", lineHeight: 1 }}>
                {group.higienizadoTotal}
              </span>
            </div>
            <SizeGrid entries={group.higienizado} color="blue" />
          </div>
        </div>

        {/* Details */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "11px", color: "var(--gray-500)" }}>
          {group.caNumber && (
            <span>
              CA: <span style={{ fontFamily: "monospace", color: "var(--gray-600)" }}>{group.caNumber}</span>
              {group.caValidity && (
                <span style={{ marginLeft: "4px", color: new Date(group.caValidity) < new Date() ? "#dc2626" : "var(--gray-400)" }}>
                  (val: {formatDate(group.caValidity)})
                </span>
              )}
            </span>
          )}
          {group.supplier && (
            <span>Forn.: <span style={{ color: "var(--gray-600)" }}>{group.supplier}</span></span>
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
    const key = `${row.name}|${row.type}`;
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: row.name,
        type: row.type,
        caNumber: row.caNumber,
        caValidity: row.caValidity,
        supplier: row.supplier,
        minStock: row.minStock,
        novo: [],
        higienizado: [],
        novoTotal: 0,
        higienizadoTotal: 0,
      });
    }
    const group = map.get(key)!;

    const sizeEntry: SizeEntry = { size: row.size, qty: row.stockQuantity, value: row.totalValue };

    if (row.condition === "NOVO") {
      group.novo.push(sizeEntry);
      group.novoTotal += row.stockQuantity;
    } else {
      group.higienizado.push(sizeEntry);
      group.higienizadoTotal += row.stockQuantity;
    }
  }

  const groups = Array.from(map.values());

  for (const g of groups) {
    g.novo.sort((a, b) => (a.size ?? "").localeCompare(b.size ?? ""));
    g.higienizado.sort((a, b) => (a.size ?? "").localeCompare(b.size ?? ""));
  }

  groups.sort((a, b) => {
    if (a.type !== b.type) return a.type === "EPI" ? -1 : 1;
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return groups;
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
          .stock-card-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important; }
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
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
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
