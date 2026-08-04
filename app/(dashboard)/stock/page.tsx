import type { Metadata } from "next";
import { getProducts } from "@/actions/product-actions";
import { NewProductButton } from "@/components/stock/new-product-button";
import { EditProductButton } from "@/components/stock/edit-product-button";
import { DeleteProductButton } from "@/components/stock/delete-product-button";
import { Package, AlertTriangle, ShieldCheck, Shirt } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Estoque",
  description: "Controle de estoque de EPIs e uniformes.",
};

export default async function StockPage() {
  const products = await getProducts();

  const epis = products.filter((p) => p.type === "EPI");
  const uniforms = products.filter((p) => p.type === "UNIFORM");
  const lowStock = products.filter((p) => p.stockQuantity <= p.minStock);

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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total de Itens", value: products.length, color: "#7c3aed", bg: "#ede9fe" },
          { label: "EPIs", value: epis.length, color: "var(--navy-800)", bg: "rgba(25,55,109,0.07)" },
          { label: "Uniformes", value: uniforms.length, color: "#0284c7", bg: "#e0f2fe" },
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
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
                  {["Produto", "SKU", "Tipo", "Tamanho", "CA / Validade", "Custo Unit.", "Fornecedor", "Estoque", "Mín.", "Ações"].map((col) => (
                    <th key={col} style={{ padding: "12px 20px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--gray-500)", letterSpacing: "0.6px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((product, idx) => {
                  const isCritical = product.stockQuantity <= product.minStock;
                  return (
                    <tr key={product.id} style={{ borderBottom: idx < products.length - 1 ? "1px solid var(--gray-100)" : "none", backgroundColor: isCritical ? "#fffbeb" : "transparent" }}>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: product.type === "EPI" ? "rgba(25,55,109,0.08)" : "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            {product.type === "EPI"
                              ? <ShieldCheck size={16} style={{ color: "var(--navy-800)" }} />
                              : <Shirt size={16} style={{ color: "#0284c7" }} />
                            }
                          </div>
                          <span style={{ fontWeight: 600, color: "var(--gray-900)" }}>{product.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "12px", backgroundColor: "var(--gray-100)", padding: "2px 7px", borderRadius: "5px", color: "var(--gray-700)" }}>
                          {product.sku}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, backgroundColor: product.type === "EPI" ? "rgba(25,55,109,0.08)" : "#e0f2fe", color: product.type === "EPI" ? "var(--navy-800)" : "#0284c7" }}>
                          {product.type === "EPI" ? "EPI" : "Uniforme"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", color: "var(--gray-500)", fontSize: "13px" }}>
                        {product.size || "—"}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        {product.caNumber ? (
                          <div>
                            <span style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--gray-700)" }}>CA {product.caNumber}</span>
                            <span style={{ display: "block", fontSize: "11px", color: product.caValidity && new Date(product.caValidity) < new Date() ? "#dc2626" : "var(--gray-400)" }}>
                              {formatDate(product.caValidity)}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--gray-300)", fontSize: "13px" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--gray-800)" }}>
                          {product.unitCost != null ? formatCurrency(Number(product.unitCost)) : <span style={{ color: "var(--gray-300)", fontWeight: 400 }}>—</span>}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "12px", color: "var(--gray-600)" }}>
                          {product.supplier || <span style={{ color: "var(--gray-300)" }}>—</span>}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "18px", fontWeight: 800, color: isCritical ? "#dc2626" : "#15803d" }}>
                            {product.stockQuantity}
                          </span>
                          {isCritical && (
                            <AlertTriangle size={14} style={{ color: "#f59e0b" }} strokeWidth={2.5} />
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", color: "var(--gray-400)", fontSize: "13px" }}>
                        {product.minStock}
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <EditProductButton product={product} />
                          <DeleteProductButton product={product} />
                        </div>
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
