import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page(){
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) redirect("/login");

  const { data: composicoes } = await supabase.from("composicoes")
    .select("id, codigo, nome")
    .order("codigo");

  return (
    <div className="grid gap-4">
      <h1 className="text-xl font-semibold">Composições</h1>

      <form action="/api/composicoes" method="POST" className="bg-white p-4 rounded-xl border grid sm:grid-cols-3 gap-3 items-end">
        <label className="grid gap-1">
          <span className="text-sm">Código</span>
          <input name="codigo" className="border rounded-lg px-3 py-2" required />
        </label>
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm">Nome</span>
          <input name="nome" className="border rounded-lg px-3 py-2" required />
        </label>
        <button className="bg-slate-900 text-white rounded-lg py-2">Adicionar</button>
      </form>

      <div className="bg-white rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-2">Código</th>
              <th className="text-left p-2">Nome</th>
              <th className="text-right p-2">Itens</th>
            </tr>
          </thead>
          <tbody>
            {composicoes?.map((c:any)=>(
              <tr key={c.id} className="border-t">
                <td className="p-2">{c.codigo}</td>
                <td className="p-2">{c.nome}</td>
                <td className="p-2 text-right">
                  <Link href={`/composicoes/${c.id}`} className="text-slate-700 underline">Editar Itens</Link>
                </td>
              </tr>
            ))}
            {!composicoes?.length && (<tr><td colSpan={3} className="p-4 text-slate-500">Sem composições</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
