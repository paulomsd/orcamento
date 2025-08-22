import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Page({ params }: { params: { id: string } }) {
  // Autenticação
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const id = params.id;

  // Busca do orçamento
  const { data: orcamento } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (!orcamento) {
    return <div>Orçamento não encontrado.</div>;
  }

  // Itens do orçamento
  const { data: itens } = await supabase
    .from("orcamento_itens")
    .select("id, quantidade, composicoes(id, codigo, nome)")
    .eq("orcamento_id", id)
    .order("id", { ascending: true });

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{orcamento.nome}</h1>
        <div className="flex gap-2">
          <Link className="text-sm border rounded-lg px-3 py-2" href="/orcamentos">Voltar</Link>
          <a className="text-sm bg-slate-900 text-white rounded-lg px-3 py-2" href={`/api/orcamentos/${id}/pdf`} target="_blank" rel="noreferrer">Exportar PDF</a>
          <a className="text-sm bg-slate-900 text-white rounded-lg px-3 py-2" href={`/api/orcamentos/${id}/xlsx`} target="_blank" rel="noreferrer">Exportar XLSX</a>
        </div>
      </div>

      <form action="/api/orcamentos" method="POST" className="bg-white p-4 rounded-xl border">
        <input type="hidden" name="action" value="add_item" />
        <input type="hidden" name="orcamento_id" value={id} />
        <div className="grid sm:grid-cols-3 gap-3 items-end">
          <label className="grid gap-1">
            <span className="text-sm">Código da Composição</span>
            <input className="border rounded-lg px-3 py-2" name="codigo" placeholder="ex: 7.1.001" />
          </label>
          <label class
