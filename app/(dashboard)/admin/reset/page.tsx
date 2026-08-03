import type { Metadata } from "next";
import { ResetDataPanel } from "@/components/admin/reset-data-panel";
import { DatabaseZap } from "lucide-react";

export const metadata: Metadata = {
  title: "Zerar dados",
  description: "Área restrita para zerar movimentações do sistema.",
};

export default function AdminResetPage() {
  return (
    <div style={{ padding: "32px 40px", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
        <div
          style={{
            width: "40px",
            height: "40px",
            backgroundColor: "#fee2e2",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DatabaseZap size={20} style={{ color: "#dc2626" }} strokeWidth={2} />
        </div>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: 700,
            color: "var(--navy-900)",
            letterSpacing: "-0.5px",
            margin: 0,
          }}
        >
          Zerar dados
        </h1>
      </div>
      <p style={{ fontSize: "14px", color: "var(--gray-500)", margin: "0 0 24px" }}>
        Exclusão permanente de movimentações registradas no banco de dados.
      </p>

      <ResetDataPanel />
    </div>
  );
}
