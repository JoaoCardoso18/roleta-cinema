-- Roleta Cinema: tabela de filmes + segurança por usuário (RLS)
-- Cole tudo no Supabase em SQL Editor > New query e clique em Run.

create table if not exists public.movies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  pos int not null default 0,
  title text not null,
  color text not null default '#888888',
  watched boolean not null default false,
  rating int not null default 0 check (rating between 0 and 5),
  note text not null default '',
  tmdb jsonb,
  miss boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists movies_user_pos_idx on public.movies (user_id, pos);

alter table public.movies enable row level security;

create policy "Ver apenas os próprios filmes" on public.movies
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Inserir apenas para si" on public.movies
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Editar apenas os próprios filmes" on public.movies
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "Apagar apenas os próprios filmes" on public.movies
  for delete to authenticated using ((select auth.uid()) = user_id);
