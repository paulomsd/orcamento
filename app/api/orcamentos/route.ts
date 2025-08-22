import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateOrcamento } from "@/lib/calc";

export async function GET(req: NextRequest){
  // Lista orçamentos do usuário logado
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await supabase.from("orcamentos")
    .select("id, nome, uf, data_base, bdi")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest){
  const supabase = createClient();
  const formContentType = req.headers.get("content-type") || "";
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Suporta JSON (criar orçamento) e form-urlencoded (adicionar item)
  if(formContentType.includes("application/json")){
    const body = await req.json();
    const { nome, uf, data_base, bdi } = body;
    const { data, error } = await supabase.from("orcamentos").insert({
      user_id: user.id, nome, uf, data_base, bdi
    }).select("id").single();
    if(error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ id: data.id });
  }

  if(formContentType.includes("application/x-www-form-urlencoded")){
    const form = await req.formData();
    const action = form.get("action");
    if(action === "add_item"){
      const orcamento_id = String(form.get("orcamento_id")||"");
      const codigo = String(form.get("codigo")||"").trim();
      const quantidade = parseFloat(String(form.get("quantidade")||"1"));
      // Busca composição pelo código
      const { data: comp } = await supabase.from("composicoes").select("id").eq("codigo", codigo).single();
      if(!comp) return NextResponse.redirect(new URL(req.url).origin + `/orcamentos/${orcamento_id}`);
      await supabase.from("orcamento_itens").insert({ orcamento_id, composicao_id: comp.id, quantidade });
      return NextResponse.redirect(new URL(req.url).origin + `/orcamentos/${orcamento_id}`);
    }
  }

  return NextResponse.json({ ok: true });
}
