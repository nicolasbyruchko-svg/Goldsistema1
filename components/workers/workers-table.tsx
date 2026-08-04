"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, UserCheck, UserX, Building2, CalendarDays } from "lucide-react";
import { EditWorkerButton } from "@/components/workers/edit-worker-button";
import { formatCPF } from "@/lib/utils";
import Link from "next/link";
import type { Worker, Project } from "@prisma/client";

type SortDirection = "asc" | "desc";

interface SortConfig {
  key: string;
  direction: SortDirection;
}

type WorkerWithProject = Worker & { project: Project | null };

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, backgroundColor: active ? "#dcfce7" : "#fee2e2", color: active ? "#15803d" : "#dc2626" }}>
      {active ? <UserCheck size={12} strokeWidth={2.5} /> : <UserX size={12} strokeWidth={2.5} />}
      {active ? "Ativo" : "Inativo"}
    </span>
  );
}

function ProjectBadge({ name }: { name: string | null }) {
  if (!name) return <span style={{ fontSize: "13px", color: "var(--gray-400)", fontStyle: "italic" }}>Sem contrato</span>;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, backgroundColor: "rgba(25, 55, 109, 0.08)", color: "var(--navy-800)", border: "1px solid rgba(25, 55, 109, 0.15)" }}>
      <Building2 size={11} strokeWidth={2.5} />
      {name}
    </span>
  );
}

export function WorkersTable({ workers, projects }: { workers: WorkerWithProject[]; projects: Project[] }) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "name", direction: "asc" });

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const sortedWorkers = useMemo(() => {
    return [...workers].sort((a, b) => {
      let aVal: unknown, bVal: unknown;

      if (sortConfig.key === "project") {
        aVal = a.project?.name ?? "";
        bVal = b.project?.name ?? "";
      } else {
        aVal = a[sortConfig.key as keyof Worker];
        bVal = b[sortConfig.key as keyof Worker];
      }

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (sortConfig.key === "admissionDate") {
        const aDate = aVal ? new Date(aVal as string).getTime() : 0;
        const bDate = bVal ? new Date(bVal as string).getTime() : 0;
        comparison = aDate - bDate;
      } else if (sortConfig.key === "active") {
        comparison = (aVal === bVal) ? 0 : aVal ? -1 : 1;
      } else {
        comparison = String(aVal).localeCompare(String(bVal), "pt-BR", { sensitivity: "base" });
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [workers, sortConfig]);

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
            <th style={thStyle("matricula")} onClick={() => handleSort("matricula")}>Matrícula{renderSortIcon("matricula")}</th>
            <th style={thStyle("name")} onClick={() => handleSort("name")}>Nome / CPF{renderSortIcon("name")}</th>
            <th style={thStyle("role")} onClick={() => handleSort("role")}>Função{renderSortIcon("role")}</th>
            <th style={thStyle("admissionDate")} onClick={() => handleSort("admissionDate")}>Admissão{renderSortIcon("admissionDate")}</th>
            <th style={thStyle("project")} onClick={() => handleSort("project")}>Contrato Atual{renderSortIcon("project")}</th>
            <th style={thStyle("active")} onClick={() => handleSort("active")}>Status{renderSortIcon("active")}</th>
            <th style={{ ...thStyle("actions"), cursor: "default" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {sortedWorkers.map((worker, idx) => (
            <tr key={worker.id} style={{ borderBottom: idx < sortedWorkers.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
              <td style={{ padding: "14px 24px", whiteSpace: "nowrap" }}>
                <span style={{ fontFamily: "monospace", fontSize: "13px", fontWeight: 600, color: "var(--navy-800)", backgroundColor: "rgba(25,55,109,0.06)", padding: "3px 8px", borderRadius: "5px" }}>
                  {worker.matricula}
                </span>
              </td>
              <td style={{ padding: "14px 24px" }}>
                <span style={{ display: "block", fontWeight: 600, color: "var(--gray-900)" }}>{worker.name}</span>
                <span style={{ display: "block", fontSize: "12px", color: "var(--gray-400)", marginTop: "1px" }}>
                  {formatCPF(worker.cpf)}
                </span>
              </td>
              <td style={{ padding: "14px 24px", color: "var(--gray-600)" }}>{worker.role}</td>
              <td style={{ padding: "14px 24px", whiteSpace: "nowrap" }}>
                {worker.admissionDate ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "var(--gray-600)" }}>
                    <CalendarDays size={13} strokeWidth={2} style={{ color: "var(--gray-400)" }} />
                    {new Date(worker.admissionDate).toLocaleDateString("pt-BR")}
                  </span>
                ) : (
                  <span style={{ fontSize: "13px", color: "var(--gray-400)", fontStyle: "italic" }}>—</span>
                )}
              </td>
              <td style={{ padding: "14px 24px" }}>
                <ProjectBadge name={worker.project?.name ?? null} />
              </td>
              <td style={{ padding: "14px 24px" }}>
                <StatusBadge active={worker.active} />
              </td>
              <td style={{ padding: "14px 24px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <EditWorkerButton worker={worker} projects={projects} />
                  <Link
                    href={`/api/workers/${worker.id}/ficha-pdf`}
                    target="_blank"
                    style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 700, borderRadius: "6px", border: "none", backgroundColor: "var(--yellow-primary)", color: "var(--navy-900)", cursor: "pointer", textDecoration: "none", fontFamily: "inherit", display: "inline-flex", alignItems: "center" }}
                  >
                    Ficha EPI
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
