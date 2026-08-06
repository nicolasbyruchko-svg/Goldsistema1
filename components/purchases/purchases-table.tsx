"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, FileText, Building2, CalendarDays } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

type SortDirection = "asc" | "desc";

interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface PurchaseItem {
  id: string;
  quantity: number;
  unitCost: number;
  product: { name: string };
}

interface Purchase {
  id: string;
  nfNumber: string;
  supplier: string;
  issueDate: Date;
  totalValue: number;
  createdBy: { id: string; name: string; username: string } | null;
  items: PurchaseItem[];
}

export function PurchasesTable({ purchases }: { purchases: Purchase[] }) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "issueDate", direction: "desc" });

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const sortedPurchases = useMemo(() => {
    return [...purchases].sort((a, b) => {
      const aVal: unknown = a[sortConfig.key as keyof Purchase];
      const bVal: unknown = b[sortConfig.key as keyof Purchase];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (sortConfig.key === "issueDate") {
        comparison = new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
      } else if (sortConfig.key === "totalValue") {
        comparison = Number(aVal) - Number(bVal);
      } else {
        comparison = String(aVal).localeCompare(String(bVal), "pt-BR", { sensitivity: "base" });
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [purchases, sortConfig]);

  const renderSortIcon = (key: string) => {
    const isActive = sortConfig.key === key;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", marginLeft: "4px", opacity: isActive ? 1 : 0.4 }}>
        {isActive ? (
          sortConfig.direction === "asc" ? <ChevronUp size={14} strokeWidth={2.5} /> : <ChevronDown size={14} strokeWidth={2.5} />
        ) : (
          <ChevronsUpDown size={14} strokeWidth={2} />
        )}
      </span>
    );
  };

  const thStyle = (key: string) => ({
    padding: "12px 24px",
    textAlign: "left" as const,
    fontSize: "12px",
    fontWeight: 600,
    color: sortConfig.key === key ? "var(--navy-800)" : "var(--gray-500)",
    letterSpacing: "0.6px",
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap" as const,
    cursor: "pointer",
    userSelect: "none" as const,
  });

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
        <thead>
          <tr style={{ backgroundColor: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
            <th style={thStyle("nfNumber")} onClick={() => handleSort("nfNumber")}>NF{renderSortIcon("nfNumber")}</th>
            <th style={thStyle("supplier")} onClick={() => handleSort("supplier")}>Fornecedor{renderSortIcon("supplier")}</th>
            <th style={thStyle("issueDate")} onClick={() => handleSort("issueDate")}>Data de Emissão{renderSortIcon("issueDate")}</th>
            <th style={{ ...thStyle("createdBy"), cursor: "default" }}>Usuário</th>
            <th style={{ ...thStyle("items"), cursor: "default" }}>Itens</th>
            <th style={thStyle("totalValue")} onClick={() => handleSort("totalValue")}>Valor Total{renderSortIcon("totalValue")}</th>
          </tr>
        </thead>
        <tbody>
          {sortedPurchases.map((invoice, idx) => (
            <tr key={invoice.id} style={{ borderBottom: idx < sortedPurchases.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
              <td style={{ padding: "14px 24px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "var(--navy-900)", fontFamily: "monospace", fontSize: "13px" }}>
                  <FileText size={13} style={{ color: "#0284c7" }} />
                  {invoice.nfNumber}
                </span>
              </td>
              <td style={{ padding: "14px 24px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--gray-800)" }}>
                  <Building2 size={13} style={{ color: "var(--gray-400)" }} />
                  {invoice.supplier}
                </span>
              </td>
              <td style={{ padding: "14px 24px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--gray-600)", fontSize: "13px" }}>
                  <CalendarDays size={13} style={{ color: "var(--gray-400)" }} />
                  {formatDate(invoice.issueDate)}
                </span>
              </td>
              <td style={{ padding: "14px 24px", color: "var(--gray-600)", fontSize: "13px", whiteSpace: "nowrap" }}>
                {invoice.createdBy?.name ?? <span style={{ color: "var(--gray-300)" }}>—</span>}
              </td>
              <td style={{ padding: "14px 24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {invoice.items.slice(0, 2).map((item) => (
                    <span key={item.id} style={{ fontSize: "12px", color: "var(--gray-600)" }}>
                      {item.quantity}× {item.product.name} — {formatCurrency(Number(item.unitCost))}
                    </span>
                  ))}
                  {invoice.items.length > 2 && (
                    <span style={{ fontSize: "11px", color: "var(--gray-400)" }}>
                      +{invoice.items.length - 2} item(s)
                    </span>
                  )}
                </div>
              </td>
              <td style={{ padding: "14px 24px" }}>
                <span style={{ fontSize: "15px", fontWeight: 800, color: "#059669" }}>
                  {formatCurrency(Number(invoice.totalValue))}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
