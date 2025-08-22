import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
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

  // Use 'any' to keep things simple for TS here
  const rows: any[] = resumo.itens.map(i => ({
    Composicao: `${i.codigo} - ${i.nome}`,
    Unitario: Number(i.custo_unitario.toFixed(2)),
    Quantidade: i.quantidade,
    Subtotal: Number(i.subtotal.toFixed(2)),
  }));

  // Rodapé como strings para evitar conflito de tipos
  rows.push({ Composicao: "", Unitario: "", Quantidade: "Custo direto", Subtotal: Number(resumo.total.toFixed(2)) });
  rows.push({ Composicao: "", Unitario: "", Quantidade: "BDI (%)", Subtotal: Number(resumo.bdi.toFixed ? resumo.bdi.toFixed(2) : resumo.bdi) });
  rows.push({ Composicao: "", Unitario: "", Quantidade: "Total", Subtotal: Number(resumo.total_com_bdi.toFixed(2)) });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows, { header: ["Composicao", "Unitario", "Quantidade", "Subtotal"] });
  XLSX.utils.book_append_sheet(wb, ws, "Orcamento");

  const out = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(Buffer.from(out), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="orcamento-${id}.xlsx"`
    }
  });
}
