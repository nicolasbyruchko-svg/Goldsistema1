import type { Metadata } from "next";
import { getDevolutions } from "@/actions/devolution-actions";
import { getWorkers } from "@/actions/worker-actions";
import { getProducts } from "@/actions/product-actions";
import { NewDevolutionButton } from "@/components/devolutions/new-devolution-button";
import { Undo2, Building2, PackageCheck, PackageX } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Devoluções",
  description: "Devolução de EPIs e uniformes por desligamento ou troca.",
};

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
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 600,
        backgroundColor: style.bg,
        color: style.color,
        whiteSpace: "nowrap",
      }}
    >
      {style.label}
    </span>
  );
}

export default async function DevolutionsPage() {
  const [devolutions, workers, products] = await Promise.all([
    getDevolutions(),
    getWorkers(),
    getProducts(),
  ]);

  const returnedToStock = devolutions.reduce(
    (sum, d) =>
      sum +
      d.items
        .filter((i) => i.condition === "GOOD")
        .reduce((s, i) => s + i.quantity, 0),
    0
  );

  const discarded = devolutions.reduce(
    (sum, d) =>
      sum +
      d.items
        .filter((i) => i.condition !== "GOOD")
        .reduce((s, i) => s + i.quantity, 0),
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
          { label: "Total de Devoluções", value: devolutions.length, color: "#0d9488", bg: "#ccfbf1" },
          { label: "Itens reincorporados ao estoque", value: returnedToStock, color: "#15803d", bg: "#dcfce7", icon: PackageCheck },
          { label: "Itens descartados (rasgados/não utilizáveis)", value: discarded, color: "#dc2626", bg: "#fee2e2", icon: PackageX },
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
              Clique em “+ Nova Devolução” para registrar devoluções por desligamento ou troca.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
                  {["Colaborador", "Contrato / CC", "Data", "Motivo", "Itens", "Retorno ao estoque", "Descartados"].map((col) => (
                    <th key={col} style={{ padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--gray-500)", letterSpacing: "0.6px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {devolutions.map((devolution, idx) => {
                  const goodQty = devolution.items
                    .filter((i) => i.condition === "GOOD")
                    .reduce((s, i) => s + i.quantity, 0);
                  const badQty = devolution.items
                    .filter((i) => i.condition !== "GOOD")
                    .reduce((s, i) => s + i.quantity, 0);
                  return (
                    <tr key={devolution.id} style={{ borderBottom: idx < devolutions.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
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
        )}
      </div>
    </div>
  );
}
