import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { calculateOrcamento, getOrcamentoDetalhado } from "@/lib/calc";

export async function GET(_: Request, { params }: { params: { id: string }}){
  const { orcamento, itensDetalhados } = await getOrcamentoDetalhado(params.id);
  const { total, total_com_bdi } = await calculateOrcamento(params.id);

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Orçamento");

  ws.columns = [
    { header: "Código", key: "codigo", width: 18 },
    { header: "Composição", key: "nome", width: 60 },
    { header: "Quantidade", key: "quantidade", width: 14 },
    { header: "Unitário (R$)", key: "unitario", width: 16 },
    { header: "Total (R$)", key: "total", width: 16 },
  ];

  itensDetalhados.forEach(i=> ws.addRow({
    codigo: i.codigo, nome: i.nome, quantidade: i.quantidade,
    unitario: i.unitario, total: i.total
  }));

  ws.addRow({});
  ws.addRow({ nome: "Custo direto", total: total });
  ws.addRow({ nome: "BDI (%)", quantidade: orcamento.bdi ?? 0 });
  ws.addRow({ nome: "TOTAL", total: total_com_bdi });

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="orcamento-${params.id}.xlsx"`
    }
  });
}
