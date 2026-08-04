"use client";

import { useState, useMemo, useCallback, type ReactNode } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";

export type SortDirection = "asc" | "desc";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  type?: "string" | "number" | "date";
  render?: (item: T) => ReactNode;
}

interface SortableTableProps<T> {
  data: T[];
  columns: Column<T>[];
  defaultSortKey?: string;
  defaultDirection?: SortDirection;
  renderRow: (item: T, index: number) => ReactNode;
  emptyMessage?: string;
}

export function SortableTable<T extends Record<string, unknown>>({
  data,
  columns,
  defaultSortKey,
  defaultDirection = "asc",
  renderRow,
  emptyMessage = "Nenhum item encontrado.",
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey ?? null);
  const [direction, setDirection] = useState<SortDirection>(defaultDirection);

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setDirection("asc");
      }
    },
    [sortKey]
  );

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    const col = columns.find((c) => c.key === sortKey);
    const type = col?.type ?? "string";

    return [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (type === "number") {
        comparison = Number(aVal) - Number(bVal);
      } else if (type === "date") {
        comparison = new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal), "pt-BR", { sensitivity: "base" });
      }

      return direction === "asc" ? comparison : -comparison;
    });
  }, [data, sortKey, direction, columns]);

  return (
    <thead>
      <tr style={{ backgroundColor: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
        {columns.map((col) => {
          const isActive = sortKey === col.key;
          const isSortable = col.sortable !== false;

          return (
            <th
              key={col.key}
              style={{
                padding: "12px 20px",
                textAlign: "left",
                fontSize: "12px",
                fontWeight: 600,
                color: isActive ? "var(--navy-800)" : "var(--gray-500)",
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                cursor: isSortable ? "pointer" : "default",
                userSelect: "none",
              }}
              onClick={isSortable ? () => handleSort(col.key) : undefined}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                {col.label}
                {isSortable && (
                  <span style={{ display: "inline-flex", alignItems: "center", opacity: isActive ? 1 : 0.4 }}>
                    {isActive ? (
                      direction === "asc" ? (
                        <ChevronUp size={14} strokeWidth={2.5} />
                      ) : (
                        <ChevronDown size={14} strokeWidth={2.5} />
                      )
                    ) : (
                      <ChevronsUpDown size={14} strokeWidth={2} />
                    )}
                  </span>
                )}
              </span>
            </th>
          );
        })}
      </tr>
      <tbody>
        {sortedData.length === 0 ? (
          <tr>
            <td
              colSpan={columns.length}
              style={{ padding: "40px 20px", textAlign: "center", color: "var(--gray-400)" }}
            >
              {emptyMessage}
            </td>
          </tr>
        ) : (
          sortedData.map((item, idx) => renderRow(item, idx))
        )}
      </tbody>
    </thead>
  );
}
