"use client";

import { useState, type CSSProperties } from "react";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { Download, FileDown, Loader2 } from "lucide-react";
import type { UsageReport } from "@/actions/reports-actions";
import { formatCurrency, formatDate, formatReason } from "@/lib/utils";

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",;\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function buildCsv(report: UsageReport): string {
  const lines: string[] = [];
  lines.push("Relatório de Uso — EPIs e Uniformes");
  lines.push(`Gerado em: ${report.generatedAt.toLocaleString("pt-BR")}`);
  lines.push("");

  const activeFilters: string[] = [];
  if (report.filters.productIds && report.filters.productIds.length > 0) {
    activeFilters.push(`Peças: ${report.filters.productIds.length} selecionada(s)`);
  }
  if (report.filters.size) activeFilters.push(`Tamanho: ${report.filters.size}`);
  if (report.filters.projectIds && report.filters.projectIds.length > 0) {
    activeFilters.push(`Contratos: ${report.filters.projectIds.length} selecionado(s)`);
  }
  if (report.filters.from) activeFilters.push(`De: ${new Date(report.filters.from).toLocaleDateString("pt-BR")}`);
  if (report.filters.to) activeFilters.push(`Até: ${new Date(report.filters.to).toLocaleDateString("pt-BR")}`);
  if (activeFilters.length > 0) {
    lines.push(`Filtros: ${activeFilters.join(" | ")}`);
    lines.push("");
  }

  lines.push(`Registros: ${report.totals.totalRows};Itens Entregues: ${report.totals.totalItems};Gasto Total: ${report.totals.totalSpent.toFixed(2)}`);
  lines.push("");

  lines.push(["Data", "Colaborador", "Contrato", "Peça", "Tamanho", "Qtd", "Custo Unit.", "Total", "Motivo"].map(csvCell).join(";"));
  for (const row of report.rows) {
    lines.push([
      new Date(row.date).toLocaleDateString("pt-BR"),
      row.workerName,
      row.projectName,
      row.productName,
      row.productSize || "Único",
      row.quantity,
      row.unitCost.toFixed(2),
      row.total.toFixed(2),
      formatReason(row.reason),
    ].map(csvCell).join(";"));
  }

  return lines.join("\r\n");
}

function downloadBlob(content: BlobPart, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function buildFilterSummary(report: UsageReport): string {
  const parts: string[] = [];
  if (report.filters.size) parts.push(`Tamanho: ${report.filters.size}`);
  if (report.filters.from) parts.push(`De: ${new Date(report.filters.from).toLocaleDateString("pt-BR")}`);
  if (report.filters.to) parts.push(`Até: ${new Date(report.filters.to).toLocaleDateString("pt-BR")}`);
  return parts.length > 0 ? parts.join("  |  ") : "Sem filtros aplicados";
}

async function buildPdf(report: UsageReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 792]);

  const width = page.getWidth();
  const margin = 40;
  const colWidths = { date: 65, worker: 95, project: 90, product: 95, size: 45, qty: 30, unitCost: 55, total: 60, reason: 70 };
  const totalWidth = Object.values(colWidths).reduce((s, w) => s + w, 0);
  const scaleX = (width - margin * 2) / totalWidth;

  const colX: Record<string, number> = {};
  let cx = margin;
  for (const [key, w] of Object.entries(colWidths)) {
    colX[key] = cx;
    cx += w * scaleX;
  }

  page.drawText("Relatório de Uso — EPIs e Uniformes", { x: margin, y: 755, size: 16, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  page.drawText(`Gerado em: ${report.generatedAt.toLocaleString("pt-BR")}`, { x: margin, y: 738, size: 10, font, color: rgb(0.35, 0.35, 0.35) });

  const filterText = buildFilterSummary(report);
  page.drawText(filterText, { x: margin, y: 722, size: 9, font, color: rgb(0.45, 0.45, 0.45) });

  const summary = `Registros: ${report.totals.totalRows}  |  Itens: ${report.totals.totalItems}  |  Gasto Total: ${formatCurrency(report.totals.totalSpent)}`;
  page.drawText(summary, { x: margin, y: 704, size: 10, font, color: rgb(0.2, 0.2, 0.2) });

  let y = 678;
  const headers = [
    { key: "date", label: "DATA" },
    { key: "worker", label: "COLABORADOR" },
    { key: "project", label: "CONTRATO" },
    { key: "product", label: "PEÇA" },
    { key: "size", label: "TAM." },
    { key: "qty", label: "QTD" },
    { key: "unitCost", label: "CUSTO UNIT." },
    { key: "total", label: "TOTAL" },
    { key: "reason", label: "MOTIVO" },
  ];

  for (const h of headers) {
    page.drawText(h.label, { x: colX[h.key], y, size: 7, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 12;

  page.drawLine({
    start: { x: margin, y: y + 4 },
    end: { x: width - margin, y: y + 4 },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 4;

  for (const row of report.rows) {
    if (y < 50) {
      const newPage = doc.addPage([612, 792]);
      y = 755;
      for (const h of headers) {
        newPage.drawText(h.label, { x: colX[h.key], y, size: 7, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
      }
      y -= 16;
    }

    const dateStr = new Date(row.date).toLocaleDateString("pt-BR");
    const sizeStr = row.productSize || "Único";
    const reasonStr = formatReason(row.reason);

    page.drawText(dateStr, { x: colX.date, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(row.workerName, { x: colX.worker, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(row.projectName, { x: colX.project, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(row.productName, { x: colX.product, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(sizeStr, { x: colX.size, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(String(row.quantity), { x: colX.qty, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(formatCurrency(row.unitCost), { x: colX.unitCost, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(formatCurrency(row.total), { x: colX.total, y, size: 8, font, color: rgb(0.05, 0.4, 0.25) });
    page.drawText(reasonStr, { x: colX.reason, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });

    y -= 13;
  }

  return doc.save();
}

export function UsageReportExportButtons({ report }: { report: UsageReport }) {
  const [busy, setBusy] = useState<"csv" | "pdf" | null>(null);

  const handleCsv = () => {
    setBusy("csv");
    try {
      downloadBlob(buildCsv(report), `relatorio-uso-${report.generatedAt.toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    setBusy("pdf");
    try {
      const bytes = await buildPdf(report);
      downloadBlob(bytes as unknown as BlobPart, `relatorio-uso-${report.generatedAt.toISOString().slice(0, 10)}.pdf`, "application/pdf");
    } finally {
      setBusy(null);
    }
  };

  const buttonStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    border: "1px solid var(--gray-200)",
    backgroundColor: "#fff",
    color: "var(--navy-900)",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
  };

  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      <button type="button" onClick={handleCsv} disabled={busy !== null} style={{ ...buttonStyle, opacity: busy ? 0.6 : 1 }}>
        {busy === "csv" ? <Loader2 size={16} /> : <Download size={16} />} Exportar CSV
      </button>
      <button type="button" onClick={handlePdf} disabled={busy !== null} style={{ ...buttonStyle, backgroundColor: "var(--navy-800)", color: "#fff", borderColor: "var(--navy-800)", opacity: busy ? 0.6 : 1 }}>
        {busy === "pdf" ? <Loader2 size={16} /> : <FileDown size={16} />} Exportar PDF
      </button>
    </div>
  );
}
