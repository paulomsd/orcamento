import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { calculateOrcamento } from "@/lib/calc";

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = params.id;

  // Dados do orçamento
  const { data: orcamento } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (!orcamento) {
    return <div className="p-4">Orçamento não encontrado.</div>;
  }

  // Itens do orçamento
  const { data: itens } = await supabase
    .from("orcamento_itens")
    .select("id, quantidade, composicoes(id, codigo, nome)")
    .eq("orcamento_id", id)
    .order("id", { ascending: true });

  // Resumo calculado (custo direto, BDI, total)
  const { total, bdi, total_com_bdi } = await calculateOrcamento(id);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{orcamento.nome}</h1>
        <div className="flex gap-2">
          <Link className="text-sm border rounded-lg px-3 py-2" href="/orcamentos">
            Voltar
          </Link>
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-white rounded-xl border p-4">
        <div className="text-sm text-slate-500 mb-2">Resumo</div>
        <div className="text-sm">Custo direto: <b>R$ {Number(total || 0).toFixed(2)}</b></div>
        <div className="text-sm">BDI: <b>{Number(bdi || 0)}%</b></div>
        <div className="text-lg mt-2">Total: <b>R$ {Number(total_com_bdi || 0).toFixed(2)}</b></div>
      </div>

      {/* Adicionar item */}
      <form action="/api/orcamentos" method="POST" className="bg-white p-4 rounded-xl border">
        <input type="hidden" name="action" value="add_item" />
        <input type="hidden" name="orcamento_id" value={id} />
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <label className="grid gap-1">
            <span className="text-sm">Código da Composição</span>
            <input className="border rounded-lg px-3 py-2" name="codigo" placeholder="ex: 7.1.001" />
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Quantidade</span>
            <input className="border rounded-lg px-3 py-2" type="number" step="0.01" name="quantidade" defaultValue="1" />
          </label>
          <button className="bg-slate-900 text-white rounded-lg py-2">Adicionar item</button>
        </div>
      </form>

      {/* Tabela de itens */}
      <div className="bg-white rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-2">Composição</th>
              <th className="text-right p-2">Qtd</th>
            </tr>
          </thead>
          <tbody>
            {itens?.map((i: any) => {
              const comp = Array.isArray(i.composicoes) ? i.composicoes[0] : i.composicoes;
              return (
                <tr key={i.id} className="border-t">
                  <td className="p-2">{comp?.codigo} - {comp?.nome}</td>
                  <td className="p-2 text-right">{Number(i.quantidade)}</td>
                </tr>
              );
            })}
            {!itens?.length && (
              <tr>
                <td colSpan={2} className="p-4 text-slate-500">Nenhum item ainda.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
