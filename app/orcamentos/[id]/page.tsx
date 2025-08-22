import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Page({ params }: { params: { id: string } }){
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) redirect("/login");

  const id = params.id;
  const { data: orcamento } = await supabase.from("orcamentos").select("*").eq("id", id).single();
  if(!orcamento) return <div>Orçamento não encontrado.</div>;

  const { data: itens } = await supabase.from("orcamento_itens")
    .select("id, quantidade, composicoes(id, codigo, nome)")
    .eq("orcamento_id", id)
    .order("id");

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{orcamento.nome}</h1>
        <div className="flex gap-2">
          <Link className="text-sm border rounded-lg px-3 py-2" href={`/orcamentos`}>Voltar</Link>
          <a className="text-sm bg-slate-900 text-white rounded-lg px-3 py-2" href={`/api/orcamentos/${id}/pdf`} target="_blank">Exportar PDF</a>
          <a className="text-sm bg-slate-900 text-white rounded-lg px-3 py-2" href={`/api/orcamentos/${id}/xlsx`} target="_blank">Exportar XLSX</a>
        </div>
      </div>

      <form action={`/api/orcamentos`} method="POST" className="bg-white p-4 rounded-xl border">
        <input type="hidden" name="action" value="add_item" />
        <input type="hidden" name="orcamento_id" value={id} />
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <label className="grid gap-1">
            <span className="text-sm">Código da Composição</span>
            <input className="border rounded-lg px-3 py-2" name="codigo" placeholder="ex: 7.1.001"/>
          </label>
          <label className="grid gap-1">
            <span className="text-sm">Quantidade</span>
            <input className="border rounded-lg px-3 py-2" type="number" step="0.01" name="quantidade" defaultValue="1"/>
          </label>
          <button className="bg-slate-900 text-white rounded-lg py-2">Adicionar item</button>
        </div>
      </form>

      <div className="bg-white rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-2">Composição</th>
              <th className="text-right p-2">Qtd</th>
            </tr>
          </thead>
          <tbody>
            {itens?.map((i)=>(
              <tr key={i.id} className="border-t">
                <td className="p-2">{i.composicoes?.codigo} - {i.composicoes?.nome}</td>
                <td className="p-2 text-right">{i.quantidade}</td>
              </tr>
            ))}
            {!itens?.length && (
              <tr><td colSpan={2} className="p-4 text-slate-500">Nenhum item ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Resumo id={id}/>
    </div>
  );
}

async function Resumo({ id }: { id: string }){
  const supabase = createClient();
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/orcamentos/${id}/resumo`, { cache: "no-store" }).catch(()=>null);
  const data = res ? await res.json() : { total: 0, bdi: 0, total_com_bdi: 0 };
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="text-sm text-slate-500 mb-2">Resumo</div>
      <div className="text-sm">Custo direto: <b>R$ {data.total.toFixed(2)}</b></div>
      <div className="text-sm">BDI: <b>{data.bdi}%</b></div>
      <div className="text-lg mt-2">Total: <b>R$ {data.total_com_bdi.toFixed(2)}</b></div>
    </div>
  );
}
