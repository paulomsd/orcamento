import { redirect } from "next/navigation";

export default function Home() {
  // Redireciona para a lista de orçamentos
  redirect("/orcamentos");
}
