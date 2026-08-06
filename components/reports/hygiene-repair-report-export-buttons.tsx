"use client";

import { useState, type CSSProperties } from "react";
import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { Download, FileDown, Loader2 } from "lucide-react";
import type { HygieneRepairReport, HygieneRepairRow } from "@/actions/reports-actions";
import { embedLogo } from "@/lib/pdf/logo";

const PAGE_W = 792;
const PAGE_H = 612;
const MARGIN = 40;
const ROW_H = 16;
const BOTTOM_BREAK = 70;

function csvCell(value: string | number): string {
  const str = String(value);
  return /[",;\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

function formatDateBR(d: Date | string): string {
  return new Date(d).toLocaleDateString("pt-BR");
}

function buildCsv(report: HygieneRepairReport): string {
  const lines: string[] = [];
  lines.push("Relatório — Itens em Higienização e/ou Reparo");
  lines.push("");
  lines.push(`Gerado em: ${report.generatedAt.toLocaleDateString("pt-BR")} ${report.generatedAt.toLocaleTimeString("pt-BR")}`);
  lines.push(`Higienização: ${report.totals.totalHygiene} peça(s) pendente(s)  |  Reparo: ${report.totals.totalRepair} peça(s) pendente(s)`);
  lines.push("");

  if (report.hygieneRows.length > 0) {
    lines.push("--- ITENS EM HIGIENIZAÇÃO ---");
    lines.push(["Colaborador", "Contrato", "Peça", "Tam.", "Total", "Aprovadas", "Reprovadas", "Pendentes", "Devolução"].map(csvCell).join(";"));
    for (const row of report.hygieneRows) {
      lines.push([
        row.workerName,
        row.projectName,
        row.productName,
        row.productSize || "Único",
        row.quantity,
        row.approvedQty,
        row.rejectedQty,
        row.pendingQty,
        formatDateBR(row.devolvedAt),
      ].map(csvCell).join(";"));
    }
    lines.push("");
  }

  if (report.repairRows.length > 0) {
    lines.push("--- ITENS EM REPARO ---");
    lines.push(["Colaborador", "Contrato", "Peça", "Tam.", "Total", "Já Reparados", "Pendentes", "Devolução"].map(csvCell).join(";"));
    for (const row of report.repairRows) {
      lines.push([
        row.workerName,
        row.projectName,
        row.productName,
        row.productSize || "Único",
        row.quantity,
        row.repairedQty,
        row.pendingQty,
        formatDateBR(row.devolvedAt),
      ].map(csvCell).join(";"));
    }
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

const HYGIENE_COLS = [
  { label: "COLABORADOR", x: MARGIN },
  { label: "CONTRATO", x: MARGIN + 130 },
  { label: "PEÇA", x: MARGIN + 270 },
  { label: "TAM.", x: MARGIN + 400 },
  { label: "TOTAL", x: MARGIN + 440 },
  { label: "APROV.", x: MARGIN + 480 },
  { label: "REPROV.", x: MARGIN + 530 },
  { label: "PEND.", x: MARGIN + 585 },
  { label: "DEVOLUÇÃO", x: MARGIN + 640 },
];

const REPAIR_COLS = [
  { label: "COLABORADOR", x: MARGIN },
  { label: "CONTRATO", x: MARGIN + 140 },
  { label: "PEÇA", x: MARGIN + 280 },
  { label: "TAM.", x: MARGIN + 420 },
  { label: "TOTAL", x: MARGIN + 470 },
  { label: "REPAR.", x: MARGIN + 520 },
  { label: "PEND.", x: MARGIN + 580 },
  { label: "DEVOLUÇÃO", x: MARGIN + 640 },
];

function trunc(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function drawHygieneHead(page: PDFPage, font: PDFFont, y: number): number {
  for (const c of HYGIENE_COLS) {
    page.drawText(c.label, { x: c.x, y, size: 7, font, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 10;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) });
  return y - 10;
}

function drawRepairHead(page: PDFPage, font: PDFFont, y: number): number {
  for (const c of REPAIR_COLS) {
    page.drawText(c.label, { x: c.x, y, size: 7, font, color: rgb(0.4, 0.4, 0.4) });
  }
  y -= 10;
  page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_W - MARGIN, y }, thickness: 0.5, color: rgb(0.75, 0.75, 0.75) });
  return y - 10;
}

function drawHygieneRow(page: PDFPage, font: PDFFont, row: HygieneRepairRow, y: number): number {
  page.drawText(trunc(row.workerName, 20), { x: HYGIENE_COLS[0].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(trunc(row.projectName, 20), { x: HYGIENE_COLS[1].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(trunc(row.productName, 20), { x: HYGIENE_COLS[2].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(row.productSize || "Único", { x: HYGIENE_COLS[3].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(String(row.quantity), { x: HYGIENE_COLS[4].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(String(row.approvedQty), { x: HYGIENE_COLS[5].x, y, size: 8, font, color: rgb(0.05, 0.4, 0.25) });
  page.drawText(String(row.rejectedQty), { x: HYGIENE_COLS[6].x, y, size: 8, font, color: rgb(0.7, 0.15, 0.15) });
  page.drawText(String(row.pendingQty), { x: HYGIENE_COLS[7].x, y, size: 8, font, color: rgb(0.6, 0.4, 0.0) });
  page.drawText(formatDateBR(row.devolvedAt), { x: HYGIENE_COLS[8].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  return y - ROW_H;
}

function drawRepairRow(page: PDFPage, font: PDFFont, row: HygieneRepairRow, y: number): number {
  page.drawText(trunc(row.workerName, 20), { x: REPAIR_COLS[0].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(trunc(row.projectName, 20), { x: REPAIR_COLS[1].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(trunc(row.productName, 20), { x: REPAIR_COLS[2].x, y, size: 8, font, color: rgb(0.15, 0.15, 0.15) });
  page.drawText(row.productSize || "Único", { x: REPAIR_COLS[3].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(String(row.quantity), { x: REPAIR_COLS[4].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(String(row.repairedQty), { x: REPAIR_COLS[5].x, y, size: 8, font, color: rgb(0.05, 0.4, 0.25) });
  page.drawText(String(row.pendingQty), { x: REPAIR_COLS[6].x, y, size: 8, font, color: rgb(0.6, 0.4, 0.0) });
  page.drawText(formatDateBR(row.devolvedAt), { x: REPAIR_COLS[7].x, y, size: 8, font, color: rgb(0.3, 0.3, 0.3) });
  return y - ROW_H;
}

async function buildPdf(report: HygieneRepairReport): Promise<Uint8Array> {
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

  const summary = `Higienização: ${report.totals.totalHygiene} peça(s)  |  Reparo: ${report.totals.totalRepair} peça(s)  |  Total: ${report.totals.totalItems} peça(s) pendente(s)`;
  page.drawText(summary, { x: MARGIN, y, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  y -= 24;

  if (report.hygieneRows.length > 0) {
    page.drawText("ITENS EM HIGIENIZAÇÃO", { x: MARGIN, y, size: 10, font: boldFont, color: rgb(0.6, 0.35, 0.0) });
    y -= 16;
    y = drawHygieneHead(page, font, y);

    for (const row of report.hygieneRows) {
      if (y < BOTTOM_BREAK) {
        const np = doc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - 50;
        y = drawHygieneHead(np, font, y);
        y = drawHygieneRow(np, font, row, y);
      } else {
        y = drawHygieneRow(page, font, row, y);
      }
    }
    y -= 10;
  }

  if (report.repairRows.length > 0) {
    if (y < BOTTOM_BREAK + 60) {
      doc.addPage([PAGE_W, PAGE_H]);
      y = PAGE_H - 50;
    }
    const currentPage = doc.getPages()[doc.getPageCount() - 1];
    currentPage.drawText("ITENS EM REPARO", { x: MARGIN, y, size: 10, font: boldFont, color: rgb(0.26, 0.22, 0.8) });
    y -= 16;
    y = drawRepairHead(currentPage, font, y);

    for (const row of report.repairRows) {
      if (y < BOTTOM_BREAK) {
        const np = doc.addPage([PAGE_W, PAGE_H]);
        y = PAGE_H - 50;
        y = drawRepairHead(np, font, y);
        y = drawRepairRow(np, font, row, y);
      } else {
        y = drawRepairRow(currentPage, font, row, y);
      }
    }
  }

  return doc.save();
}

export function HygieneRepairReportExportButtons({ report }: { report: HygieneRepairReport }) {
  const [busy, setBusy] = useState<"csv" | "pdf" | null>(null);

  const handleCsv = () => {
    setBusy("csv");
    try {
      downloadBlob(buildCsv(report), `relatorio-higienizacao-reparo-${report.generatedAt.toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8");
    } finally {
      setBusy(null);
    }
  };

  const handlePdf = async () => {
    setBusy("pdf");
    try {
      const bytes = await buildPdf(report);
      downloadBlob(bytes as unknown as BlobPart, `relatorio-higienizacao-reparo-${report.generatedAt.toISOString().slice(0, 10)}.pdf`, "application/pdf");
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
