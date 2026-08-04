"use client";

import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { SortDirection } from "@/hooks/use-table-sort";

interface SortableThProps {
  label: string;
  sortKey: string;
  currentSortKey?: string | null;
  currentDirection?: SortDirection;
  onSort: (key: string) => void;
  style?: React.CSSProperties;
}

export function SortableTh({
  label,
  sortKey,
  currentSortKey,
  currentDirection,
  onSort,
  style,
}: SortableThProps) {
  const isActive = currentSortKey === sortKey;

  return (
    <th
      style={{
        padding: "12px 20px",
        textAlign: "left",
        fontSize: "12px",
        fontWeight: 600,
        color: isActive ? "var(--navy-800)" : "var(--gray-500)",
        letterSpacing: "0.6px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
        cursor: "pointer",
        userSelect: "none",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        ...style,
      }}
      onClick={() => onSort(sortKey)}
    >
      {label}
      <span style={{ display: "inline-flex", alignItems: "center", opacity: isActive ? 1 : 0.4 }}>
        {isActive ? (
          currentDirection === "asc" ? (
            <ChevronUp size={14} strokeWidth={2.5} />
          ) : (
            <ChevronDown size={14} strokeWidth={2.5} />
          )
        ) : (
          <ChevronsUpDown size={14} strokeWidth={2} />
        )}
      </span>
    </th>
  );
}
