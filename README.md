# Orçamentos de Obra (Next.js + Supabase)

Projeto base para criar orçamentos de obra com **composições**, **insumos**, **composição dentro de composição**, **login** via Supabase e **exportação em PDF/XLSX**.

## 📦 O que vem pronto
- Next.js (App Router) + TypeScript + Tailwind
- Autenticação por e‑mail (Supabase)
- Tabelas no Postgres (Supabase) com **RLS** e políticas básicas
- CRUD simples de **Insumos**, **Composições** e **Itens de Composição**
- Orçamento com cálculo **recursivo** (composições dentro de composições)
- Exportação **PDF** (PDFKit) e **XLSX** (ExcelJS)

## 🚀 Passo a passo (leigo-friendly)
1) Crie um projeto no **Supabase** (grátis). Em *Project Settings → API* copie:
   - `Project URL` → use em `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → use em `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Em *Authentication → URL Configuration*, defina a **Site URL** do seu projeto (ex.: `http://localhost:3000` no dev e a URL da Vercel em produção).

2) No painel do Supabase, abra **SQL** → cole e execute o conteúdo de `supabase/schema.sql`.

3) Copie `.env.example` para `.env.local` e preencha as variáveis.

4) Instale e rode localmente:
```bash
npm i
npm run dev
```
Abra http://localhost:3000

5) **Deploy na Vercel** (grátis):
- Crie um repositório no GitHub e suba os arquivos.
- No painel da Vercel: *Add New Project* → importe seu repo → em *Environment Variables* adicione as mesmas do `.env.local` (sem as aspas) → Deploy.

> Dica: você pode começar sem importar planilhas SINAPI e ir cadastrando **Insumos** e **Composições** manualmente para validar o fluxo. Depois dá para criar uma página de upload que leia XLSX e alimente as tabelas.

## 🔐 Políticas (RLS)
- **Insumos/Composições**: leitura liberada para usuários **autenticados**; escrita liberada para autenticados (simples).
- **Orçamentos**: cada usuário enxerga apenas seus próprios orçamentos/itens.

> Em `supabase/schema.sql` você pode apertar as permissões conforme for crescendo.

## 🧮 Cálculo Recursivo
O cálculo explode composições em seus itens até chegar em insumos finais, multiplicando coeficientes e quantidades. Implementado em `lib/calc.ts` com cache/memoização para eficiência.

## 📄 Exportar PDF/XLSX
- Endpoints:
  - `GET /api/orcamentos/[id]/pdf`
  - `GET /api/orcamentos/[id]/xlsx`
Ambos usam o cálculo recursivo para gerar os arquivos.

---

Qualquer dúvida, abra `README.md` e siga na ordem. Bom trabalho! 💪
