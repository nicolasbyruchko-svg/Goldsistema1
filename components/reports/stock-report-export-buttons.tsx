"use client";

import { useState, type CSSProperties } from "react";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { Download, FileDown, Loader2 } from "lucide-react";
import type { StockReport } from "@/actions/reports-actions";
import { formatCurrency, formatDate } from "@/lib/utils";
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

function buildCsv(report: StockReport): string {
  const lines: string[] = [];
  lines.push("Relatório de Estoque — EPIs e Uniformes");
  lines.push("");
  lines.push(
    `Produtos: ${report.totals.totalProducts}  |  Itens: ${report.totals.totalItems}  |  Valor Total: ${formatCurrency(report.totals.totalValue)}`
  );
  lines.push(
    `EPIs: ${report.totals.totalEpi}  |  Uniformes: ${report.totals.totalUniform}  |  Novos: ${report.totals.totalNovo}  |  Higienizados: ${report.totals.totalHigienizado}  |  Críticos: ${report.totals.criticalCount}`
  );
  lines.push("");

  lines.push(
    ["Produto", "SKU", "Tipo", "Condição", "Tamanho", "CA", "Validade CA", "Custo Unit.", "Fornecedor", "Estoque", "Mín.", "Valor Total"].map(csvCell).join(";")
  );
  for (const row of report.rows) {
    lines.push(
      [
        row.name,
        row.sku,
        row.type === "EPI" ? "EPI" : "Uniforme",
        row.condition === "NOVO" ? "Novo" : "Higienizado",
        row.size || "Único",
        row.caNumber || "",
        row.caValidity ? new Date(row.caValidity).toLocaleDateString("pt-BR") : "",
        row.unitCost.toFixed(2),
        row.supplier || "",
        row.stockQuantity,
        row.minStock,
        row.totalValue.toFixed(2),
      ]
        .map(csvCell)
        .join(";")
    );
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
  { label: "PRODUTO", x: MARGIN },
  { label: "TIPO", x: MARGIN + 180 },
  { label: "COND.", x: MARGIN + 230 },
  { label: "TAM.", x: MARGIN + 290 },
  { label: "CA", x: MARGIN + 330 },
  { label: "CUSTO UNIT.", x: MARGIN + 410 },
  { label: "ESTOQUE", x: MARGIN + 500 },
  { label: "MÍN.", x: MARGIN + 560 },
  { label: "VALOR TOTAL", x: MARGIN + 610 },
];

function trunc(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function drawTableHead(page: PDFPage, font: PDFFont, y: number): number {
  for (const c of COLS) {
    page.drawText(c.label, { x: c.x, y, size: 7, font, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 10;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) });
  return y - 10;
}

function drawRow(page: PDFPage, font: PDFFont, row: StockReport["rows"][number], y: number): number {
  page.drawText(trunc(row.name, 28), { x: COLS[0].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(trunc(row.type === "EPI" ? "EPI" : "Uniforme", 8), { x: COLS[1].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(trunc(row.condition === "NOVO" ? "Novo" : "Hig.", 6), { x: COLS[2].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(row.size || "Único", { x: COLS[3].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(trunc(row.caNumber || "—", 12), { x: COLS[4].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(row.unitCost > 0 ? formatCurrency(row.unitCost) : "—", { x: COLS[5].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });

  const stockColor = row.isCritical ? rgb(0.86, 0.15, 0.15) : rgb(0.08, 0.5, 0.22);
  page.drawText(String(row.stockQuantity), { x: COLS[6].x, y, size: 8, font, color: stockColor });
  page.drawText(String(row.minStock), { x: COLS[7].x, y, size: 8, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(row.totalValue > 0 ? formatCurrency(row.totalValue) : "—", { x: COLS[8].x, y, size: 8, font, color: rgb(0.05, 0.4, 0.25) });

  return y - ROW_H;
}

async function buildPdf(report: StockReport): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const logoImage = await embedLogo(doc);

  const page = doc.addPage([PAGE_W, PAGE_H]);
  let y = PAGE_H - 50;

  const logoW = 140;
  const logoH = (logoImage.height / logoImage.width) * logoW;
  page.drawImage(logoImage, { x: MARGIN, y: y - logoH + 10, width: logoW, height: logoH });

  y -= 38;

  const summary = `Produtos: ${report.totals.totalProducts}  |  Itens: ${report.totals.totalItems}  |  Valor: ${formatCurrency(report.totals.totalValue)}  |  Críticos: ${report.totals.criticalCount}`;
  page.drawText(summary, { x: MARGIN, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 14;

  const summary2 = `EPIs: ${report.totals.totalEpi}  |  Uniformes: ${report.totals.totalUniform}  |  Novos: ${report.totals.totalNovo}  |  Higienizados: ${report.totals.totalHigienizado}`;
  page.drawText(summary2, { x: MARGIN, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 24;

  y = drawTableHead(page, font, y);

  for (const row of report.rows) {
    if (y < BOTTOM_BREAK) {
      const np = doc.addPage([PAGE_W, PAGE_H]);
      y = drawTableHead(np, font, PAGE_H - 50);
    }
    const p = doc.getPages()[doc.getPageCount() - 1];
    y = drawRow(p, font, row, y);
  }

  const lastPage = doc.getPages()[doc.getPageCount() - 1];
  y -= 4;
  lastPage.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.8, color: rgb(0.5, 0.5, 0.5) });
  y -= 14;
  lastPage.drawText("TOTAL", { x: COLS[0].x, y, size: 9, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  lastPage.drawText(String(report.totals.totalItems), { x: COLS[6].x, y, size: 9, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  lastPage.drawText(formatCurrency(report.totals.totalValue), { x: COLS[8].x, y, size: 9, font: boldFont, color: rgb(0.05, 0.4, 0.25) });

  return doc.save();
}

export function StockReportExportButtons({ report }: { report: StockReport }) {
  const [busy, setBusy] = useState<"csv" | "pdf" | null>(null);

  const handleCsv = () => {
    setBusy("csv");
    try {
      downloadBlob(buildCsv(report), `relatorio-estoque-${report.generatedAt.toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    setBusy("pdf");
    try {
      const bytes = await buildPdf(report);
      downloadBlob(bytes as unknown as BlobPart, `relatorio-estoque-${report.generatedAt.toISOString().slice(0, 10)}.pdf`, "application/pdf");
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
