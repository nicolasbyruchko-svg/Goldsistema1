import type { Metadata } from "next";
import { getProducts } from "@/actions/product-actions";
import { NewProductButton } from "@/components/stock/new-product-button";
import { StockTable } from "@/components/stock/stock-table";
import { Package, AlertTriangle } from "lucide-react";

export const metadata: Metadata = {
  title: "Estoque",
  description: "Controle de estoque de EPIs e uniformes.",
};

export default async function StockPage() {
  const products = await getProducts();

  const epis = products.filter((p) => p.type === "EPI");
  const uniforms = products.filter((p) => p.type === "UNIFORM");
  const lowStock = products.filter((p) => p.stockQuantity <= p.minStock);
  const newItems = products.filter((p) => p.condition === "NOVO");
  const sanitizedItems = products.filter((p) => p.condition === "HIGIENIZADO");

  return (
    <div style={{ padding: "32px 40px", flex: 1 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ width: "40px", height: "40px", backgroundColor: "#ede9fe", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Package size={20} style={{ color: "#7c3aed" }} strokeWidth={2} />
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--navy-900)", letterSpacing: "-0.5px", margin: 0 }}>
              Estoque
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "var(--gray-500)", margin: 0 }}>
            Controle de EPIs e uniformes disponíveis para entrega.
          </p>
        </div>
        <NewProductButton />
      </div>

      {/* Alerta de estoque crítico */}
      {lowStock.length > 0 && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            padding: "14px 18px",
            backgroundColor: "#fef9c3",
            border: "1px solid #fde68a",
            borderRadius: "10px",
            marginBottom: "24px",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <AlertTriangle size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: "1px" }} strokeWidth={2.5} />
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#92400e", margin: 0 }}>
              {lowStock.length} item{lowStock.length > 1 ? "s" : ""} com estoque crítico
            </p>
            <p style={{ fontSize: "13px", color: "#b45309", margin: "2px 0 0" }}>
              {lowStock.map((p) => p.name).join(", ")}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total de Itens", value: products.length, color: "#7c3aed", bg: "#ede9fe" },
          { label: "EPIs", value: epis.length, color: "var(--navy-800)", bg: "rgba(25,55,109,0.07)" },
          { label: "Uniformes", value: uniforms.length, color: "#0284c7", bg: "#e0f2fe" },
          { label: "Novos", value: newItems.length, color: "#059669", bg: "#d1fae5" },
          { label: "Higienizados", value: sanitizedItems.length, color: "#0284c7", bg: "#e0f2fe" },
          { label: "Estoque Crítico", value: lowStock.length, color: "#dc2626", bg: "#fee2e2" },
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
          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--gray-800)" }}>Catálogo de Produtos</span>
          <span style={{ fontSize: "12px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", backgroundColor: "#ede9fe", color: "#7c3aed" }}>{products.length}</span>
        </div>

        {products.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center", color: "var(--gray-400)" }}>
            <Package size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: "15px", fontWeight: 500, margin: 0 }}>Nenhum produto cadastrado</p>
            <p style={{ fontSize: "13px", marginTop: "4px" }}>Clique em &quot;+ Novo Produto&quot; para começar.</p>
          </div>
        ) : (
          <StockTable products={products} />
        )}
      </div>
    </div>
  );
}
