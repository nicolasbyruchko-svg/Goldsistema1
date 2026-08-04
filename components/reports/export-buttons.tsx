"use client";

import { useState, type CSSProperties } from "react";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { Download, FileDown, Loader2 } from "lucide-react";
import type { SpendingReport, SpendingRow } from "@/actions/reports-actions";
import { formatCurrency } from "@/lib/utils";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 40;
const BOTTOM_MARGIN = 60;

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

function drawTableHeader(
  page: PDFPage,
  font: PDFFont,
  cols: { label: string; x: number }[],
  y: number
): number {
  for (const col of cols) {
    page.drawText(col.label, { x: col.x, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 6;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_W - MARGIN, y },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  return y - 10;
}

function ensurePage(doc: PDFDocument, font: PDFFont, y: number, cols: { label: string; x: number }[]): { page: PDFPage; y: number } {
  if (y > BOTTOM_MARGIN) return { page: doc.getPages()[doc.getPageCount() - 1], y };
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const newY = drawTableHeader(page, font, cols, PAGE_H - 50);
  return { page, y: newY };
}

function drawSection(
  doc: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  title: string,
  rows: SpendingRow[],
  cols: { label: string; x: number }[],
  y: number
): { page: PDFPage; y: number } {
  page.drawText(title, { x: MARGIN, y, size: 11, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  y -= 16;

  const result = ensurePage(doc, font, y, cols);
  page = result.page;
  y = result.y;

  y = drawTableHeader(page, font, cols, y);

  const labelX = cols[0].x;
  const detailX = cols[1].x;
  const itemsX = cols[2].x;
  const totalX = cols[3].x;

  for (const row of rows) {
    const check = ensurePage(doc, font, y, cols);
    if (check.page !== page) {
      page = check.page;
      y = check.y;
    }

    page.drawText(row.label, { x: labelX, y, size: 9, font, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(row.detail, { x: detailX, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(String(row.itemCount), { x: itemsX, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(formatCurrency(row.total), { x: totalX, y, size: 9, font, color: rgb(0.05, 0.4, 0.25) });
    y -= 15;
  }
  return { page, y: y - 16 };
}

async function buildPdf(report: SpendingReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([PAGE_W, PAGE_H]);

  page.drawText("Relatório de Gastos com EPIs e Uniformes", { x: MARGIN, y: PAGE_H - 45, size: 16, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  page.drawText(`Gerado em: ${report.generatedAt.toLocaleString("pt-BR")}`, { x: MARGIN, y: PAGE_H - 63, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
  page.drawText(
    `Gasto Total: ${formatCurrency(report.totals.totalSpent)}   |   Gasto no período: ${formatCurrency(report.totals.periodSpent)}   |   Itens: ${report.totals.totalItems}   |   Entregas: ${report.totals.totalDeliveries}`,
    { x: MARGIN, y: PAGE_H - 80, size: 10, font, color: rgb(0.2, 0.2, 0.2) }
  );

  const cols = [
    { label: "CONTRATO / COLABORADOR / MOTIVO", x: MARGIN },
    { label: "DETALHE", x: MARGIN + 230 },
    { label: "ITENS", x: MARGIN + 380 },
    { label: "GASTO", x: MARGIN + 440 },
  ];

  let y = PAGE_H - 115;
  let currentPage = page;

  let result = drawSection(doc, currentPage, font, boldFont, "Gasto por Contrato", report.byProject, cols, y);
  currentPage = result.page;
  y = result.y;

  result = drawSection(doc, currentPage, font, boldFont, "Gasto por Colaborador", report.byWorker, cols, y);
  currentPage = result.page;
  y = result.y;

  result = drawSection(doc, currentPage, font, boldFont, "Gasto por Motivo", report.byReason, cols, y);

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
