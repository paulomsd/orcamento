import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OrcamentosPage(){
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) redirect("/login");

  const { data: orcamentos } = await supabase.from("orcamentos")
    .select("id, nome, uf, data_base, bdi, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Meus Orçamentos</h1>
        <Link className="bg-slate-900 text-white rounded-lg px-3 py-2 text-sm" href="/orcamentos/new">Novo Orçamento</Link>
      </div>
      <div className="grid gap-3">
        {orcamentos?.map((o)=>(
          <Link key={o.id} href={`/orcamentos/${o.id}`} className="block border bg-white p-4 rounded-xl hover:shadow">
            <div className="font-medium">{o.nome}</div>
            <div className="text-xs text-slate-500">UF {o.uf} • Data-base {o.data_base ?? "-"} • BDI {o.bdi ?? 0}%</div>
          </Link>
        ))}
        {(!orcamentos || orcamentos.length===0) && (
          <div className="text-slate-600">Nenhum orçamento ainda. Clique em <b>Novo Orçamento</b> para começar.</div>
        )}
      </div>
    </div>
  );
}
