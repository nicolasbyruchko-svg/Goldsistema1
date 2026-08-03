import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import fs from "fs/promises";
import path from "path";

/**
 * Gera o PDF da "Ficha de Controle de Entrega de EPI" a partir do MODELO
 * OFICIAL da empresa (public/templates/ficha_epi_base.pdf — conversão 1:1 de
 * modelos/FICHA DE EPI.doc, sem qualquer alteração de layout).
 *
 * A abordagem aqui é diferente de um PDF "desenhado do zero": carregamos o
 * PDF do modelo como está (mesmas linhas, caixas, textos fixos, timbre) e
 * apenas SOBREPOMOS o texto preenchido (nome, função, entregas de EPI etc.)
 * nas posições exatas dos campos em branco do formulário original. Ou seja,
 * o layout permanece intocado — só automatizamos o preenchimento manual.
 *
 * Por que pdf-lib?
 * - Já é dependência do projeto.
 * - Não depende de Puppeteer/Chromium (evita os problemas de ambiente
 *   Windows já enfrentados nos outros projetos).
 */

export type FichaEpiWorker = {
  id: string;
  matricula: string;
  name: string;
  cpf: string;
  role: string;
  admissionDate: Date | string | null;
  project?: { name: string; costCenterCode?: string | null } | null;
  deliveries: Array<{
    deliveredAt: Date | string;
    items: Array<{
      quantity: number;
      product: {
        name: string;
        caNumber?: string | null;
      };
    }>;
  }>;
};

const TEMPLATE_PATH = path.join(process.cwd(), "public", "templates", "ficha_epi_base.pdf");

// Dimensões do PDF original (Ofício paisagem)
const PAGE_HEIGHT = 612;

