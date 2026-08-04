"use client";

import { useState, type CSSProperties } from "react";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { Download, FileDown, Loader2 } from "lucide-react";
import type { SpendingReport, SpendingRow } from "@/actions/reports-actions";
import { formatCurrency } from "@/lib/utils";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 40;
const ROW_H = 15;
const BOTTOM_BREAK = 80;

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",;\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function buildCsv(report: SpendingReport): string {
  const lines: string[] = [];
  lines.push("Relatório de Gastos com EPIs e Uniformes");
  lines.push(`Gerado em: ${report.generatedAt.toLocaleString("pt-BR")}`);
  lines.push("");
  lines.push(`Gasto Total: ${formatCurrency(report.totals.totalSpent)};Gasto no período: ${formatCurrency(report.totals.periodSpent)};Itens Entregues: ${report.totals.totalItems};Entregas: ${report.totals.totalDeliveries}`);
  lines.push("");

  const dump = (title: string, rows: SpendingRow[], labelCol: string, detailCol: string) => {
    lines.push(title);
    lines.push([labelCol, detailCol, "Itens", "Gasto"].map(csvCell).join(";"));
    for (const row of rows) {
      lines.push([row.label, row.detail, row.itemCount, row.total.toFixed(2)].map(csvCell).join(";"));
    }
    lines.push("");
  };

  dump("Gasto por Contrato", report.byProject, "Contrato", "Centro de Custo");
  dump("Gasto por Colaborador", report.byWorker, "Colaborador", "Matrícula");
  dump("Gasto por Motivo", report.byReason, "Motivo", "Código");

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
  { label: "ITEM", x: MARGIN, w: 220 },
  { label: "DETALHE", x: MARGIN + 220, w: 160 },
  { label: "ITENS", x: MARGIN + 380, w: 60 },
  { label: "GASTO", x: MARGIN + 440, w: 80 },
];

function drawHeader(page: PDFPage, font: PDFFont, y: number): number {
  for (const col of COLS) {
    page.drawText(col.label, { x: col.x, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
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

function truncate(text: string, maxChars: number): string {
  return text.length > maxChars ? text.slice(0, maxChars - 1) + "…" : text;
}

function drawSection(
  doc: PDFDocument,
  currentPage: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  title: string,
  rows: SpendingRow[],
  y: number
): { page: PDFPage; y: number } {
  if (y < BOTTOM_BREAK + 40) {
    const np = doc.addPage([PAGE_W, PAGE_H]);
    currentPage = np;
    y = drawHeader(currentPage, font, PAGE_H - 50);
  }

  currentPage.drawText(title, { x: MARGIN, y, size: 11, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  y -= 16;

  y = drawHeader(currentPage, font, y);

  for (const row of rows) {
    if (y < BOTTOM_BREAK) {
      const np = doc.addPage([PAGE_W, PAGE_H]);
      currentPage = np;
      y = drawHeader(currentPage, font, PAGE_H - 50);
    }

    currentPage.drawText(truncate(row.label, 35), { x: COLS[0].x, y, size: 9, font, color: rgb(0.15, 0.15, 0.15) });
    currentPage.drawText(truncate(row.detail, 25), { x: COLS[1].x, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    currentPage.drawText(String(row.itemCount), { x: COLS[2].x, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    currentPage.drawText(formatCurrency(row.total), { x: COLS[3].x, y, size: 9, font, color: rgb(0.05, 0.4, 0.25) });
    y -= ROW_H;
  }
  return { page: currentPage, y: y - 16 };
}

async function buildPdf(report: SpendingReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  let currentPage = doc.addPage([PAGE_W, PAGE_H]);

  currentPage.drawText("Relatório de Gastos com EPIs e Uniformes", { x: MARGIN, y: PAGE_H - 40, size: 16, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  currentPage.drawText(`Gerado em: ${report.generatedAt.toLocaleString("pt-BR")}`, { x: MARGIN, y: PAGE_H - 56, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
  currentPage.drawText(
    `Gasto Total: ${formatCurrency(report.totals.totalSpent)}   |   Gasto no período: ${formatCurrency(report.totals.periodSpent)}   |   Itens: ${report.totals.totalItems}   |   Entregas: ${report.totals.totalDeliveries}`,
    { x: MARGIN, y: PAGE_H - 72, size: 10, font, color: rgb(0.2, 0.2, 0.2) }
  );

  let y = PAGE_H - 100;

  let result = drawSection(doc, currentPage, font, boldFont, "Gasto por Contrato", report.byProject, y);
  currentPage = result.page;
  y = result.y;

  result = drawSection(doc, currentPage, font, boldFont, "Gasto por Colaborador", report.byWorker, y);
  currentPage = result.page;
  y = result.y;

  result = drawSection(doc, currentPage, font, boldFont, "Gasto por Motivo", report.byReason, y);

  return doc.save();
}

export function ReportExportButtons({ report }: { report: SpendingReport }) {
  const [busy, setBusy] = useState<"csv" | "pdf" | null>(null);

  const handleCsv = () => {
    setBusy("csv");
    try {
      downloadBlob(buildCsv(report), `relatorio-gastos-${report.generatedAt.toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    setBusy("pdf");
    try {
      const bytes = await buildPdf(report);
      downloadBlob(bytes as unknown as BlobPart, `relatorio-gastos-${report.generatedAt.toISOString().slice(0, 10)}.pdf`, "application/pdf");
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
