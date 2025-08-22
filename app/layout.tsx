import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Orçamentos de Obra",
  description: "MVP Next.js + Supabase para orçamentos de obra",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <nav className="border-b bg-white">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-6">
            <Link href="/" className="font-semibold">Orçamentos</Link>
            <Link href="/insumos" className="text-sm">Insumos</Link>
            <Link href="/composicoes" className="text-sm">Composições</Link>
            <Link href="/orcamentos" className="text-sm">Meus Orçamentos</Link>
            <div className="ml-auto text-sm text-slate-500">Next.js + Supabase</div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
