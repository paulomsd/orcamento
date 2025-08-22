import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest){
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const codigo = String(form.get("codigo")||"").trim();
  const descricao = String(form.get("descricao")||"").trim();
  const unidade = String(form.get("unidade")||"").trim();
  const preco = parseFloat(String(form.get("preco")||"0"));

  await supabase.from("insumos").insert({ codigo, descricao, unidade, preco });

  return NextResponse.redirect(new URL("/insumos", req.url));
}
