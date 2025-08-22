import { createClient } from "@/lib/supabase/server";

type Insumo = { id: string, codigo: string, descricao: string, unidade: string, preco: number };
type Composicao = { id: string, codigo: string, nome: string };
type ComposicaoItem = { id: string, item_type: "insumo"|"composicao", coeficiente: number, insumo_id?: string|null, subcomposicao_id?: string|null };

export async function calculateOrcamento(orcamentoId: string){
  const supabase = createClient();

  const { data: orcamento } = await supabase.from("orcamentos").select("*").eq("id", orcamentoId).single();
  if(!orcamento) return { total: 0, bdi: 0, total_com_bdi: 0 };

  const { data: itens } = await supabase.from("orcamento_itens")
    .select("id, quantidade, composicao_id")
    .eq("orcamento_id", orcamentoId);

  const cache = new Map<string, number>(); // composicao_id -> custo unitário

  async function custoComposicaoUnitario(composicao_id: string): Promise<number>{
    if(cache.has(composicao_id)) return cache.get(composicao_id)!;
    const { data: items } = await supabase.from("composicao_itens")
      .select("id, item_type, coeficiente, insumo_id, subcomposicao_id")
      .eq("composicao_id", composicao_id);

    let total = 0;
    for(const it of (items ?? []) as ComposicaoItem[]){
      if(it.item_type === "insumo" && it.insumo_id){
        const { data: insumo } = await supabase.from("insumos").select("preco").eq("id", it.insumo_id).single();
        total += (insumo?.preco ?? 0) * it.coeficiente;
      }else if(it.item_type === "composicao" && it.subcomposicao_id){
        const sub = await custoComposicaoUnitario(it.subcomposicao_id);
        total += sub * it.coeficiente;
      }
    }
    cache.set(composicao_id, total);
    return total;
  }

  let total = 0;
  for(const it of (itens ?? [])){
    const unit = await custoComposicaoUnitario(it.composicao_id);
    total += unit * Number(it.quantidade);
  }

  const bdi = Number(orcamento.bdi ?? 0);
  const total_com_bdi = total * (1 + bdi/100);
  return { total, bdi, total_com_bdi };
}

export async function getOrcamentoDetalhado(orcamentoId: string){
  const supabase = createClient();
  const { data: orcamento } = await supabase.from("orcamentos").select("*").eq("id", orcamentoId).single();
  const { data: itens } = await supabase.from("orcamento_itens")
    .select("id, quantidade, composicoes(id, codigo, nome)")
    .eq("orcamento_id", orcamentoId);

  const { total } = await calculateOrcamento(orcamentoId);

  // para cada item, calcula custo unitário
  const itensDetalhados: { codigo: string, nome: string, quantidade: number, unitario: number, total: number }[] = [];
  async function custoUnitarioByCompId(id: string){ return (await calculateComposicaoUnitario(id)); }

  const unitCache = new Map<string, number>();
  async function calculateComposicaoUnitario(composicao_id: string): Promise<number>{
    if(unitCache.has(composicao_id)) return unitCache.get(composicao_id)!;
    const { data: items } = await supabase.from("composicao_itens")
      .select("id, item_type, coeficiente, insumo_id, subcomposicao_id")
      .eq("composicao_id", composicao_id);
    let total = 0;
    for(const it of (items ?? []) as any[]){
      if(it.item_type === "insumo" && it.insumo_id){
        const { data: insumo } = await supabase.from("insumos").select("preco").eq("id", it.insumo_id).single();
        total += (insumo?.preco ?? 0) * it.coeficiente;
      }else if(it.item_type === "composicao" && it.subcomposicao_id){
        const sub = await calculateComposicaoUnitario(it.subcomposicao_id);
        total += sub * it.coeficiente;
      }
    }
    unitCache.set(composicao_id, total);
    return total;
  }

  for(const it of (itens ?? [])){
    const unit = await custoUnitarioByCompId(it.composicoes.id);
    itensDetalhados.push({
      codigo: it.composicoes.codigo,
      nome: it.composicoes.nome,
      quantidade: Number(it.quantidade),
      unitario: unit,
      total: unit * Number(it.quantidade)
    });
  }

  return { orcamento: orcamento!, itensDetalhados };
}
