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

-- ---------------------------------------------------------------
-- Perfis (nome e nome de usuário). Rode este bloco se você já tinha
-- criado a tabela de filmes antes.
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9._]{3,20}$' and username !~ '^\.|\.$'),
  name text not null default '' check (char_length(name) <= 30),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Ver perfis" on public.profiles
  for select to authenticated using (true);

create policy "Criar o próprio perfil" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Editar o próprio perfil" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------
-- Amigos: convites com aceite. O amigo enxerga os filmes ASSISTIDOS (título,
-- capa e nota). A fila "Quero ver" só aparece pelo bloco "Comparar listas",
-- se a pessoa deixar visível no Perfil. Anotações continuam privadas.
-- ---------------------------------------------------------------
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null default auth.uid() references auth.users(id) on delete cascade,
  addressee uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  check (requester <> addressee)
);

-- impede convite duplicado, inclusive no sentido contrário
create unique index if not exists friendships_pair_idx
  on public.friendships (least(requester, addressee), greatest(requester, addressee));

alter table public.friendships enable row level security;

create policy "Ver as próprias amizades" on public.friendships
  for select to authenticated
  using ((select auth.uid()) in (requester, addressee));

create policy "Enviar convite" on public.friendships
  for insert to authenticated
  with check ((select auth.uid()) = requester and status = 'pending');

create policy "Aceitar convite recebido" on public.friendships
  for update to authenticated
  using ((select auth.uid()) = addressee)
  with check ((select auth.uid()) = addressee and status = 'accepted');

create policy "Desfazer amizade ou convite" on public.friendships
  for delete to authenticated
  using ((select auth.uid()) in (requester, addressee));

-- Procura uma pessoa pelo @ ou pelo código de amigo (RC-XXXX-XXXX)
create or replace function public.find_profile(q text)
returns table(user_id uuid, username text, name text)
language sql security definer set search_path = public as $$
  select p.user_id, p.username, p.name
  from public.profiles p
  where p.username = lower(regexp_replace(trim(q), '^@', ''))
     or upper('RC-' || substr(replace(p.user_id::text, '-', ''), 1, 4) || '-' || substr(replace(p.user_id::text, '-', ''), 5, 4)) = upper(trim(q))
  limit 1;
$$;

-- Filmes assistidos de um amigo (sem anotações)
create or replace function public.friend_movies(friend uuid)
returns table(id uuid, title text, color text, rating int, tmdb jsonb, pos int)
language sql security definer set search_path = public as $$
  select m.id, m.title, m.color, m.rating, m.tmdb, m.pos
  from public.movies m
  where m.user_id = friend and m.watched
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester = auth.uid() and f.addressee = friend)
          or (f.addressee = auth.uid() and f.requester = friend))
    )
  order by m.pos;
$$;

revoke all on function public.find_profile(text) from public, anon;
revoke all on function public.friend_movies(uuid) from public, anon;
grant execute on function public.find_profile(text) to authenticated;
grant execute on function public.friend_movies(uuid) to authenticated;

-- ---------------------------------------------------------------
-- Comparar listas com amigos. Rode este bloco uma vez no Supabase
-- (SQL Editor). Cada pessoa escolhe no Perfil se os amigos podem ver
-- a fila "Quero ver"; o padrão é mostrar.
-- ---------------------------------------------------------------
alter table public.profiles
  add column if not exists share_wishlist boolean not null default true;

-- Filmes "Quero ver" de um amigo, só se ele deixou visível (sem anotações)
create or replace function public.friend_wishlist(friend uuid)
returns table(id uuid, title text, color text, tmdb jsonb, pos int)
language sql security definer set search_path = public as $$
  select m.id, m.title, m.color, m.tmdb, m.pos
  from public.movies m
  where m.user_id = friend and not m.watched
    and coalesce((select p.share_wishlist from public.profiles p where p.user_id = friend), true)
    and exists (
      select 1 from public.friendships f
      where f.status = 'accepted'
        and ((f.requester = auth.uid() and f.addressee = friend)
          or (f.addressee = auth.uid() and f.requester = friend))
    )
  order by m.pos;
$$;

revoke all on function public.friend_wishlist(uuid) from public, anon;
grant execute on function public.friend_wishlist(uuid) to authenticated;
