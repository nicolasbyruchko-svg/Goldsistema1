"use client";

import { useState, type CSSProperties } from "react";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { Download, FileDown, Loader2 } from "lucide-react";
import type { SpendingReport, SpendingRow } from "@/actions/reports-actions";
import { formatCurrency } from "@/lib/utils";

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

function drawSection(
  doc: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  boldFont: PDFFont,
  title: string,
  rows: SpendingRow[],
  labelCol: string,
  detailCol: string,
  y: number
): number {
  const width = page.getWidth();
  const margin = 40;
  const detailX = width - margin - 200;
  const itemsX = width - margin - 130;
  const totalX = width - margin - 70;

  page.drawText(title, { x: margin, y, size: 12, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  y -= 18;

  page.drawText(labelCol.toUpperCase(), { x: margin, y, size: 8, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(detailCol.toUpperCase(), { x: detailX, y, size: 8, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
  page.drawText("ITENS", { x: itemsX, y, size: 8, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
  page.drawText("GASTO", { x: totalX, y, size: 8, font: boldFont, color: rgb(0.4, 0.4, 0.4) });
  y -= 14;

  for (const row of rows) {
    if (y < 50) {
      page = doc.addPage([width, 612]);
      y = 570;
    }
    page.drawText(row.label, { x: margin, y, size: 9, font, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(row.detail, { x: detailX, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(String(row.itemCount), { x: itemsX, y, size: 9, font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(formatCurrency(row.total), { x: totalX, y, size: 9, font, color: rgb(0.05, 0.4, 0.25) });
    y -= 14;
  }
  return y - 12;
}

async function buildPdf(report: SpendingReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const page = doc.addPage([612, 612]);

  page.drawText("Relatório de Gastos com EPIs e Uniformes", { x: 40, y: 575, size: 16, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  page.drawText(`Gerado em: ${report.generatedAt.toLocaleString("pt-BR")}`, { x: 40, y: 558, size: 10, font, color: rgb(0.35, 0.35, 0.35) });
  page.drawText(
    `Gasto Total: ${formatCurrency(report.totals.totalSpent)}   |   Gasto no período: ${formatCurrency(report.totals.periodSpent)}   |   Itens: ${report.totals.totalItems}   |   Entregas: ${report.totals.totalDeliveries}`,
    { x: 40, y: 540, size: 10, font, color: rgb(0.2, 0.2, 0.2) }
  );

  let y = 505;
  y = drawSection(doc, page, font, boldFont, "Gasto por Contrato", report.byProject, "Contrato", "Centro de Custo", y);
  y = drawSection(doc, page, font, boldFont, "Gasto por Colaborador", report.byWorker, "Colaborador", "Matrícula", y);
  drawSection(doc, page, font, boldFont, "Gasto por Motivo", report.byReason, "Motivo", "Código", y);

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
