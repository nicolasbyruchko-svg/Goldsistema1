import type { Metadata } from "next";
import { getWorkers } from "@/actions/worker-actions";
import { getActiveProjects } from "@/actions/project-actions";
import { NewWorkerButton } from "@/components/workers/new-worker-button";
import { WorkersTable } from "@/components/workers/workers-table";
import { Users, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Trabalhadores",
  description: "Gerencie os trabalhadores e suas alocações em contratos.",
};

export default async function WorkersPage() {
  const [workers, projects] = await Promise.all([
    getWorkers(),
    getActiveProjects(),
  ]);

  const totalActive = workers.filter((w) => w.active).length;
  const totalInactive = workers.filter((w) => !w.active).length;

  return (
    <div style={{ padding: "32px 40px", flex: 1 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ width: "40px", height: "40px", backgroundColor: "rgba(11, 36, 71, 0.08)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={20} style={{ color: "var(--navy-800)" }} strokeWidth={2} />
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--navy-900)", letterSpacing: "-0.5px", margin: 0 }}>
              Trabalhadores
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "var(--gray-500)", margin: 0 }}>
            Gerencie os trabalhadores e suas alocações em contratos.
          </p>
        </div>
        <NewWorkerButton projects={projects} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total", value: workers.length, color: "var(--navy-800)", bg: "rgba(25,55,109,0.07)" },
          { label: "Ativos", value: totalActive, color: "#15803d", bg: "#dcfce7" },
          { label: "Inativos", value: totalInactive, color: "#dc2626", bg: "#fee2e2" },
        ].map((s) => (
          <div key={s.label} style={{ backgroundColor: "#fff", borderRadius: "12px", padding: "20px 24px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)" }}>
            <span style={{ display: "block", fontSize: "13px", color: "var(--gray-500)", fontWeight: 500 }}>{s.label}</span>
            <span style={{ display: "block", fontSize: "32px", fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: "#fff", borderRadius: "14px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid var(--gray-200)", overflow: "hidden" }}>
        <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--gray-200)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--gray-800)" }}>Lista de Trabalhadores</span>
            <span style={{ fontSize: "12px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", backgroundColor: "rgba(11,36,71,0.08)", color: "var(--navy-800)" }}>{workers.length}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--gray-200)", backgroundColor: "var(--gray-50)", minWidth: "220px" }}>
            <Search size={15} style={{ color: "var(--gray-400)" }} />
            <span style={{ fontSize: "13px", color: "var(--gray-400)" }}>Buscar trabalhador...</span>
          </div>
        </div>

        {workers.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center", color: "var(--gray-400)" }}>
            <Users size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: "15px", fontWeight: 500, margin: 0 }}>Nenhum trabalhador cadastrado</p>
            <p style={{ fontSize: "13px", marginTop: "4px" }}>Clique em &quot;+ Novo Trabalhador&quot; para começar.</p>
          </div>
        ) : (
          <WorkersTable workers={workers} projects={projects} />
        )}
      </div>
    </div>
  );
}
