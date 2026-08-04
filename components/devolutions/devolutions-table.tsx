"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Building2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type SortDirection = "asc" | "desc";

interface SortConfig {
  key: string;
  direction: SortDirection;
}

const REASON_LABELS: Record<string, string> = {
  DISMISSAL: "Desligamento",
  EXCHANGE: "Troca",
};

const CONDITION_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  GOOD: { label: "Bom estado", bg: "#dcfce7", color: "#15803d" },
  DAMAGED: { label: "Rasgado / Deteriorado", bg: "#fef3c7", color: "#92400e" },
  UNUSABLE: { label: "Não utilizável", bg: "#fee2e2", color: "#dc2626" },
};

function ConditionBadge({ condition }: { condition: string }) {
  const style = CONDITION_CONFIG[condition] ?? { label: condition, bg: "#f3f4f6", color: "#6b7280" };
  return (
    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: "999px", fontSize: "11px", fontWeight: 600, backgroundColor: style.bg, color: style.color, whiteSpace: "nowrap" }}>
      {style.label}
    </span>
  );
}

interface DevolutionItem {
  id: string;
  quantity: number;
  condition: string;
  product: { name: string };
}

interface Devolution {
  id: string;
  reason: string;
  devolvedAt: Date;
  worker: { name: string; matricula: string };
  project: { name: string } | null;
  items: DevolutionItem[];
}

export function DevolutionsTable({ devolutions }: { devolutions: Devolution[] }) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "devolvedAt", direction: "desc" });

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const sortedDevolutions = useMemo(() => {
    return [...devolutions].sort((a, b) => {
      let aVal: unknown, bVal: unknown;

      if (sortConfig.key === "worker") {
        aVal = a.worker.name;
        bVal = b.worker.name;
      } else if (sortConfig.key === "project") {
        aVal = a.project?.name ?? "";
        bVal = b.project?.name ?? "";
      } else if (sortConfig.key === "goodQty") {
        aVal = a.items.filter((i) => i.condition === "GOOD").reduce((s, i) => s + i.quantity, 0);
        bVal = b.items.filter((i) => i.condition === "GOOD").reduce((s, i) => s + i.quantity, 0);
      } else if (sortConfig.key === "badQty") {
        aVal = a.items.filter((i) => i.condition !== "GOOD").reduce((s, i) => s + i.quantity, 0);
        bVal = b.items.filter((i) => i.condition !== "GOOD").reduce((s, i) => s + i.quantity, 0);
      } else {
        aVal = a[sortConfig.key as keyof Devolution];
        bVal = b[sortConfig.key as keyof Devolution];
      }

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (sortConfig.key === "devolvedAt") {
        comparison = new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
      } else if (sortConfig.key === "goodQty" || sortConfig.key === "badQty") {
        comparison = Number(aVal) - Number(bVal);
      } else {
        comparison = String(aVal).localeCompare(String(bVal), "pt-BR", { sensitivity: "base" });
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [devolutions, sortConfig]);

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
            <th style={thStyle("worker")} onClick={() => handleSort("worker")}>Colaborador{renderSortIcon("worker")}</th>
            <th style={thStyle("project")} onClick={() => handleSort("project")}>Contrato / CC{renderSortIcon("project")}</th>
            <th style={thStyle("devolvedAt")} onClick={() => handleSort("devolvedAt")}>Data{renderSortIcon("devolvedAt")}</th>
            <th style={thStyle("reason")} onClick={() => handleSort("reason")}>Motivo{renderSortIcon("reason")}</th>
            <th style={{ ...thStyle("items"), cursor: "default" }}>Itens</th>
            <th style={thStyle("goodQty")} onClick={() => handleSort("goodQty")}>Retorno ao estoque{renderSortIcon("goodQty")}</th>
            <th style={thStyle("badQty")} onClick={() => handleSort("badQty")}>Descartados{renderSortIcon("badQty")}</th>
          </tr>
        </thead>
        <tbody>
          {sortedDevolutions.map((devolution, idx) => {
            const goodQty = devolution.items.filter((i) => i.condition === "GOOD").reduce((s, i) => s + i.quantity, 0);
            const badQty = devolution.items.filter((i) => i.condition !== "GOOD").reduce((s, i) => s + i.quantity, 0);
            return (
              <tr key={devolution.id} style={{ borderBottom: idx < sortedDevolutions.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
                <td style={{ padding: "14px 24px" }}>
                  <span style={{ display: "block", fontWeight: 600, color: "var(--gray-900)" }}>{devolution.worker.name}</span>
                  <span style={{ display: "block", fontSize: "12px", color: "var(--gray-400)", fontFamily: "monospace" }}>
                    Mat. {devolution.worker.matricula}
                  </span>
                </td>
                <td style={{ padding: "14px 24px" }}>
                  {devolution.project ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, backgroundColor: "rgba(25,55,109,0.08)", color: "var(--navy-800)", border: "1px solid rgba(25,55,109,0.15)" }}>
                      <Building2 size={11} strokeWidth={2.5} />
                      {devolution.project.name}
                    </span>
                  ) : (
                    <span style={{ fontSize: "13px", color: "var(--gray-400)", fontStyle: "italic" }}>Sem contrato</span>
                  )}
                </td>
                <td style={{ padding: "14px 24px", color: "var(--gray-600)", fontSize: "13px", whiteSpace: "nowrap" }}>
                  {formatDateTime(devolution.devolvedAt)}
                </td>
                <td style={{ padding: "14px 24px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--gray-700)" }}>
                    {REASON_LABELS[devolution.reason] ?? devolution.reason}
                  </span>
                </td>
                <td style={{ padding: "14px 24px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {devolution.items.map((item) => (
                      <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "var(--gray-600)" }}>
                          {item.quantity}× {item.product.name}
                        </span>
                        <ConditionBadge condition={item.condition} />
                      </div>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "14px 24px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: goodQty > 0 ? "#15803d" : "var(--gray-300)" }}>
                    +{goodQty}
                  </span>
                </td>
                <td style={{ padding: "14px 24px" }}>
                  <span style={{ fontSize: "15px", fontWeight: 700, color: badQty > 0 ? "#dc2626" : "var(--gray-300)" }}>
                    {badQty}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
