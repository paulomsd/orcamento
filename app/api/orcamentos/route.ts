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
      const nomeRaw = String(form.get("nome") || "").trim();
      const nome = nomeRaw;
      const uf = String(form.get("uf") || "").trim() || null;
      const bdiStr = String(form.get("bdi") || "0");
      const bdi = Number(bdiStr || 0);

      if (!nome) {
        const u = new URL("/orcamentos?error=Informe%20o%20nome%20do%20or%C3%A7amento", request.url);
        return NextResponse.redirect(u, { status: 303 });
      }

      // Tenta inserir; se houver duplicidade, tratamos e avisamos
      const { data, error } = await supabase
        .from("orcamentos")
        .insert([{ user_id: user.id, nome, uf, bdi }])
        .select("id")
        .single();

      if (error) {
        // Código de duplicidade costuma ser 23505 no Postgres
        const msg = encodeURIComponent(
          error.code === "23505"
            ? "Já existe um orçamento com esse nome."
            : (error.message || "Não foi possível criar o orçamento.")
        );
        const u = new URL(`/orcamentos?error=${msg}`, request.url);
        return NextResponse.redirect(u, { status: 303 });
      }

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

      const { data: comp } = await supabase
        .from("composicoes")
        .select("id")
        .eq("codigo", codigo)
        .single();

      if (!comp) {
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

    if (action === "delete_orcamento") {
      const id = String(form.get("id") || "");
      if (!id) {
        return NextResponse.json({ ok: false, error: "ID ausente." }, { status: 400 });
      }

      await supabase.from("orcamento_itens").delete().eq("orcamento_id", id);
      const { error } = await supabase.from("orcamentos").delete().eq("id", id);
      if (error) {
        const u = new URL(`/orcamentos?error=${encodeURIComponent(error.message)}`, request.url);
        return NextResponse.redirect(u, { status: 303 });
      }

      return NextResponse.redirect(new URL("/orcamentos", request.url), { status: 303 });
    }

    return NextResponse.json({ ok: false, error: "Ação inválida." }, { status: 400 });
  } catch (e: any) {
    const u = new URL(`/orcamentos?error=${encodeURIComponent(e?.message || "Erro inesperado.")}`, request.url);
    return NextResponse.redirect(u, { status: 303 });
  }
}
