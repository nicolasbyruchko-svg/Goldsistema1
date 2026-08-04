"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Users, CheckCircle2, XCircle } from "lucide-react";
import { EditProjectButton } from "@/components/projects/edit-project-button";

type SortDirection = "asc" | "desc";

interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface Project {
  id: string;
  name: string;
  costCenterCode: string | null;
  description: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { workers: number; deliveries: number };
  [key: string]: unknown;
}

export function ProjectsTable({ projects }: { projects: Project[] }) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" });

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) => {
      let aVal: unknown, bVal: unknown;

      if (sortConfig.key === "workers") {
        aVal = a._count.workers;
        bVal = b._count.workers;
      } else if (sortConfig.key === "deliveries") {
        aVal = a._count.deliveries;
        bVal = b._count.deliveries;
      } else {
        aVal = a[sortConfig.key as keyof Project];
        bVal = b[sortConfig.key as keyof Project];
      }

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (sortConfig.key === "workers" || sortConfig.key === "deliveries") {
        comparison = Number(aVal) - Number(bVal);
      } else if (sortConfig.key === "active") {
        comparison = (aVal === bVal) ? 0 : aVal ? -1 : 1;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), "pt-BR", { sensitivity: "base" });
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [projects, sortConfig]);

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
            <th style={thStyle("name")} onClick={() => handleSort("name")}>Nome do Contrato{renderSortIcon("name")}</th>
            <th style={thStyle("costCenterCode")} onClick={() => handleSort("costCenterCode")}>C.Custo{renderSortIcon("costCenterCode")}</th>
            <th style={thStyle("description")} onClick={() => handleSort("description")}>Descrição{renderSortIcon("description")}</th>
            <th style={thStyle("workers")} onClick={() => handleSort("workers")}>Trabalhadores{renderSortIcon("workers")}</th>
            <th style={thStyle("deliveries")} onClick={() => handleSort("deliveries")}>Entregas{renderSortIcon("deliveries")}</th>
            <th style={thStyle("active")} onClick={() => handleSort("active")}>Status{renderSortIcon("active")}</th>
            <th style={{ ...thStyle("actions"), cursor: "default" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {sortedProjects.map((project, idx) => (
            <tr key={project.id} style={{ borderBottom: idx < sortedProjects.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
              <td style={{ padding: "14px 24px" }}>
                <span style={{ fontWeight: 600, color: "var(--gray-900)" }}>{project.name}</span>
              </td>
              <td style={{ padding: "14px 24px" }}>
                {project.costCenterCode ? (
                  <span style={{ fontFamily: "monospace", fontSize: "12px", backgroundColor: "var(--gray-100)", padding: "2px 7px", borderRadius: "5px", color: "var(--navy-800)" }}>
                    {project.costCenterCode}
                  </span>
                ) : (
                  <span style={{ color: "var(--gray-300)", fontSize: "13px" }}>—</span>
                )}
              </td>
              <td style={{ padding: "14px 24px", color: "var(--gray-500)", maxWidth: "260px" }}>
                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {project.description || <em style={{ color: "var(--gray-300)" }}>—</em>}
                </span>
              </td>
              <td style={{ padding: "14px 24px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--navy-800)" }}>
                  <Users size={14} />
                  {project._count.workers}
                </span>
              </td>
              <td style={{ padding: "14px 24px", color: "var(--gray-600)", fontSize: "13px" }}>
                {project._count.deliveries}
              </td>
              <td style={{ padding: "14px 24px" }}>
                {project.active ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, backgroundColor: "#dcfce7", color: "#15803d" }}>
                    <CheckCircle2 size={12} /> Ativo
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, backgroundColor: "#fee2e2", color: "#dc2626" }}>
                    <XCircle size={12} /> Inativo
                  </span>
                )}
              </td>
              <td style={{ padding: "14px 24px" }}>
                <EditProjectButton project={project} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
