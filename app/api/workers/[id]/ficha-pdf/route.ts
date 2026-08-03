import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateFichaEpiPdf } from "@/lib/pdf/ficha-epi";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const worker = await prisma.worker.findUnique({
      where: { id },
      include: {
        project: true,
        deliveries: {
          include: {
            items: { include: { product: true } },
          },
          orderBy: { deliveredAt: "asc" },
        },
      },
    });

    if (!worker) {
      return NextResponse.json(
        { error: "Trabalhador não encontrado" },
        { status: 404 }
      );
    }

    const pdfBytes = await generateFichaEpiPdf(worker);

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Ficha_EPI_${worker.matricula}_${worker.name.replace(/ /g, "_")}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar PDF da Ficha de EPI:", error);
    return NextResponse.json(
      { error: "Erro ao gerar a Ficha de EPI" },
      { status: 500 }
    );
  }
}
