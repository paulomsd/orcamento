import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page(){
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) redirect("/login");

  const { data: insumos } = await supabase.from("insumos")
    .select("*")
    .order("codigo");

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Insumos</h1>
      <form action="/api/insumos" method="POST" className="bg-white p-4 rounded-xl border grid sm:grid-cols-5 gap-3 items-end">
        <label className="grid gap-1">
          <span className="text-sm">Código</span>
          <input name="codigo" className="border rounded-lg px-3 py-2" required />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm">Descrição</span>
          <input name="descricao" className="border rounded-lg px-3 py-2" required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Unidade</span>
          <input name="unidade" className="border rounded-lg px-3 py-2" required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">Preço (R$)</span>
          <input name="preco" type="number" step="0.0001" className="border rounded-lg px-3 py-2" required />
        </label>
        <button className="bg-slate-900 text-white rounded-lg py-2">Adicionar</button>
      </form>

      <div className="bg-white rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-2">Código</th>
              <th className="text-left p-2">Descrição</th>
              <th className="text-right p-2">Unidade</th>
              <th className="text-right p-2">Preço (R$)</th>
            </tr>
          </thead>
          <tbody>
            {insumos?.map((i:any)=>(
              <tr key={i.id} className="border-t">
                <td className="p-2">{i.codigo}</td>
                <td className="p-2">{i.descricao}</td>
                <td className="p-2 text-right">{i.unidade}</td>
                <td className="p-2 text-right">{Number(i.preco).toFixed(4)}</td>
              </tr>
            ))}
            {!insumos?.length && (<tr><td colSpan={4} className="p-4 text-slate-500">Sem insumos cadastrados</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
