import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { calculateOrcamento, getOrcamentoDetalhado } from "@/lib/calc";

export async function GET(_: Request, { params }: { params: { id: string }}){
  const { orcamento, itensDetalhados } = await getOrcamentoDetalhado(params.id);
  const { total, total_com_bdi } = await calculateOrcamento(params.id);

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (c)=>chunks.push(c));
  const streamEnd = new Promise<Buffer>((resolve)=>{
    doc.on("end", ()=> resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(16).text(`Orçamento: ${orcamento.nome}`);
  doc.moveDown(0.5);
  doc.fontSize(10).text(`UF: ${orcamento.uf}  •  Data-base: ${orcamento.data_base ?? "-"}`);
  doc.moveDown();

  doc.fontSize(12).text("Itens:");
  doc.moveDown(0.5);
  itensDetalhados.forEach((item)=>{
    doc.fontSize(10).text(`${item.codigo} - ${item.nome}`);
    doc.text(`Qtd: ${item.quantidade}  •  Unitário: R$ ${item.unitario.toFixed(2)}  •  Total: R$ ${(item.total).toFixed(2)}`);
    doc.moveDown(0.3);
  });

  doc.moveDown();
  doc.fontSize(12).text(`Custo direto: R$ ${total.toFixed(2)}`);
  doc.fontSize(12).text(`BDI: ${orcamento.bdi ?? 0}%`);
  doc.fontSize(14).text(`TOTAL: R$ ${total_com_bdi.toFixed(2)}`, { underline: true });

  doc.end();
  const buf = await streamEnd;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="orcamento-${params.id}.pdf"`
    }
  });
}
