import type { Metadata } from "next";
import { getDevolutions } from "@/actions/devolution-actions";
import { getWorkers } from "@/actions/worker-actions";
import { getProducts } from "@/actions/product-actions";
import { NewDevolutionButton } from "@/components/devolutions/new-devolution-button";
import { DevolutionsTable } from "@/components/devolutions/devolutions-table";
import { Undo2, PackageCheck, PackageX, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Devoluções",
  description: "Devolução de EPIs e uniformes por desligamento ou troca.",
};

export default async function DevolutionsPage() {
  const [devolutions, workers, products] = await Promise.all([
    getDevolutions(),
    getWorkers(),
    getProducts(),
  ]);

  const pendingCount = devolutions.filter((d) => d.status === "PENDING").length;
  const approvedCount = devolutions.filter((d) => d.status === "APPROVED").length;

  const approvedQty = devolutions
    .filter((d) => d.status === "APPROVED")
    .reduce(
      (sum, d) =>
        sum +
        d.items.reduce((s, i) => s + (i.approvedQty ?? 0), 0),
      0
    );

  const reprovedQty = devolutions
    .filter((d) => d.status === "APPROVED")
    .reduce(
      (sum, d) =>
        sum +
        d.items.reduce((s, i) => s + (i.quantity - (i.approvedQty ?? 0)), 0),
      0
    );

  return (
    <div style={{ padding: "32px 40px", flex: 1 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ width: "40px", height: "40px", backgroundColor: "#ccfbf1", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Undo2 size={20} style={{ color: "#0d9488" }} strokeWidth={2} />
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--navy-900)", letterSpacing: "-0.5px", margin: 0 }}>
              Devoluções
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "var(--gray-500)", margin: 0 }}>
            Devolução de EPIs/uniformes por desligamento de colaborador ou troca.
          </p>
        </div>
        <NewDevolutionButton workers={workers} products={products} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Pendentes de Higienização", value: pendingCount, color: "#92400e", bg: "#fef9c3", icon: Clock },
          { label: "Validadas (Ok)", value: approvedCount, color: "#0d9488", bg: "#ccfbf1" },
          { label: "Peças aprovadas", value: approvedQty, color: "#15803d", bg: "#dcfce7", icon: PackageCheck },
          { label: "Peças reprovadas", value: reprovedQty, color: "#dc2626", bg: "#fee2e2", icon: PackageX },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)" }}>
            <span style={{ display: "block", fontSize: "13px", color: "var(--gray-500)", fontWeight: 500 }}>{s.label}</span>
            <span style={{ display: "block", fontSize: "32px", fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: "#fff", borderRadius: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--gray-200)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--gray-800)" }}>Histórico de Devoluções</span>
          <span style={{ fontSize: "12px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", backgroundColor: "#ccfbf1", color: "#0d9488" }}>{devolutions.length}</span>
        </div>

        {devolutions.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center", color: "var(--gray-400)" }}>
            <Undo2 size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: "15px", fontWeight: 500, margin: 0 }}>Nenhuma devolução registrada</p>
            <p style={{ fontSize: "13px", marginTop: "4px" }}>
              Clique em "+ Nova Devolução" para registrar devoluções por desligamento ou troca.
            </p>
          </div>
        ) : (
          <DevolutionsTable devolutions={devolutions} />
        )}
      </div>
    </div>
  );
}
