export default async function Page({
  params,
}: {
  params: { id: string }
}) {
  // Página mínima só para destravar o build.
  // Se esta página abrir, voltamos a colocar a versão completa.
  return "Orçamento carregado (página mínima).";
}
