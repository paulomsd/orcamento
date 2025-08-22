import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { id: string }}){
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const item_type = String(form.get("item_type")||"insumo") as "insumo"|"composicao";
  const coeficiente = parseFloat(String(form.get("coeficiente")||"1"));
  const item_id = String(form.get("item_id")||"");
  const composicao_id = String(form.get("composicao_id")||params.id);

  if(item_type === "insumo"){
    await supabase.from("composicao_itens").insert({
      composicao_id, item_type, insumo_id: item_id, coeficiente
    });
  }else{
    await supabase.from("composicao_itens").insert({
      composicao_id, item_type, subcomposicao_id: item_id, coeficiente
    });
  }

  return NextResponse.redirect(new URL(`/composicoes/${composicao_id}`, req.url));
}
