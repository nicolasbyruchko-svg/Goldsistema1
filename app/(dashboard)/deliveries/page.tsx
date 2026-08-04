import type { Metadata } from "next";
import { getDeliveries } from "@/actions/delivery-actions";
import { getWorkers } from "@/actions/worker-actions";
import { getProducts } from "@/actions/product-actions";
import { getProjects } from "@/actions/project-actions";
import { NewDeliveryButton } from "@/components/deliveries/new-delivery-button";
import { DeliveriesFilter } from "@/components/deliveries/deliveries-filter";
import { DeliveriesTable } from "@/components/deliveries/deliveries-table";
import { ClipboardList } from "lucide-react";

export const metadata: Metadata = {
  title: "Entregas",
  description: "Histórico de entregas de EPIs e uniformes (Ficha de EPI).",
};

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
          <DeliveriesTable deliveries={deliveries} />
        )}
      </div>
    </div>
  );
}
