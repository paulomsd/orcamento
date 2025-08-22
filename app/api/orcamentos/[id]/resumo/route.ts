import { NextResponse } from "next/server";
import { calculateOrcamento } from "@/lib/calc";

export async function GET(_: Request, { params }: { params: { id: string }}){
  const { total, bdi, total_com_bdi } = await calculateOrcamento(params.id);
  return NextResponse.json({ total, bdi, total_com_bdi });
}
