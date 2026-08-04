"use client";

import { useState, type CSSProperties } from "react";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { Download, FileDown, Loader2 } from "lucide-react";
import type { SpendingReport, SpendingRow } from "@/actions/reports-actions";
import { formatCurrency } from "@/lib/utils";
import { embedLogo } from "@/lib/pdf/logo";

const PAGE_W = 792;
const PAGE_H = 612;
const MARGIN = 40;
const ROW_H = 15;
const BOTTOM_BREAK = 70;

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",;\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function buildCsv(report: SpendingReport): string {
  const lines: string[] = [];
  lines.push("Relatório de Gastos — EPIs e Uniformes");
  lines.push("");
  lines.push(`Gasto Total: ${formatCurrency(report.totals.totalSpent)}  |  Gasto no período: ${formatCurrency(report.totals.periodSpent)}  |  Itens: ${report.totals.totalItems}  |  Entregas: ${report.totals.totalDeliveries}`);
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
  { label: "ITEM", x: MARGIN },
  { label: "DETALHE", x: MARGIN + 300 },
  { label: "ITENS", x: MARGIN + 500 },
  { label: "GASTO", x: MARGIN + 560 },
];

function drawTableHead(page: PDFPage, font: PDFFont, y: number): number {
  for (const c of COLS) {
    page.drawText(c.label, { x: c.x, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 10;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) });
  return y - 10;
}

function trunc(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function drawSection(
  doc: PDFDocument,
  font: PDFFont,
  boldFont: PDFFont,
  title: string,
  rows: SpendingRow[],
  y: number
): { y: number } {
  if (y < BOTTOM_BREAK + 30) {
    const np = doc.addPage([PAGE_W, PAGE_H]);
    y = drawTableHead(np, font, PAGE_H - 50);
  }

  const page = doc.getPages()[doc.getPageCount() - 1];
  page.drawText(title, { x: MARGIN, y, size: 11, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  y -= 16;
  y = drawTableHead(page, font, y);

  for (const row of rows) {
    if (y < BOTTOM_BREAK) {
      const np = doc.addPage([PAGE_W, PAGE_H]);
      y = drawTableHead(np, font, PAGE_H - 50);
    }
    const p = doc.getPages()[doc.getPageCount() - 1];
    p.drawText(trunc(row.label, 50), { x: COLS[0].x, y, size: 9, font, color: rgb(0.15, 0.15, 0.15) });
    p.drawText(trunc(row.detail, 35), { x: COLS[1].x, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    p.drawText(String(row.itemCount), { x: COLS[2].x, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    p.drawText(formatCurrency(row.total), { x: COLS[3].x, y, size: 9, font, color: rgb(0.05, 0.4, 0.25) });
    y -= ROW_H;
  }

  const totalItems = rows.reduce((s, r) => s + r.itemCount, 0);
  const totalSpent = rows.reduce((s, r) => s + r.total, 0);
  y -= 4;
  const p = doc.getPages()[doc.getPageCount() - 1];
  p.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.8, color: rgb(0.5, 0.5, 0.5) });
  y -= 14;
  p.drawText("TOTAL", { x: COLS[0].x, y, size: 9, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  p.drawText(String(totalItems), { x: COLS[2].x, y, size: 9, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  p.drawText(formatCurrency(totalSpent), { x: COLS[3].x, y, size: 9, font: boldFont, color: rgb(0.05, 0.4, 0.25) });

  return { y: y - ROW_H - 16 };
}

async function buildPdf(report: SpendingReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const logoImage = await embedLogo(doc);

  const page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - 50;

  const logoW = 140;
  const logoH = (logoImage.height / logoImage.width) * logoW;
  page.drawImage(logoImage, { x: MARGIN, y: y - logoH + 10, width: logoW, height: logoH });

  y -= 22;

  const summary = `Gasto Total: ${formatCurrency(report.totals.totalSpent)}   |   Período: ${formatCurrency(report.totals.periodSpent)}   |   Itens: ${report.totals.totalItems}   |   Entregas: ${report.totals.totalDeliveries}`;
  page.drawText(summary, { x: MARGIN, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 24;

  let result = drawSection(doc, font, boldFont, "Gasto por Contrato", report.byProject, y);
  y = result.y;

  result = drawSection(doc, font, boldFont, "Gasto por Colaborador", report.byWorker, y);
  y = result.y;

  result = drawSection(doc, font, boldFont, "Gasto por Motivo", report.byReason, y);

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
        {busy === "csv" ? <Loader2 size={16} /> : <Download size={16} />} CSV
      </button>
      <button type="button" onClick={handlePdf} disabled={busy !== null} style={{ ...buttonStyle, backgroundColor: "var(--navy-800)", color: "#fff", borderColor: "var(--navy-800)", opacity: busy ? 0.6 : 1 }}>
        {busy === "pdf" ? <Loader2 size={16} /> : <FileDown size={16} />} PDF
      </button>
    </div>
  );
}
