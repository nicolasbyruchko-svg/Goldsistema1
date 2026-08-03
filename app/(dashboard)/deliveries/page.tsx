import type { Metadata } from "next";
import { getDeliveries } from "@/actions/delivery-actions";
import { getWorkers } from "@/actions/worker-actions";
import { getProducts } from "@/actions/product-actions";
import { getProjects } from "@/actions/project-actions";
import { NewDeliveryButton } from "@/components/deliveries/new-delivery-button";
import { DeliveriesFilter } from "@/components/deliveries/deliveries-filter";
import { ClipboardList, Building2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { formatDateTime, formatDeliveryStatus } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Entregas",
  description: "Histórico de entregas de EPIs e uniformes (Ficha de EPI).",
};

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
    PENDING_SIGNATURE: {
      bg: "#fef9c3",
      color: "#92400e",
      icon: <Clock size={12} strokeWidth={2.5} />,
    },
    SIGNED: {
      bg: "#dcfce7",
      color: "#15803d",
      icon: <CheckCircle2 size={12} strokeWidth={2.5} />,
    },
    CANCELLED: {
      bg: "#fee2e2",
      color: "#dc2626",
      icon: <XCircle size={12} strokeWidth={2.5} />,
    },
  };

  const style = config[status] ?? { bg: "#f3f4f6", color: "#6b7280", icon: null };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        padding: "3px 10px",
        borderRadius: "999px",
        fontSize: "12px",
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
      }}
    >
      {style.icon}
      {formatDeliveryStatus(status)}
    </span>
  );
}

export default async function DeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { projectId } = await searchParams;
  const selectedProjectId = typeof projectId === "string" ? projectId : undefined;

  const [deliveries, workers, products, projects] = await Promise.all([
    getDeliveries(selectedProjectId),
    getWorkers(),
    getProducts(),
    getProjects(),
  ]);

  const pending = deliveries.filter((d) => d.status === "PENDING_SIGNATURE").length;
  const signed = deliveries.filter((d) => d.status === "SIGNED").length;

  return (
    <div style={{ padding: "32px 40px", flex: 1 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ width: "40px", height: "40px", backgroundColor: "#d1fae5", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ClipboardList size={20} style={{ color: "#059669" }} strokeWidth={2} />
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--navy-900)", letterSpacing: "-0.5px", margin: 0 }}>
              Entregas
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "var(--gray-500)", margin: 0 }}>
            Ficha de EPI — rastreabilidade de entrega por trabalhador e contrato.
          </p>
        </div>
        <NewDeliveryButton workers={workers} products={products} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total de Entregas", value: deliveries.length, color: "#059669", bg: "#d1fae5" },
          { label: "Aguardando Assinatura", value: pending, color: "#92400e", bg: "#fef9c3" },
          { label: "Assinadas", value: signed, color: "#15803d", bg: "#dcfce7" },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)" }}>
            <span style={{ display: "block", fontSize: "13px", color: "var(--gray-500)", fontWeight: 500 }}>{s.label}</span>
            <span style={{ display: "block", fontSize: "32px", fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: "#fff", borderRadius: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--gray-200)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--gray-800)" }}>Histórico de Entregas</span>
            <span style={{ fontSize: "12px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", backgroundColor: "#d1fae5", color: "#059669" }}>{deliveries.length}</span>
          </div>
          <DeliveriesFilter projects={projects} currentProjectId={selectedProjectId} />
        </div>

        {deliveries.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center", color: "var(--gray-400)" }}>
            <ClipboardList size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: "15px", fontWeight: 500, margin: 0 }}>
              {selectedProjectId ? "Nenhuma entrega encontrada para este contrato" : "Nenhuma entrega registrada"}
            </p>
            <p style={{ fontSize: "13px", marginTop: "4px" }}>
              {selectedProjectId ? "Selecione outro contrato no filtro acima ou limpe o filtro." : 'Clique em "+ Nova Entrega" para registrar a primeira entrega.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
                  {["Trabalhador", "Contrato / CC", "Data", "Itens", "Status", "Ações"].map((col) => (
                    <th key={col} style={{ padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--gray-500)", letterSpacing: "0.6px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deliveries.map((delivery, idx) => (
                  <tr key={delivery.id} style={{ borderBottom: idx < deliveries.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
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
                    <td style={{ padding: "14px 24px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {delivery.items.slice(0, 2).map((item) => (
                          <span key={item.id} style={{ fontSize: "12px", color: "var(--gray-600)" }}>
                            {item.quantity}× {item.product.name}
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
                      <a
                        href={`/api/deliveries/${delivery.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          textDecoration: "none",
                          padding: "6px 14px",
                          fontSize: "12px",
                          fontWeight: 700,
                          borderRadius: "6px",
                          border: "none",
                          backgroundColor: "var(--yellow-primary)",
                          color: "var(--navy-900)",
                          cursor: "pointer",
                          fontFamily: "inherit",
                          transition: "opacity 0.15s ease",
                        }}
                      >
                        Ver Ficha
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
