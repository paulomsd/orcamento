// lib/calc.ts
// Cálculos do orçamento com detalhamento por item.
// Observação: executa no servidor (usa o client server-side do Supabase).

import { createClient } from "@/lib/supabase/server";

type ItemDetalhado = {
  id: string;
  codigo: string;
  nome: string;
  quantidade: number;
  custo_unitario: number;   // custo por 1 unidade da composição
  subtotal: number;         // quantidade * custo_unitario
};

export type ResumoDetalhado = {
  itens: ItemDetalhado[];
  total: number;            // custo direto (sem BDI)
  bdi: number;              // %
  total_com_bdi: number;    // total + BDI
};

/**
 * Retorna o custo unitário (1 unidade) de uma composição pelo ID.
 * Soma insumos e subcomposições recursivamente.
 */
async function custoUnitarioByCompId(composicaoId: string): Promise<number> {
  const supabase = createClient();

  // Busca itens da composição
  const { data: itens, error } = await supabase
    .from("composicao_itens")
    .select(`id, item_type, coeficiente, insumo_id, subcomposicao_id,
             insumos:insumo_id(preco),
             subcomp:subcomposicao_id(id)`)
    .eq("composicao_id", composicaoId);

  if (error || !itens) return 0;

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

/**
 * Calcula o resumo detalhado do orçamento:
 * - Para cada item: custo_unitario e subtotal
 * - Totais: custo direto, BDI, total com BDI
 */
export async function calculateOrcamentoDetalhado(orcamentoId: string): Promise<ResumoDetalhado> {
  const supabase = createClient();

  // Orçamento (para obter BDI)
  const { data: orc } = await supabase
    .from("orcamentos")
    .select("bdi")
    .eq("id", orcamentoId)
    .single();

  const bdi = Number(orc?.bdi || 0);

  // Itens do orçamento com dados da composição
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

  return {
    itens: detalhes,
    total,
    bdi,
    total_com_bdi,
  };
}
