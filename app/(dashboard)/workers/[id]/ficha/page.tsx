"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { Printer, Download } from "lucide-react";

// Como é um Client Component para lidar com window.print() e conversão de CSV, 
// buscaremos os dados do servidor.
import { getWorkerById } from "@/actions/worker-actions";

export default function FichaEPIPage() {
  const params = useParams();
  const workerId = params.id as string;
  type WorkerData = NonNullable<Awaited<ReturnType<typeof getWorkerById>>>;
  const [data, setData] = useState<WorkerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const result = await getWorkerById(workerId);
      setData(result);
      setLoading(false);
    }
    loadData();
  }, [workerId]);

  if (loading) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Carregando ficha...</div>;
  }

  if (!data) {
    return <div style={{ padding: "40px", textAlign: "center" }}>Trabalhador não encontrado.</div>;
  }

  const worker = data;
  const deliveries = worker.deliveries || [];

  // Função para exportar CSV (que o MS Excel/Word conseguem ler como tabela)
  const exportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data,EPI,C.A.,Quantidade,Assinatura\n";

    deliveries.forEach((delivery) => {
      const dateStr = formatDateTime(delivery.deliveredAt).split(" ")[0]; // apenas data
      delivery.items.forEach((item) => {
        const row = [
          dateStr,
          `"${item.product.name}"`, // aspas para evitar quebras com vírgulas no nome
          item.product.caNumber || "N/A",
          item.quantity,
          "________________________"
        ];
        csvContent += row.join(",") + "\n";
      });
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ficha_EPI_${worker.matricula}_${worker.name.replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para simular o download de um .DOC usando Blob HTML (removida:
  // o botão agora usa o endpoint /api/workers/[id]/ficha-pdf, que gera o
  // PDF real a partir do modelo oficial da empresa).

  return (
    <div style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", padding: "40px" }} className="print-bg-white">
      
      {/* Botões Flutuantes (Escondidos na Impressão via CSS inline style que será injetado globalmente ou aqui) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          .print-bg-white { background-color: #fff !important; padding: 0 !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 15mm; }
        }
      `}} />

      <div className="no-print" style={{ maxWidth: "800px", margin: "0 auto 20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
        <button 
          onClick={exportCSV} // Removido export DOC pois CSV atende 100% de tabelas e PDF atende leitura
          style={{ padding: "8px 16px", backgroundColor: "#fff", border: "1px solid var(--gray-300)", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", color: "var(--gray-700)" }}
        >
          <Download size={16} /> Exportar CSV
        </button>
        <a
          href={`/api/workers/${workerId}/ficha-pdf`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: "8px 16px", backgroundColor: "#2563eb", border: "none", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", color: "#fff", textDecoration: "none" }}
        >
          <Download size={16} /> Baixar PDF Oficial
        </a>
        <button 
          onClick={() => window.print()}
          style={{ padding: "8px 16px", backgroundColor: "var(--navy-900)", border: "none", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontWeight: 600, fontSize: "14px", color: "#fff" }}
        >
          <Printer size={16} /> Imprimir / PDF
        </button>
      </div>

      {/* A Ficha em Si */}
      <div id="ficha-content" style={{ maxWidth: "800px", margin: "0 auto", backgroundColor: "#fff", padding: "40px", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", color: "#000", fontFamily: "Arial, sans-serif" }}>
        
        {/* Cabeçalho */}
        <div style={{ textAlign: "center", borderBottom: "2px solid #000", paddingBottom: "20px", marginBottom: "20px" }}>
          <h1 style={{ fontSize: "22px", margin: "0 0 10px 0", textTransform: "uppercase" }}>Ficha de Controle de Equipamento de Proteção Individual - EPI</h1>
          <p style={{ margin: 0, fontSize: "12px" }}>Conforme Norma Regulamentadora NR-6 da Portaria 3214/78 do MTE</p>
        </div>

        {/* Dados do Empregado */}
        <div style={{ border: "1px solid #000", padding: "10px", marginBottom: "20px", fontSize: "13px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <div><strong>EMPREGADOR:</strong> ORO GESTÃO DE SERVIÇOS</div>
          <div><strong>CNPJ:</strong> 00.000.000/0001-00</div>
          <div style={{ gridColumn: "1 / -1", borderTop: "1px dashed #ccc", margin: "5px 0" }}></div>
          <div><strong>NOME DO EMPREGADO:</strong> {worker.name}</div>
          <div><strong>MATRÍCULA:</strong> {worker.matricula}</div>
          <div><strong>FUNÇÃO:</strong> {worker.role}</div>
          <div><strong>SETOR/CONTRATO:</strong> {worker.project?.name || "N/A"}</div>
          <div><strong>CENTRO DE CUSTO:</strong> {worker.project?.costCenterCode || "N/A"}</div>
          <div><strong>CPF:</strong> {worker.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")}</div>
          <div><strong>DATA ADMISSÃO:</strong> {worker.admissionDate ? new Date(worker.admissionDate).toLocaleDateString("pt-BR") : "___/___/______"}</div>
        </div>

        {/* Termo */}
        <div style={{ fontSize: "11px", textAlign: "justify", marginBottom: "20px", lineHeight: "1.4" }}>
          <p>
            Declaro para os devidos fins que recebi da empresa acima, de forma gratuita, os Equipamentos de Proteção Individual (EPI) listados abaixo. Comprometo-me a usá-los apenas para as finalidades a que se destinam, responsabilizando-me por sua guarda e conservação. Estou ciente de que deverei comunicar ao empregador qualquer alteração que torne o EPI impróprio para uso, e devolver os equipamentos em caso de desligamento. A falta do uso constitui ato faltoso, sujeito a punição conforme a CLT.
          </p>
        </div>

        {/* Tabela */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", border: "1px solid #000" }}>
          <thead>
            <tr>
              <th style={{ border: "1px solid #000", padding: "6px", backgroundColor: "#f0f0f0", width: "15%" }}>DATA</th>
              <th style={{ border: "1px solid #000", padding: "6px", backgroundColor: "#f0f0f0", width: "40%" }}>DESCRIÇÃO DO EPI</th>
              <th style={{ border: "1px solid #000", padding: "6px", backgroundColor: "#f0f0f0", width: "10%" }}>C.A.</th>
              <th style={{ border: "1px solid #000", padding: "6px", backgroundColor: "#f0f0f0", width: "10%" }}>QTD</th>
              <th style={{ border: "1px solid #000", padding: "6px", backgroundColor: "#f0f0f0", width: "25%" }}>ASSINATURA</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ border: "1px solid #000", padding: "20px", textAlign: "center" }}>Nenhum EPI entregue ainda.</td>
              </tr>
            ) : (
              deliveries.flatMap((delivery) => 
                delivery.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
                      {formatDateTime(delivery.deliveredAt).split(" ")[0]}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "8px" }}>
                      {item.product.name}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
                      {item.product.caNumber || "-"}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "8px", textAlign: "center" }}>
                      {item.quantity}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "8px" }}>
                      {/* Espaço para assinatura física */}
                    </td>
                  </tr>
                ))
              )
            )}
            
            {/* Linhas vazias extras para preenchimento manual futuro, caso imprimam */}
            {Array.from({ length: Math.max(0, 15 - (deliveries.length > 0 ? deliveries.flatMap((d) => d.items).length : 0)) }).map((_, i) => (
              <tr key={`empty-${i}`}>
                <td style={{ border: "1px solid #000", padding: "12px" }}></td>
                <td style={{ border: "1px solid #000", padding: "12px" }}></td>
                <td style={{ border: "1px solid #000", padding: "12px" }}></td>
                <td style={{ border: "1px solid #000", padding: "12px" }}></td>
                <td style={{ border: "1px solid #000", padding: "12px" }}></td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>
    </div>
  );
}
