"use client";

import { useState, useMemo, useCallback } from "react";
import { AlertTriangle, ShieldCheck, Shirt, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { EditProductButton } from "@/components/stock/edit-product-button";
import { DeleteProductButton } from "@/components/stock/delete-product-button";
import { formatDate, formatCurrency } from "@/lib/utils";
import type { SerializableProduct } from "@/lib/types";

type SortDirection = "asc" | "desc";

interface SortConfig {
  key: string;
  direction: SortDirection;
}

export function StockTable({ products }: { products: SerializableProduct[] }) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" });

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      const aVal = a[sortConfig.key as keyof SerializableProduct];
      const bVal = b[sortConfig.key as keyof SerializableProduct];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), "pt-BR", { sensitivity: "base" });
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [products, sortConfig]);

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
    padding: "12px 20px",
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
            <th style={thStyle("name")} onClick={() => handleSort("name")}>Produto{renderSortIcon("name")}</th>
            <th style={thStyle("sku")} onClick={() => handleSort("sku")}>SKU{renderSortIcon("sku")}</th>
            <th style={thStyle("type")} onClick={() => handleSort("type")}>Tipo{renderSortIcon("type")}</th>
            <th style={thStyle("condition")} onClick={() => handleSort("condition")}>Condição{renderSortIcon("condition")}</th>
            <th style={thStyle("size")} onClick={() => handleSort("size")}>Tamanho{renderSortIcon("size")}</th>
            <th style={{ ...thStyle("caNumber"), cursor: "default" }}>CA / Validade</th>
            <th style={thStyle("unitCost")} onClick={() => handleSort("unitCost")}>Custo Unit.{renderSortIcon("unitCost")}</th>
            <th style={thStyle("supplier")} onClick={() => handleSort("supplier")}>Fornecedor{renderSortIcon("supplier")}</th>
            <th style={{ ...thStyle("updatedBy"), cursor: "default" }}>Últ. alteração por</th>
            <th style={thStyle("stockQuantity")} onClick={() => handleSort("stockQuantity")}>Estoque{renderSortIcon("stockQuantity")}</th>
            <th style={thStyle("minStock")} onClick={() => handleSort("minStock")}>Mín.{renderSortIcon("minStock")}</th>
            <th style={{ ...thStyle("actions"), cursor: "default" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {sortedProducts.map((product, idx) => {
            const isCritical = product.stockQuantity <= product.minStock;
            return (
              <tr key={product.id} style={{ borderBottom: idx < sortedProducts.length - 1 ? "1px solid var(--gray-100)" : "none", backgroundColor: isCritical ? "#fffbeb" : "transparent" }}>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: product.type === "EPI" ? "rgba(25,55,109,0.08)" : "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {product.type === "EPI" ? <ShieldCheck size={16} style={{ color: "var(--navy-800)" }} /> : <Shirt size={16} style={{ color: "#0284c7" }} />}
                    </div>
                    <span style={{ fontWeight: 600, color: "var(--gray-900)" }}>{product.name}</span>
                  </div>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "12px", backgroundColor: "var(--gray-100)", padding: "2px 7px", borderRadius: "5px", color: "var(--gray-700)" }}>
                    {product.sku}
                  </span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, backgroundColor: product.type === "EPI" ? "rgba(25,55,109,0.08)" : "#e0f2fe", color: product.type === "EPI" ? "var(--navy-800)" : "#0284c7" }}>
                    {product.type === "EPI" ? "EPI" : "Uniforme"}
                  </span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, backgroundColor: product.condition === "NOVO" ? "#d1fae5" : "#e0f2fe", color: product.condition === "NOVO" ? "#059669" : "#0284c7" }}>
                    {product.condition === "NOVO" ? "Novo" : "Higienizado"}
                  </span>
                </td>
                <td style={{ padding: "14px 20px", color: "var(--gray-500)", fontSize: "13px" }}>
                  {product.size || "—"}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  {product.caNumber ? (
                    <div>
                      <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--gray-700)" }}>CA {product.caNumber}</span>
                      <span style={{ display: "block", fontSize: "11px", color: product.caValidity && new Date(product.caValidity) < new Date() ? "#dc2626" : "var(--gray-400)" }}>
                        {formatDate(product.caValidity)}
                      </span>
                    </div>
                  ) : (
                    <span style={{ color: "var(--gray-300)", fontSize: "13px" }}>—</span>
                  )}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--gray-800)" }}>
                    {product.unitCost != null ? formatCurrency(Number(product.unitCost)) : <span style={{ color: "var(--gray-300)", fontWeight: 400 }}>—</span>}
                  </span>
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <span style={{ fontSize: "12px", color: "var(--gray-600)" }}>
                    {product.supplier || <span style={{ color: "var(--gray-300)" }}>—</span>}
                  </span>
                </td>
                <td style={{ padding: "14px 20px", fontSize: "12px", color: "var(--gray-600)", whiteSpace: "nowrap" }}>
                  {(product.updatedBy?.name ?? product.createdBy?.name) || <span style={{ color: "var(--gray-300)" }}>—</span>}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px", fontWeight: 800, color: isCritical ? "#dc2626" : "#15803d" }}>
                      {product.stockQuantity}
                    </span>
                    {isCritical && <AlertTriangle size={14} style={{ color: "#f59e0b" }} strokeWidth={2.5} />}
                  </div>
                </td>
                <td style={{ padding: "14px 20px", color: "var(--gray-400)", fontSize: "13px" }}>
                  {product.minStock}
                </td>
                <td style={{ padding: "14px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <EditProductButton product={product} />
                    <DeleteProductButton product={product} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
