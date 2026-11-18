-- ════════════════════════════════════════════════════════════════════════
-- Keew IA — schema do banco
--
-- Chats e mensagens do usuário, persistidos por conta. Tudo protegido por
-- RLS: cada linha pertence a um usuário e ninguém lê a linha de outro.
--
-- Rodar no SQL editor do Supabase (ou `supabase db push`).
-- ════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- ── perfis ──────────────────────────────────────────────────────────────
-- espelha auth.users com o que a interface precisa mostrar
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "own profile: read"   on public.profiles;
drop policy if exists "own profile: write"  on public.profiles;
drop policy if exists "own profile: update" on public.profiles;

create policy "own profile: read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile: write"  on public.profiles for insert with check (auth.uid() = id);
create policy "own profile: update" on public.profiles for update using (auth.uid() = id);

-- cria o perfil automaticamente quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── conversas ───────────────────────────────────────────────────────────
create table if not exists public.chats (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  title      text not null default 'New chat',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chats_user_updated_idx
  on public.chats (user_id, updated_at desc);

alter table public.chats enable row level security;

drop policy if exists "own chats: all" on public.chats;
create policy "own chats: all" on public.chats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── mensagens ───────────────────────────────────────────────────────────
create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  chat_id    uuid not null references public.chats(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  sources    jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists messages_chat_idx
  on public.messages (chat_id, created_at);

alter table public.messages enable row level security;

drop policy if exists "own messages: all" on public.messages;
create policy "own messages: all" on public.messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── manter updated_at em dia ────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists chats_touch_updated_at on public.chats;
create trigger chats_touch_updated_at
  before update on public.chats
  for each row execute function public.touch_updated_at();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ── ao inserir mensagem, a conversa sobe na lista ───────────────────────
create or replace function public.bump_chat()
returns trigger language plpgsql as $$
begin
  update public.chats set updated_at = now() where id = new.chat_id;
  return new;
end;
$$;

drop trigger if exists messages_bump_chat on public.messages;
create trigger messages_bump_chat
  after insert on public.messages
  for each row execute function public.bump_chat();
