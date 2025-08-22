import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { calculateOrcamentoDetalhado } from "@/lib/calc";
import DeleteItemButton from "./DeleteItem";

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const id = params.id;

  const { data: orcamento } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (!orcamento) {
    return <div className="p-4">Orçamento não encontrado.</div>;
  }

  const resumo = await calculateOrcamentoDetalhado(id);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{orcamento.nome}</h1>
        <div className="flex gap-2">
          <Link className="text-sm border rounded-lg px-3 py-2" href="/orcamentos">
            Voltar
          </Link>
          <a className="text-sm bg-slate-900 text-white rounded-lg px-3 py-2" href={`/api/orcamentos/${id}/pdf`}>
            Exportar PDF
          </a>
          <a className="text-sm bg-slate-900 text-white rounded-lg px-3 py-2" href={`/api/orcamentos/${id}/xlsx`}>
            Exportar XLSX
          </a>
        </div>
      </div>

      {/* Form adicionar item */}
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

      {/* Tabela detalhada */}
      <div className="bg-white rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-2">Composição</th>
              <th className="text-right p-2">Unitário</th>
              <th className="text-right p-2">Qtd</th>
              <th className="text-right p-2">Subtotal</th>
              <th className="text-right p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {resumo.itens.map((i) => (
              <tr key={i.id} className="border-t">
                <td className="p-2">{i.codigo} - {i.nome}</td>
                <td className="p-2 text-right">R$ {i.custo_unitario.toFixed(2)}</td>
                <td className="p-2 text-right">{i.quantidade}</td>
                <td className="p-2 text-right">R$ {i.subtotal.toFixed(2)}</td>
                <td className="p-2 text-right">
                  <DeleteItemButton itemId={i.id} orcamentoId={id} />
                </td>
              </tr>
            ))}
            {!resumo.itens.length && (
              <tr>
                <td colSpan={5} className="p-4 text-slate-500">Nenhum item ainda.</td>
              </tr>
            )}
          </tbody>
          {resumo.itens.length > 0 && (
            <tfoot>
              <tr className="border-t bg-slate-50 font-medium">
                <td className="p-2 text-right" colSpan={4}>Custo direto</td>
                <td className="p-2 text-right">R$ {resumo.total.toFixed(2)}</td>
              </tr>
              <tr className="border-t">
                <td className="p-2 text-right" colSpan={4}>BDI</td>
                <td className="p-2 text-right">{resumo.bdi}%</td>
              </tr>
              <tr className="border-t bg-slate-100 font-semibold">
                <td className="p-2 text-right" colSpan={4}>Total</td>
                <td className="p-2 text-right">R$ {resumo.total_com_bdi.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Card Resumo */}
      <div className="bg-white rounded-xl border p-4">
        <h2 className="text-base font-medium mb-2">Resumo</h2>
        <div className="grid gap-2">
          <div>Custo direto: <span className="font-semibold">R$ {resumo.total.toFixed(2)}</span></div>
          <div>BDI: <span className="font-semibold">{resumo.bdi}%</span></div>
          <div className="text-lg">Total: <span className="font-bold">R$ {resumo.total_com_bdi.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}
