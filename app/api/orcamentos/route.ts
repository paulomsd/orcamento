import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const form = await request.formData();
  const action = String(form.get("action") || "");

  try {
    if (action === "create_orcamento") {
      const nome = String(form.get("nome") || "").trim();
      const uf = String(form.get("uf") || "").trim() || null;
      const bdiStr = String(form.get("bdi") || "0");
      const bdi = Number(bdiStr || 0);

      if (!nome) {
        return NextResponse.json({ ok: false, error: "Nome é obrigatório." }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("orcamentos")
        .insert([{ user_id: user.id, nome, uf, bdi }])
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
      }

      // Redireciona para a página do orçamento recém-criado
      return NextResponse.redirect(new URL(`/orcamentos/${data!.id}`, request.url), { status: 303 });
    }

    if (action === "add_item") {
      const orcamento_id = String(form.get("orcamento_id") || "");
      const codigo = String(form.get("codigo") || "").trim();
      const quantidade = Number(String(form.get("quantidade") || "1"));

      if (!orcamento_id) {
        return NextResponse.json({ ok: false, error: "orcamento_id ausente." }, { status: 400 });
      }
      if (!codigo) {
        return NextResponse.json({ ok: false, error: "Informe o código da composição." }, { status: 400 });
      }

      // busca a composicao pelo codigo
      const { data: comp, error: compErr } = await supabase
        .from("composicoes")
        .select("id")
        .eq("codigo", codigo)
        .single();

      if (compErr || !comp) {
        return NextResponse.json({ ok: false, error: "Composição não encontrada para o código informado." }, { status: 404 });
      }

      const { error: insErr } = await supabase
        .from("orcamento_itens")
        .insert([{ orcamento_id, composicao_id: comp.id, quantidade }]);

      if (insErr) {
        return NextResponse.json({ ok: false, error: insErr.message }, { status: 400 });
      }

      return NextResponse.redirect(new URL(`/orcamentos/${orcamento_id}`, request.url), { status: 303 });
    }

    return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Erro inesperado." }, { status: 500 });
  }
}
