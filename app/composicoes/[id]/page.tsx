import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: { id: string }}){
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) redirect("/login");

  const { data: comp } = await supabase.from("composicoes").select("*").eq("id", params.id).single();
  if(!comp) return <div>Composição não encontrada.</div>;
  const { data: itens } = await supabase.from("composicao_itens")
    .select("id, item_type, coeficiente, insumo_id, subcomposicao_id, insumos(codigo,descricao), composicoes!composicao_itens_subcomposicao_id_fkey(codigo,nome)")
    .eq("composicao_id", params.id);

  const { data: insumos } = await supabase.from("insumos").select("id, codigo, descricao").order("codigo");
  const { data: comps } = await supabase.from("composicoes").select("id, codigo, nome").order("codigo");

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Itens da Composição: {comp.codigo} - {comp.nome}</h1>

      <form action={`/api/composicoes/${params.id}/itens`} method="POST" className="bg-white p-4 rounded-xl border grid sm:grid-cols-4 gap-3 items-end">
        <input type="hidden" name="composicao_id" value={params.id}/>
        <label className="grid gap-1">
          <span className="text-sm">Tipo</span>
          <select name="item_type" className="border rounded-lg px-3 py-2">
            <option value="insumo">Insumo</option>
            <option value="composicao">Subcomposição</option>
          </select>
        </label>
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm">Item</span>
          <select name="item_id" className="border rounded-lg px-3 py-2">
            {insumos?.map((i:any)=>(<option key={i.id} value={i.id}>[I] {i.codigo} - {i.descricao}</option>))}
            {comps?.map((c:any)=>(<option key={c.id} value={c.id}>[C] {c.codigo} - {c.nome}</option>))}
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Coeficiente</span>
          <input name="coeficiente" type="number" step="0.0001" className="border rounded-lg px-3 py-2" defaultValue="1" />
        </label>
        <button className="bg-slate-900 text-white rounded-lg py-2">Adicionar</button>
      </form>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Item</th>
              <th className="text-right p-2">Coeficiente</th>
            </tr>
          </thead>
          <tbody>
            {itens?.map((it:any)=>(
              <tr key={it.id} className="border-t">
                <td className="p-2">{it.item_type}</td>
                <td className="p-2">
                  {it.item_type === "insumo"
                    ? `${it.insumos?.codigo} - ${it.insumos?.descricao}`
                    : `${it.composicoes?.codigo} - ${it.composicoes?.nome}`}
                </td>
                <td className="p-2 text-right">{Number(it.coeficiente).toFixed(4)}</td>
              </tr>
            ))}
            {!itens?.length && (<tr><td colSpan={3} className="p-4 text-slate-500">Sem itens ainda</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
