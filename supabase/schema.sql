-- Tabelas
create table if not exists public.insumos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  descricao text not null,
  unidade text not null,
  preco numeric not null default 0,
  uf text,
  data_base date,
  inserted_at timestamp with time zone default now()
);

create table if not exists public.composicoes (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nome text not null,
  uf text,
  data_base date,
  inserted_at timestamp with time zone default now()
);

create table if not exists public.composicao_itens (
  id uuid primary key default gen_random_uuid(),
  composicao_id uuid not null references public.composicoes(id) on delete cascade,
  item_type text not null check (item_type in ('insumo','composicao')),
  insumo_id uuid references public.insumos(id) on delete cascade,
  subcomposicao_id uuid references public.composicoes(id) on delete cascade,
  coeficiente numeric not null default 1
);

create table if not exists public.orcamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  uf text,
  data_base date,
  bdi numeric default 0,
  created_at timestamp with time zone default now()
);

create table if not exists public.orcamento_itens (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid not null references public.orcamentos(id) on delete cascade,
  composicao_id uuid not null references public.composicoes(id) on delete restrict,
  quantidade numeric not null default 1
);

-- RLS
alter table public.insumos enable row level security;
alter table public.composicoes enable row level security;
alter table public.composicao_itens enable row level security;
alter table public.orcamentos enable row level security;
alter table public.orcamento_itens enable row level security;

-- Políticas simples: autenticado pode ler/editar base (ajuste depois para perfis)
create policy "insumos read" on public.insumos for select using (auth.role() = 'authenticated');
create policy "insumos write" on public.insumos for insert with check (auth.role() = 'authenticated');
create policy "insumos update" on public.insumos for update using (auth.role() = 'authenticated');

create policy "comp read" on public.composicoes for select using (auth.role() = 'authenticated');
create policy "comp write" on public.composicoes for insert with check (auth.role() = 'authenticated');
create policy "comp update" on public.composicoes for update using (auth.role() = 'authenticated');

create policy "comp_itens read" on public.composicao_itens for select using (auth.role() = 'authenticated');
create policy "comp_itens write" on public.composicao_itens for insert with check (auth.role() = 'authenticated');
create policy "comp_itens update" on public.composicao_itens for update using (auth.role() = 'authenticated');

-- Orçamentos: cada usuário só vê os seus
create policy "orc read" on public.orcamentos for select using (auth.uid() = user_id);
create policy "orc write" on public.orcamentos for insert with check (auth.uid() = user_id);
create policy "orc update" on public.orcamentos for update using (auth.uid() = user_id);

create policy "orc_itens read" on public.orcamento_itens for select using (
  exists(select 1 from public.orcamentos o where o.id = orcamento_id and o.user_id = auth.uid())
);
create policy "orc_itens write" on public.orcamento_itens for insert with check (
  exists(select 1 from public.orcamentos o where o.id = orcamento_id and o.user_id = auth.uid())
);
create policy "orc_itens update" on public.orcamento_itens for update using (
  exists(select 1 from public.orcamentos o where o.id = orcamento_id and o.user_id = auth.uid())
);
