import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PDFDocument, StandardFonts } from "pdf-lib";
import fs from "fs/promises";
import path from "path";
import { formatDate } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        worker: true,
        project: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!delivery) {
      return NextResponse.json(
        { error: "Entrega não encontrada" },
        { status: 404 }
      );
    }

    // Ao abrir a ficha (Ver Ficha) pela primeira vez, marca a entrega como assinada
    if (delivery.status === "PENDING_SIGNATURE") {
      await prisma.delivery.update({
        where: { id },
        data: { status: "SIGNED" },
      });
    }

    const templatePath = path.join(
      process.cwd(),
      "public",
      "templates",
      "termo_uniformes.pdf"
    );

    const templateBytes = await fs.readFile(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    const form = pdfDoc.getForm();

    // Mapeamento de Variáveis (Keys do PDF -> Dados do SaaS)
    // 1. matricula: Matrícula do colaborador referente àquela entrega
    try {
      const matriculaField = form.getTextField("matricula");
      matriculaField.setText(delivery.worker.matricula || "");
    } catch {}

    // 2. nome: Nome completo do colaborador
    try {
      const nomeField = form.getTextField("nome");
      nomeField.setText(delivery.worker.name || "");
    } catch {}

    // 3. data: Data de admissão do colaborador (DD/MM/AAAA)
    try {
      const dataField = form.getTextField("data");
      dataField.setText(formatDate(delivery.worker.admissionDate));
    } catch {}

    // 4. itens: Lista das peças entregues (uma por linha)
    try {
      const itensField = form.getTextField("itens");
      itensField.enableMultiline();
      const itensStr = delivery.items
        .map(
          (item) =>
            `${item.quantity}x ${item.product.name}${
              item.product.size ? ` Tam ${item.product.size}` : ""
            }`
        )
        .join("\n");
      itensField.setFontSize(10);
      itensField.setText(itensStr);
    } catch {}

    // Atualiza aparência dos campos usando fonte padrão Helvetica e achata o formulário
    try {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      form.updateFieldAppearances(font);
      form.flatten();
    } catch {}

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Ficha_Entrega_${delivery.worker.matricula}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF da entrega:", error);
    return NextResponse.json(
      { error: "Erro ao gerar PDF da entrega" },
      { status: 500 }
    );
  }
}
