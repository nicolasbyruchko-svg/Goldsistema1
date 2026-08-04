import type { Metadata } from "next";
import { getPurchases } from "@/actions/purchase-actions";
import { getProducts } from "@/actions/product-actions";
import { NewPurchaseButton } from "@/components/purchases/new-purchase-button";
import { PurchasesTable } from "@/components/purchases/purchases-table";
import { ReceiptText } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Compras",
  description: "Notas fiscais de entrada de EPIs e uniformes.",
};

export default async function PurchasesPage() {
  const [purchases, products] = await Promise.all([getPurchases(), getProducts()]);

  const totalSpent = purchases.reduce(
    (sum, p) => sum + Number(p.totalValue),
    0
  );
  const totalInvoices = purchases.length;
  const totalItems = purchases.reduce(
    (sum, p) => sum + p.items.reduce((s, i) => s + i.quantity, 0),
    0
  );

  return (
    <div style={{ padding: "32px 40px", flex: 1 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ width: "40px", height: "40px", backgroundColor: "#e0f2fe", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ReceiptText size={20} style={{ color: "#0284c7" }} strokeWidth={2} />
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--navy-900)", letterSpacing: "-0.5px", margin: 0 }}>
              Compras
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "var(--gray-500)", margin: 0 }}>
            Notas fiscais de entrada — rastreio de fornecedor, lote e custo por produto.
          </p>
        </div>
        <NewPurchaseButton products={products} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Notas Fiscais", value: totalInvoices, color: "#0284c7", bg: "#e0f2fe" },
          { label: "Itens Recebidos", value: totalItems, color: "var(--navy-800)", bg: "rgba(25,55,109,0.07)" },
          { label: "Total Investido", value: formatCurrency(totalSpent), color: "#059669", bg: "#d1fae5" },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)" }}>
            <span style={{ display: "block", fontSize: "13px", color: "var(--gray-500)", fontWeight: 500 }}>{s.label}</span>
            <span style={{ display: "block", fontSize: "30px", fontWeight: 800, color: s.color, lineHeight: 1.1, marginTop: "2px" }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: "#fff", borderRadius: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--gray-200)", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--gray-800)" }}>Histórico de Notas Fiscais</span>
          <span style={{ fontSize: "12px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", backgroundColor: "#e0f2fe", color: "#0284c7" }}>{purchases.length}</span>
        </div>

        {purchases.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center", color: "var(--gray-400)" }}>
            <ReceiptText size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: "15px", fontWeight: 500, margin: 0 }}>Nenhuma nota fiscal registrada</p>
            <p style={{ fontSize: "13px", marginTop: "4px" }}>Clique em &quot;+ Nova Nota Fiscal&quot; para registrar a primeira entrada.</p>
          </div>
        ) : (
          <PurchasesTable purchases={purchases} />
        )}
      </div>
    </div>
  );
}
