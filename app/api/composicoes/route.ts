import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest){
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const codigo = String(form.get("codigo")||"").trim();
  const nome = String(form.get("nome")||"").trim();

  await supabase.from("composicoes").insert({ codigo, nome });

  return NextResponse.redirect(new URL("/composicoes", req.url));
}