function formatDatePtBr(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

// Trunca o texto para não invadir a coluna vizinha do formulário original
function fit(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 1 && font.widthOfTextAtSize(truncated + "…", size) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}

// Converte a coordenada "bottom" (extraída via pdfplumber, origem no topo)
// para a coordenada Y do pdf-lib (origem embaixo).
function yFromBottom(bottom: number): number {
  return PAGE_HEIGHT - bottom + 2;
}

interface RowData {
  data: string;
  ca: string;
  qtd: string;
  equipamento: string;
}

// Colunas da tabela "RECEBIMENTO", extraídas diretamente do PDF original
// (mesmas em ambas as páginas do modelo).
const COLS = {
  data: { x0: 32.8, x1: 92.9 },
  ca: { x0: 92.9, x1: 128.1 },
  qtd: { x0: 128.1, x1: 177.1 },
  equipamento: { x0: 177.1, x1: 331.6 },
};

// Linhas da tabela na página 1 (9 linhas em branco no modelo original)
const PAGE1_ROW_BOTTOMS = [466.25, 480.45, 494.75, 508.95, 523.25, 537.45, 551.75, 565.95, 580.25];

// Linhas da tabela na página 2 (30 linhas em branco no modelo original)
const PAGE2_ROW_BOTTOMS = Array.from({ length: 30 }, (_, i) => 139.95 + i * 14.2);

function drawRow(page: PDFPage, font: PDFFont, rowBottom: number, row: RowData) {
  const y = yFromBottom(rowBottom);
  page.drawText(fit(row.data, font, 8, COLS.data.x1 - COLS.data.x0 - 4), {
    x: COLS.data.x0 + 3,
    y,
    size: 8,
    font,
  });
  page.drawText(fit(row.ca, font, 8, COLS.ca.x1 - COLS.ca.x0 - 4), {
    x: COLS.ca.x0 + 3,
    y,
    size: 8,
    font,
  });
  page.drawText(fit(row.qtd, font, 8, COLS.qtd.x1 - COLS.qtd.x0 - 4), {
    x: COLS.qtd.x0 + 8,
    y,
    size: 8,
    font,
  });
  page.drawText(fit(row.equipamento, font, 8, COLS.equipamento.x1 - COLS.equipamento.x0 - 6), {
    x: COLS.equipamento.x0 + 3,
    y,
    size: 8,
    font,
  });
}

export async function generateFichaEpiPdf(worker: FichaEpiWorker): Promise<Uint8Array> {
  const templateBytes = await fs.readFile(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const page1 = pages[0];
  const page2 = pages[1];

  // --- Dados do cabeçalho (página 1) ---
  // Coordenadas e larguras extraídas diretamente das células do modelo
  // original, para o texto nunca invadir o rótulo/coluna vizinha.
  page1.drawText(fit(worker.name, font, 10, 391.3 - 78 - 3), { x: 78, y: yFromBottom(129.5), size: 10, font });
  page1.drawText(
    fit(worker.admissionDate ? formatDatePtBr(worker.admissionDate) : "", font, 10, 751.48 - 497 - 3),
    { x: 497, y: yFromBottom(129.5), size: 10, font }
  );
  page1.drawText(fit(worker.project?.name || "", font, 9, 235.3 - 127 - 3), {
    x: 127,
    y: yFromBottom(155.3),
    size: 9,
    font,
  });
  page1.drawText(fit(worker.role, font, 9, 511.8 - 291 - 3), { x: 291, y: yFromBottom(153.1), size: 9, font });
  // "Centro de Custo" (coluna 4 do cabeçalho): o rótulo "CENTRO DE CUSTO:"
  // termina em x≈624.68 no modelo original; o valor vai depois dele até a
  // borda da célula em x=751.3, sem invadir a coluna vizinha.
  page1.drawText(
    fit(worker.project?.costCenterCode || "", font, 9, 751.3 - 630.7 - 3),
    { x: 630.7, y: yFromBottom(153.1), size: 9, font }
  );

  // --- Repetição do cabeçalho na página 2 (NOME / ADMISSÃO) ---
  page2.drawText(fit(worker.name, font, 10, 521.3 - 78 - 3), { x: 78, y: yFromBottom(64.1), size: 10, font });
  page2.drawText(
    fit(worker.admissionDate ? formatDatePtBr(worker.admissionDate) : "", font, 10, 747.7 - 592 - 3),
    { x: 592, y: yFromBottom(64.1), size: 10, font }
  );

  // --- Linhas de entrega de EPI ---
  const rows: RowData[] = worker.deliveries.flatMap((delivery) =>
    delivery.items.map((item) => ({
      data: formatDatePtBr(delivery.deliveredAt),
      ca: item.product.caNumber || "-",
      qtd: String(item.quantity),
      equipamento: item.product.name,
    }))
  );

  const capacity = PAGE1_ROW_BOTTOMS.length + PAGE2_ROW_BOTTOMS.length; // 39 linhas no modelo original

  if (rows.length > capacity) {
    // O modelo físico tem um número fixo de linhas (é a ficha em papel da
    // empresa). Se algum dia um trabalhador ultrapassar essa capacidade,
    // priorizamos as entregas mais recentes e avisamos no rodapé em vez de
    // quebrar o layout original do documento.
    const overflow = rows.length - capacity;
    rows.splice(0, overflow);
    page2.drawText(
      `+ ${overflow} entrega(s) mais antiga(s) não exibidas por limite de espaço do modelo — consulte o sistema.`,
      { x: 33, y: 8, size: 7, font, color: rgb(0.6, 0, 0) }
    );
  }

  let i = 0;
  for (const bottom of PAGE1_ROW_BOTTOMS) {
    if (i >= rows.length) break;
    drawRow(page1, font, bottom, rows[i]);
    i++;
  }
  for (const bottom of PAGE2_ROW_BOTTOMS) {
    if (i >= rows.length) break;
    drawRow(page2, font, bottom, rows[i]);
    i++;
  }

  return pdfDoc.save();
}
