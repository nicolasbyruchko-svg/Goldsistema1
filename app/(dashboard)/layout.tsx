import type { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: {
    template: "%s | GoldService",
    default: "GoldService - Gestão de EPIs",
  },
  description: "Sistema de gestão de estoque e entrega de EPIs e uniformes.",
};

// Evita pré-renderização estática no build: as páginas consultam o banco
// em tempo real (Supabase), então devem ser renderizadas sob demanda.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar fixa */}
      <Sidebar user={user} />

      {/* Área de conteúdo principal */}
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
