// lib/calc.ts (compatível)
import { createClient } from "@/lib/supabase/server";

type ItemDetalhado = {
  id: string;
  codigo: string;
  nome: string;
  quantidade: number;
  custo_unitario: number;
  subtotal: number;
};

export type ResumoDetalhado = {
  itens: ItemDetalhado[];
  total: number;            // custo direto
  bdi: number;              // %
  total_com_bdi: number;    // total + BDI
};

async function custoUnitarioByCompId(composicaoId: string): Promise<number> {
  const supabase = createClient();

  const { data: itens } = await supabase
    .from("composicao_itens")
    .select(`item_type, coeficiente, insumo_id, subcomposicao_id,
             insumos:insumo_id(preco),
             subcomp:subcomposicao_id(id)`)
    .eq("composicao_id", composicaoId);

  if (!itens) return 0;

  let total = 0;
  for (const it of itens as any[]) {
    const coef = Number(it.coeficiente || 0);
    if (it.item_type === "insumo") {
      const preco = Number(it.insumos?.preco || 0);
      total += coef * preco;
    } else if (it.item_type === "composicao" && it.subcomp?.id) {
      const subCost = await custoUnitarioByCompId(it.subcomp.id);
      total += coef * subCost;
    }
  }
  return total;
}

export async function calculateOrcamentoDetalhado(orcamentoId: string): Promise<ResumoDetalhado> {
  const supabase = createClient();

  const { data: orc } = await supabase
    .from("orcamentos")
    .select("bdi")
    .eq("id", orcamentoId)
    .single();
  const bdi = Number(orc?.bdi || 0);

  const { data: itens } = await supabase
    .from("orcamento_itens")
    .select("id, quantidade, composicoes:composicao_id(id, codigo, nome)")
    .eq("orcamento_id", orcamentoId)
    .order("id", { ascending: true });

  const detalhes: ItemDetalhado[] = [];
  for (const row of (itens || []) as any[]) {
    const comp = Array.isArray(row.composicoes) ? row.composicoes[0] : row.composicoes;
    if (!comp?.id) continue;
    const unit = await custoUnitarioByCompId(comp.id);
    const qtd = Number(row.quantidade || 0);
    const subtotal = unit * qtd;

    detalhes.push({
      id: row.id,
      codigo: comp.codigo,
      nome: comp.nome,
      quantidade: qtd,
      custo_unitario: unit,
      subtotal,
    });
  }

  const total = detalhes.reduce((acc, it) => acc + it.subtotal, 0);
  const total_com_bdi = total * (1 + bdi / 100);

  return { itens: detalhes, total, bdi, total_com_bdi };
}

// ===== Compatibilidade com código antigo =====

// Totais simples (mesma assinatura esperada)
export async function calculateOrcamento(orcamentoId: string) {
  const r = await calculateOrcamentoDetalhado(orcamentoId);
  return { total: r.total, bdi: r.bdi, total_com_bdi: r.total_com_bdi };
}

// getOrcamentoDetalhado: retorna orcamento + itensDetalhados
export async function getOrcamentoDetalhado(orcamentoId: string) {
  const supabase = createClient();

  const { data: orcamento } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", orcamentoId)
    .single();

  const r = await calculateOrcamentoDetalhado(orcamentoId);

  // itensDetalhados compatíveis (inclui custoUnitario em camelCase também)
  const itensDetalhados = r.itens.map((i) => ({
    ...i,
    custoUnitario: i.custo_unitario,
  }));

  return { orcamento, itensDetalhados };
}
