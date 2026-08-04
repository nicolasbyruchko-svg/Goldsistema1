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
const BOTTOM_BREAK = 70;

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",;\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function buildCsv(report: UsageReport): string {
  const lines: string[] = [];
  lines.push("Relatório de Uso — EPIs e Uniformes");
  lines.push("");

  const parts: string[] = [];
  if (report.filters.size) parts.push(`Tamanho: ${report.filters.size}`);
  if (report.filters.from) parts.push(`De: ${new Date(report.filters.from).toLocaleDateString("pt-BR")}`);
  if (report.filters.to) parts.push(`Até: ${new Date(report.filters.to).toLocaleDateString("pt-BR")}`);
  if (report.filters.productIds && report.filters.productIds.length > 0) parts.push(`Peças: ${report.filters.productIds.length}`);
  if (report.filters.projectIds && report.filters.projectIds.length > 0) parts.push(`Contratos: ${report.filters.projectIds.length}`);
  if (parts.length > 0) lines.push(parts.join(" | "));

  lines.push(`Registros: ${report.totals.totalRows}  |  Itens: ${report.totals.totalItems}  |  Gasto: ${formatCurrency(report.totals.totalSpent)}`);
  lines.push("");

  lines.push(["Data", "Colaborador", "Contrato", "Peça", "Tam.", "Qtd", "Custo Unit.", "Total", "Motivo"].map(csvCell).join(";"));
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

const COLS = [
  { label: "DATA", x: MARGIN },
  { label: "COLABORADOR", x: MARGIN + 55 },
  { label: "CONTRATO", x: MARGIN + 160 },
  { label: "PEÇA", x: MARGIN + 260 },
  { label: "TAM.", x: MARGIN + 360 },
  { label: "QTD", x: MARGIN + 395 },
  { label: "CUSTO UNIT.", x: MARGIN + 425 },
  { label: "TOTAL", x: MARGIN + 490 },
  { label: "MOTIVO", x: MARGIN + 540 },
];

function drawTableHead(page: PDFPage, font: PDFFont, y: number): number {
  for (const c of COLS) {
    page.drawText(c.label, { x: c.x, y, size: 7, font, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 8;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) });
  return y - 6;
}

function trunc(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function drawRow(page: PDFPage, font: PDFFont, row: UsageReport["rows"][number], y: number): number {
  page.drawText(new Date(row.date).toLocaleDateString("pt-BR"), { x: COLS[0].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(trunc(row.workerName, 18), { x: COLS[1].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(trunc(row.projectName, 16), { x: COLS[2].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(trunc(row.productName, 16), { x: COLS[3].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(row.productSize || "Único", { x: COLS[4].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(String(row.quantity), { x: COLS[5].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(formatCurrency(row.unitCost), { x: COLS[6].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(formatCurrency(row.total), { x: COLS[7].x, y, size: 8, font, color: rgb(0.05, 0.4, 0.25) });
  page.drawText(trunc(formatReason(row.reason), 8), { x: COLS[8].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  return y - ROW_H;
}

async function buildPdf(report: UsageReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - 50;

  page.drawText("Relatório de Uso", { x: MARGIN, y, size: 18, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  y -= 22;

  const parts: string[] = [];
  if (report.filters.size) parts.push(`Tamanho: ${report.filters.size}`);
  if (report.filters.from) parts.push(`De: ${new Date(report.filters.from).toLocaleDateString("pt-BR")}`);
  if (report.filters.to) parts.push(`Até: ${new Date(report.filters.to).toLocaleDateString("pt-BR")}`);
  if (report.filters.productIds && report.filters.productIds.length > 0) parts.push(`Peças: ${report.filters.productIds.length}`);
  if (report.filters.projectIds && report.filters.projectIds.length > 0) parts.push(`Contratos: ${report.filters.projectIds.length}`);
  const filterStr = parts.length > 0 ? parts.join("  |  ") : "Todos os registros";

  const summary = `${filterStr}   —   ${report.totals.totalRows} registro(s)  |  ${report.totals.totalItems} item(s)  |  ${formatCurrency(report.totals.totalSpent)}`;
  page.drawText(summary, { x: MARGIN, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 24;

  y = drawTableHead(page, font, y);

  for (const row of report.rows) {
    if (y < BOTTOM_BREAK) {
      const np = doc.addPage([PAGE_W, PAGE_H]);
      y = drawTableHead(np, font, PAGE_H - 50);
      y = drawRow(np, font, row, y);
    } else {
      y = drawRow(page, font, row, y);
    }
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
        {busy === "csv" ? <Loader2 size={16} /> : <Download size={16} />} CSV
      </button>
      <button type="button" onClick={handlePdf} disabled={busy !== null} style={{ ...buttonStyle, backgroundColor: "var(--navy-800)", color: "#fff", borderColor: "var(--navy-800)", opacity: busy ? 0.6 : 1 }}>
        {busy === "pdf" ? <Loader2 size={16} /> : <FileDown size={16} />} PDF
      </button>
    </div>
  );
}
