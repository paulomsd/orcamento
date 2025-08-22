import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { calculateOrcamentoDetalhado } from "@/lib/calc";
import { createClient } from "@/lib/supabase/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"));
  }

  const id = params.id;
  const resumo = await calculateOrcamentoDetalhado(id);

  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  let y = 800;

  const drawText = (text: string, x: number, size = 12, bold = false) => {
    page.drawText(text, { x, y, size, font: bold ? fontBold : font, color: rgb(0, 0, 0) });
  };

  drawText("Resumo do Orçamento", margin, 16, true);
  y -= 24;
  drawText(`Custo direto: R$ ${resumo.total.toFixed(2)}`, margin); y -= 16;
  drawText(`BDI: ${resumo.bdi}%`, margin); y -= 16;
  drawText(`Total: R$ ${resumo.total_com_bdi.toFixed(2)}`, margin, 12, true); y -= 24;

  drawText("Itens", margin, 14, true); y -= 18;
  const colX = [margin, 300, 420, 500];
  const header = ["Composição", "Unitário", "Qtd", "Subtotal"];
  [0,1,2,3].forEach(i => drawText(header[i], colX[i], 12, true));
  y -= 14;

  for (const it of resumo.itens) {
    if (y < 60) {
      page = pdfDoc.addPage([595, 842]);
      y = 800;
      drawText("Itens (cont.)", margin, 14, true); y -= 18;
      [0,1,2,3].forEach(i => drawText(header[i], colX[i], 12, true));
      y -= 14;
    }
    drawText(`${it.codigo} - ${it.nome}`.slice(0, 55), colX[0], 11);
    drawText(`R$ ${it.custo_unitario.toFixed(2)}`, colX[1], 11);
    drawText(String(it.quantidade), colX[2], 11);
    drawText(`R$ ${it.subtotal.toFixed(2)}`, colX[3], 11);
    y -= 14;
  }

  const bytes = await pdfDoc.save();
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="orcamento-${id}.pdf"`
    }
  });
}
