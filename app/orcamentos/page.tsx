import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("orcamentos")
    .select("id, nome, bdi")
    .order("created_at", { ascending: false });

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">Orçamentos</h1>

      <form action="/api/orcamentos" method="POST" className="bg-white p-4 rounded-xl border grid gap-3 sm:grid-cols-4 items-end">
        <input type="hidden" name="action" value="create_orcamento" />
        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm">Nome do orçamento</span>
          <input className="border rounded-lg px-3 py-2" name="nome" placeholder="Ex.: Reforma da cozinha" required />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">UF</span>
          <input className="border rounded-lg px-3 py-2" name="uf" placeholder="Ex.: SP" />
        </label>
        <label className="grid gap-1">
          <span className="text-sm">BDI (%)</span>
          <input className="border rounded-lg px-3 py-2" type="number" step="0.01" name="bdi" defaultValue="0" />
        </label>
        <button className="sm:col-span-4 bg-slate-900 text-white rounded-lg py-2">Criar orçamento</button>
      </form>

      <div className="bg-white rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-2">Nome</th>
              <th className="text-right p-2">BDI</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((o: any) => (
              <tr key={o.id} className="border-t">
                <td className="p-2">{o.nome}</td>
                <td className="p-2 text-right">{Number(o.bdi || 0)}%</td>
                <td className="p-2 text-right">
                  <Link className="text-blue-600 underline" href={`/orcamentos/${o.id}`}>Abrir</Link>
                </td>
              </tr>
            ))}
            {!rows?.length && (
              <tr><td className="p-4 text-slate-500" colSpan={3}>Nenhum orçamento ainda.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
