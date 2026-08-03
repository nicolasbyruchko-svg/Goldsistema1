import type { Metadata } from "next";
import { getProjects } from "@/actions/project-actions";
import { NewProjectButton } from "@/components/projects/new-project-button";
import { EditProjectButton } from "@/components/projects/edit-project-button";
import { FolderKanban, Users, CheckCircle2, XCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Contratos",
  description: "Gerencie os contratos e postos de trabalho.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  const totalActive = projects.filter((p) => p.active).length;
  const totalWorkers = projects.reduce((sum, p) => sum + p._count.workers, 0);

  return (
    <div style={{ padding: "32px 40px", flex: 1 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{ width: "40px", height: "40px", backgroundColor: "#e0f2fe", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FolderKanban size={20} style={{ color: "#0284c7" }} strokeWidth={2} />
            </div>
            <h1 style={{ fontSize: "26px", fontWeight: 700, color: "var(--navy-900)", letterSpacing: "-0.5px", margin: 0 }}>
              Contratos
            </h1>
          </div>
          <p style={{ fontSize: "14px", color: "var(--gray-500)", margin: 0 }}>
            Postos de trabalho e centros de custo para rastreabilidade de entregas.
          </p>
        </div>
        <NewProjectButton />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "28px" }}>
        {[
          { label: "Total de Contratos", value: projects.length, color: "#0284c7", bg: "#e0f2fe" },
          { label: "Ativos", value: totalActive, color: "#15803d", bg: "#dcfce7" },
          { label: "Trabalhadores Alocados", value: totalWorkers, color: "var(--navy-800)", bg: "rgba(25,55,109,0.07)" },
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
          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--gray-800)" }}>Lista de Contratos</span>
          <span style={{ fontSize: "12px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px", backgroundColor: "#e0f2fe", color: "#0284c7" }}>{projects.length}</span>
        </div>

        {projects.length === 0 ? (
          <div style={{ padding: "64px 24px", textAlign: "center", color: "var(--gray-400)" }}>
            <FolderKanban size={48} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p style={{ fontSize: "15px", fontWeight: 500, margin: 0 }}>Nenhum contrato cadastrado</p>
            <p style={{ fontSize: "13px", marginTop: "4px" }}>Clique em &quot;+ Novo Contrato&quot; para começar.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
                  {["Nome do Contrato", "C.Custo", "Descrição", "Trabalhadores", "Entregas", "Status", "Ações"].map((col) => (
                    <th key={col} style={{ padding: "12px 24px", textAlign: "left", fontSize: "12px", fontWeight: 600, color: "var(--gray-500)", letterSpacing: "0.6px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((project, idx) => (
                  <tr key={project.id} style={{ borderBottom: idx < projects.length - 1 ? "1px solid var(--gray-100)" : "none" }}>
                    <td style={{ padding: "14px 24px" }}>
                      <span style={{ fontWeight: 600, color: "var(--gray-900)" }}>{project.name}</span>
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      {project.costCenterCode ? (
                        <span style={{ fontFamily: "monospace", fontSize: "12px", backgroundColor: "var(--gray-100)", padding: "2px 7px", borderRadius: "5px", color: "var(--navy-800)" }}>
                          {project.costCenterCode}
                        </span>
                      ) : (
                        <span style={{ color: "var(--gray-300)", fontSize: "13px" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 24px", color: "var(--gray-500)", maxWidth: "260px" }}>
                      <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {project.description || <em style={{ color: "var(--gray-300)" }}>—</em>}
                      </span>
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--navy-800)" }}>
                        <Users size={14} />
                        {project._count.workers}
                      </span>
                    </td>
                    <td style={{ padding: "14px 24px", color: "var(--gray-600)", fontSize: "13px" }}>
                      {project._count.deliveries}
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      {project.active ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, backgroundColor: "#dcfce7", color: "#15803d" }}>
                          <CheckCircle2 size={12} /> Ativo
                        </span>
                      ) : (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: 600, backgroundColor: "#fee2e2", color: "#dc2626" }}>
                          <XCircle size={12} /> Inativo
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px 24px" }}>
                      <EditProjectButton project={project} />
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
