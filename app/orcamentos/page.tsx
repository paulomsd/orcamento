import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DeleteOrcamentoButton from "./DeleteButton";

export default async function Page() {
  const supabase = createClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr) {
    return <div className="text-red-600">Erro de autenticação.</div>;
  }
  if (!user) redirect("/login");

  const { data: rows, error } = await supabase
    .from("orcamentos")
    .select("id, nome, bdi, uf, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
        Erro ao carregar seus orçamentos: {error.message}
      </div>
    );
  }

  const estados = [
    "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT",
    "MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO",
    "RR","SC","SP","SE","TO"
  ];

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-semibold">Orçamentos</h1>

      <form action="/api/orcamentos" method="POST" className="bg-white p-4 rounded-xl border grid gap-3 sm:grid-cols-4 items-end">
        <input type="hidden" name="action" value="create_orcamento" />

        <label className="grid gap-1 sm:col-span-2">
          <span className="text-sm">Nome do orçamento</span>
          <input
            className="border rounded-lg px-3 py-2"
            name="nome"
            placeholder="Ex.: Reforma da cozinha"
            required
          />
        </label>

        <label className="grid gap-1">
          <span className="text-sm">UF</span>
          <select name="uf" className="border rounded-lg px-3 py-2">
            <option value="">Selecione</option>
            {estados.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1">
          <span className="text-sm">BDI (%)</span>
          <input
            className="border rounded-lg px-3 py-2"
            type="number"
            step="0.01"
            name="bdi"
            defaultValue="0"
          />
        </label>

        <button className="sm:col-span-4 bg-slate-900 text-white rounded-lg py-2">
          Criar orçamento
        </button>
      </form>

      <div className="bg-white rounded-xl border">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left p-2">Nome</th>
              <th className="text-center p-2">UF</th>
              <th className="text-right p-2">BDI</th>
              <th className="p-2 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows?.map((o: any) => (
              <tr key={o.id} className="border-t">
                <td className="p-2">{o.nome}</td>
                <td className="p-2 text-center">{o.uf || "-"}</td>
                <td className="p-2 text-right">{Number(o.bdi || 0)}%</td>
                <td className="p-2 text-right">
                  <div className="flex gap-3 justify-end">
                    <a className="text-blue-600 underline" href={`/orcamentos/${o.id}`}>Abrir</a>
                    <DeleteOrcamentoButton id={o.id} />
                  </div>
                </td>
              </tr>
            ))}
            {!rows?.length and (
              <tr>
                <td className="p-4 text-slate-500" colSpan={4}>
                  Nenhum orçamento ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
