"use client";

import { useState, type CSSProperties } from "react";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { Download, FileDown, Loader2 } from "lucide-react";
import type { UsageReport } from "@/actions/reports-actions";
import { formatCurrency, formatReason } from "@/lib/utils";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 40;
const ROW_H = 16;
const BOTTOM_BREAK = 80;

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

const COLS = [
  { label: "DATA", x: MARGIN, w: 55 },
  { label: "COLABORADOR", x: MARGIN + 55, w: 105 },
  { label: "CONTRATO", x: MARGIN + 160, w: 95 },
  { label: "PEÇA", x: MARGIN + 255, w: 100 },
  { label: "TAM.", x: MARGIN + 355, w: 35 },
  { label: "QTD", x: MARGIN + 390, w: 30 },
  { label: "CUSTO UNIT.", x: MARGIN + 420, w: 60 },
  { label: "TOTAL", x: MARGIN + 480, w: 55 },
  { label: "MOTIVO", x: MARGIN + 535, w: 37 },
];

function drawHeader(page: PDFPage, font: PDFFont, y: number): number {
  for (const col of COLS) {
    page.drawText(col.label, { x: col.x, y, size: 7, font, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 8;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  return y - 8;
}

function drawRow(page: PDFPage, font: PDFFont, row: UsageReport["rows"][number], y: number): number {
  const dateStr = new Date(row.date).toLocaleDateString("pt-BR");
  const sizeStr = row.productSize || "Único";
  const reasonStr = formatReason(row.reason);

  page.drawText(dateStr, { x: COLS[0].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(truncate(row.workerName, 18), { x: COLS[1].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(truncate(row.projectName, 16), { x: COLS[2].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(truncate(row.productName, 17), { x: COLS[3].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(sizeStr, { x: COLS[4].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(String(row.quantity), { x: COLS[5].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(formatCurrency(row.unitCost), { x: COLS[6].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(formatCurrency(row.total), { x: COLS[7].x, y, size: 8, font, color: rgb(0.05, 0.4, 0.25) });
  page.drawText(truncate(reasonStr, 6), { x: COLS[8].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });

  return y - ROW_H;
}

function truncate(text: string, maxChars: number): string {
  return text.length > maxChars ? text.slice(0, maxChars - 1) + "…" : text;
}

function newPage(doc: PDFDocument, font: PDFFont): { page: PDFPage; y: number } {
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const y = drawHeader(page, font, PAGE_H - 50);
  return { page, y };
}

async function buildPdf(report: UsageReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  let { page: currentPage, y } = newPage(doc, font);

  currentPage.drawText("Relatório de Uso — EPIs e Uniformes", { x: MARGIN, y: PAGE_H - 40, size: 16, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  currentPage.drawText(`Gerado em: ${report.generatedAt.toLocaleString("pt-BR")}`, { x: MARGIN, y: PAGE_H - 56, size: 10, font, color: rgb(0.35, 0.35, 0.35) });

  const filterText = buildFilterSummary(report);
  currentPage.drawText(filterText, { x: MARGIN, y: PAGE_H - 70, size: 9, font, color: rgb(0.45, 0.45, 0.45) });

  const summary = `Registros: ${report.totals.totalRows}  |  Itens: ${report.totals.totalItems}  |  Gasto Total: ${formatCurrency(report.totals.totalSpent)}`;
  currentPage.drawText(summary, { x: MARGIN, y: PAGE_H - 84, size: 10, font, color: rgb(0.2, 0.2, 0.2) });

  y = PAGE_H - 110;
  y = drawHeader(currentPage, font, y);

  for (const row of report.rows) {
    if (y < BOTTOM_BREAK) {
      const np = newPage(doc, font);
      currentPage = np.page;
      y = np.y;
    }
    y = drawRow(currentPage, font, row, y);
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
