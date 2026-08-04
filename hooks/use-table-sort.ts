"use client";

import { useState, useMemo, useCallback } from "react";

export type SortDirection = "asc" | "desc";

export interface SortConfig<T> {
  key: keyof T;
  direction: SortDirection;
}

export function useTableSort<T extends Record<string, unknown>>(
  data: T[],
  defaultSortKey?: keyof T,
  defaultDirection: SortDirection = "asc"
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T> | null>(
    defaultSortKey ? { key: defaultSortKey, direction: defaultDirection } : null
  );

  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        comparison = aVal.localeCompare(bVal, "pt-BR", { sensitivity: "base" });
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        comparison = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal), "pt-BR", { sensitivity: "base" });
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const requestSort = useCallback(
    (key: keyof T) => {
      setSortConfig((prev) => {
        if (prev?.key === key) {
          return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
        }
        return { key, direction: "asc" };
      });
    },
    []
  );

  return { sortedData, sortConfig, requestSort };
}
