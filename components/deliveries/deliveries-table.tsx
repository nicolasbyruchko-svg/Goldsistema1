"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Building2, Clock, CheckCircle2, XCircle, Trash2 } from "lucide-react";
import { formatDateTime, formatDeliveryStatus } from "@/lib/utils";
import { deleteDelivery } from "@/actions/delivery-actions";

type SortDirection = "asc" | "desc";

interface SortConfig {
  key: string;
  direction: SortDirection;
}

interface Delivery {
  id: string;
  status: string;
  deliveredAt: Date;
  createdBy: { id: string; name: string; username: string } | null;
  worker: { name: string; matricula: string };
  project: { name: string } | null;
  items: { id: string; quantity: number; product: { name: string; condition: string } }[];
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    PENDING_SIGNATURE: { bg: "#fef9c3", color: "#92400e", icon: <Clock size={12} strokeWidth={2.5} /> },
    SIGNED: { bg: "#dcfce7", color: "#15803d", icon: <CheckCircle2 size={12} strokeWidth={2.5} /> },
    CANCELLED: { bg: "#fee2e2", color: "#dc2626", icon: <XCircle size={12} strokeWidth={2.5} /> },
  };
  const style = config[status] ?? { bg: "#f3f4f6", color: "#6b7280", icon: null };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, backgroundColor: style.bg, color: style.color }}>
      {style.icon}
      {formatDeliveryStatus(status)}
    </span>
  );
}

export function DeliveriesTable({ deliveries }: { deliveries: Delivery[] }) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "deliveredAt", direction: "desc" });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleDelete = useCallback(async (delivery: Delivery) => {
    const workerName = delivery.worker.name;
    const itemCount = delivery.items.length;
    const confirmed = window.confirm(
      `Excluir entrega para "${workerName}"?\n\nIsso irá:\n• Devolver ${itemCount} item(ns) ao estoque\n• Remover do Histórico de Entregas\n• Remover da Ficha de EPI e do Termo de Entrega`
    );
    if (!confirmed) return;

    setDeletingId(delivery.id);
    try {
      const result = await deleteDelivery(delivery.id);
      if (!result.success) {
        alert(result.error);
      }
    } finally {
      setDeletingId(null);
    }
  }, []);

  const sortedDeliveries = useMemo(() => {
    return [...deliveries].sort((a, b) => {
      let aVal: unknown, bVal: unknown;

      if (sortConfig.key === "worker") {
        aVal = a.worker.name;
        bVal = b.worker.name;
      } else if (sortConfig.key === "project") {
        aVal = a.project?.name ?? "";
        bVal = b.project?.name ?? "";
      } else {
        aVal = a[sortConfig.key as keyof Delivery];
        bVal = b[sortConfig.key as keyof Delivery];
      }

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      if (sortConfig.key === "deliveredAt") {
        comparison = new Date(aVal as string).getTime() - new Date(bVal as string).getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal), "pt-BR", { sensitivity: "base" });
      }

      return sortConfig.direction === "asc" ? comparison : -comparison;
    });
  }, [deliveries, sortConfig]);

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
            <th style={thStyle("worker")} onClick={() => handleSort("worker")}>Trabalhador{renderSortIcon("worker")}</th>
            <th style={thStyle("project")} onClick={() => handleSort("project")}>Contrato / CC{renderSortIcon("project")}</th>
            <th style={thStyle("deliveredAt")} onClick={() => handleSort("deliveredAt")}>Data{renderSortIcon("deliveredAt")}</th>
            <th style={{ ...thStyle("createdBy"), cursor: "default" }}>Usuário</th>
            <th style={{ ...thStyle("items"), cursor: "default" }}>Itens</th>
            <th style={thStyle("status")} onClick={() => handleSort("status")}>Status{renderSortIcon("status")}</th>
            <th style={{ ...thStyle("actions"), cursor: "default" }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {sortedDeliveries.map((delivery, idx) => (
            <tr key={delivery.id} style={{ borderBottom: idx < sortedDeliveries.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
              <td style={{ padding: "14px 24px" }}>
                <span style={{ display: "block", fontWeight: 600, color: "var(--gray-900)" }}>{delivery.worker.name}</span>
                <span style={{ display: "block", fontSize: "12px", color: "var(--gray-400)", fontFamily: "monospace" }}>
                  Mat. {delivery.worker.matricula}
                </span>
              </td>
              <td style={{ padding: "14px 24px" }}>
                {delivery.project ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 500, backgroundColor: "rgba(25,55,109,0.08)", color: "var(--navy-800)", border: "1px solid rgba(25,55,109,0.15)" }}>
                    <Building2 size={11} strokeWidth={2.5} />
                    {delivery.project.name}
                  </span>
                ) : (
                  <span style={{ fontSize: "13px", color: "var(--gray-400)", fontStyle: "italic" }}>Sem contrato</span>
                )}
              </td>
              <td style={{ padding: "14px 24px", color: "var(--gray-600)", fontSize: "13px", whiteSpace: "nowrap" }}>
                {formatDateTime(delivery.deliveredAt)}
              </td>
              <td style={{ padding: "14px 24px", color: "var(--gray-600)", fontSize: "13px", whiteSpace: "nowrap" }}>
                {delivery.createdBy?.name ?? <span style={{ color: "var(--gray-300)" }}>—</span>}
              </td>
              <td style={{ padding: "14px 24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {delivery.items.slice(0, 2).map((item) => (
                    <span key={item.id} style={{ fontSize: "12px", color: "var(--gray-600)", display: "inline-flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
                      {item.quantity}× {item.product.name}
                      <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "999px", backgroundColor: item.product.condition === "NOVO" ? "#d1fae5" : "#e0e7ff", color: item.product.condition === "NOVO" ? "#059669" : "#4338ca" }}>
                        {item.product.condition === "NOVO" ? "Novo" : "Hig."}
                      </span>
                    </span>
                  ))}
                  {delivery.items.length > 2 && (
                    <span style={{ fontSize: "11px", color: "var(--gray-400)" }}>
                      +{delivery.items.length - 2} item(s)
                    </span>
                  )}
                </div>
              </td>
              <td style={{ padding: "14px 24px" }}>
                <StatusBadge status={delivery.status} />
              </td>
              <td style={{ padding: "14px 24px" }}>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <a
                    href={`/api/deliveries/${delivery.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", padding: "6px 14px", fontSize: "12px", fontWeight: 700, borderRadius: "6px", border: "none", backgroundColor: "var(--yellow-primary)", color: "var(--navy-900)", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Ver Ficha
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(delivery)}
                    disabled={deletingId === delivery.id}
                    style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "6px 12px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#dc2626", cursor: deletingId === delivery.id ? "not-allowed" : "pointer", opacity: deletingId === delivery.id ? 0.5 : 1, fontFamily: "inherit" }}
                  >
                    <Trash2 size={12} />
                    {deletingId === delivery.id ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
