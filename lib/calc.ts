import { createClient } from "@/lib/supabase/server";

type Insumo = { id: string, codigo: string, descricao: string, unidade: string, preco: number };
type Composicao = { id: string, codigo: string, nome: string };
type ComposicaoItem = {
  id: string;
  composicao_id: string;
  item_type: "insumo" | "composicao";
  insumo_id?: string | null;
  subcomposicao_id?: string | null;
  coeficiente: number;
};

/**
 * Calcula o total do orçamento (custo direto) e aplica BDI.
 */
export async function calculateOrcamento(orcamentoId: string) {
  const supabase = createClient();

  const { data: orcamento } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", orcamentoId)
    .single();
  if (!orcamento) return { total: 0, bdi: 0, total_com_bdi: 0 };

  const { data: itens } = await supabase
    .from("orcamento_itens")
    .select("id, quantidade, composicao_id")
    .eq("orcamento_id", orcamentoId);

  const cache = new Map<string, number>(); // composicao_id -> custo unitário

  async function custoComposicaoUnitario(composicao_id: string): Promise<number> {
    if (cache.has(composicao_id)) return cache.get(composicao_id)!;

    const { data: items } = await supabase
      .from("composicao_itens")
      .select("id, item_type, coeficiente, insumo_id, subcomposicao_id")
      .eq("composicao_id", composicao_id);

    let total = 0;
    for (const it of (items ?? []) as ComposicaoItem[]) {
      if (it.item_type === "insumo" && it.insumo_id) {
        const { data: insumo } = await supabase
          .from("insumos")
          .select("preco")
          .eq("id", it.insumo_id)
          .single();
        total += (Number(insumo?.preco) || 0) * Number(it.coeficiente || 0);
      } else if (it.item_type === "composicao" && it.subcomposicao_id) {
        const sub = await custoComposicaoUnitario(it.subcomposicao_id);
        total += sub * Number(it.coeficiente || 0);
      }
    }

    cache.set(composicao_id, total);
    return total;
  }

  let total = 0;
  for (const it of (itens ?? [])) {
    const unit = await custoComposicaoUnitario(String(it.composicao_id));
    total += unit * Number(it.quantidade || 0);
  }

  const bdi = Number(orcamento.bdi ?? 0);
  const total_com_bdi = total * (1 + bdi / 100);
  return { total, bdi, total_com_bdi };
}

/**
 * Retorna orçamento + itens detalhados (código, nome, qtd, unitário, total)
 * Lidando com o caso em que `composicoes` pode vir como objeto OU array.
 */
export async function getOrcamentoDetalhado(orcamentoId: string) {
  const supabase = createClient();

  const { data: orcamento } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", orcamentoId)
    .single();

  const { data: itens } = await supabase
    .from("orcamento_itens")
    .select("id, quantidade, composicoes(id, codigo, nome)")
    .eq("orcamento_id", orcamentoId);

  // Função auxiliar: resolve composicao (objeto ou array)
  function resolveComp(raw: any): Composicao | undefined {
    if (!raw) return undefined;
    return Array.isArray(raw) ? raw[0] : raw;
  }

  // Cache p/ custo unitário
  const unitCache = new Map<string, number>();
  async function calculateComposicaoUnitario(composicao_id: string): Promise<number> {
    if (unitCache.has(composicao_id)) return unitCache.get(composicao_id)!;

    const { data: items } = await supabase
      .from("composicao_itens")
      .select("id, item_type, coeficiente, insumo_id, subcomposicao_id")
      .eq("composicao_id", composicao_id);

    let total = 0;
    for (const it of (items ?? []) as ComposicaoItem[]) {
      if (it.item_type === "insumo" && it.insumo_id) {
        const { data: insumo } = await supabase
          .from("insumos")
          .select("preco")
          .eq("id", it.insumo_id)
          .single();
        total += (Number(insumo?.preco) || 0) * Number(it.coeficiente || 0);
      } else if (it.item_type === "composicao" && it.subcomposicao_id) {
        const sub = await calculateComposicaoUnitario(it.subcomposicao_id);
        total += sub * Number(it.coeficiente || 0);
      }
    }

    unitCache.set(composicao_id, total);
    return total;
  }

  const itensDetalhados: {
    codigo: string;
    nome: string;
    quantidade: number;
    unitario: number;
    total: number;
  }[] = [];

  for (const it of (itens ?? [])) {
    const comp = resolveComp((it as any).composicoes);
    if (!comp?.id) continue;

    const unit = await calculateComposicaoUnitario(String(comp.id));
    const qtd = Number((it as any).quantidade || 0);

    itensDetalhados.push({
      codigo: String(comp.codigo ?? ""),
      nome: String(comp.nome ?? ""),
      quantidade: qtd,
      unitario: unit,
      total: unit * qtd,
    });
  }

  // Também devolvemos o total para quem quiser usar
  const { total } = await calculateOrcamento(orcamentoId);

  return { orcamento: orcamento!, itensDetalhados, total };
}
