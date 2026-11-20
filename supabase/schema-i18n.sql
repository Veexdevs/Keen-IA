-- Keew IA — traduções geradas sob demanda.
--
-- Uma linha por (idioma, chave). O valor é o texto naquele idioma, produzido
-- pelo motor da Keew na primeira vez que alguém abre a interface nele, e
-- reaproveitado por todos os visitantes seguintes.
--
-- Chave primária composta: o mesmo texto pode existir em 181 idiomas, e a
-- busca é sempre "me dê tudo deste idioma", então (lang, locale) indexa bem.
--
-- Só o servidor escreve aqui (service key); o navegador nunca fala com esta
-- tabela diretamente.

create table if not exists public.i18n_strings (
  lang        text        not null,
  locale      text        not null,
  key         text        not null,
  value       text        not null,
  updated_at  timestamptz not null default now(),
  primary key (lang, locale, key)
);

-- leitura por idioma, que é a única consulta que existe
create index if not exists i18n_strings_lang_idx on public.i18n_strings (lang);

-- RLS ligado e sem política: nem o anon key nem o usuário logado leem ou
-- escrevem aqui. O caminho é sempre /api/i18n, no servidor.
alter table public.i18n_strings enable row level security;

comment on table public.i18n_strings is
  'Interface translations generated on demand by the model engine, cached per language.';

-- ── a chave do motor, para o servidor ─────────────────────────────────────
-- O motor que traduz precisa de uma chave, e quem responde pela Keew não deve
-- ter de editar variável de ambiente para ligá-la. Fica aqui, num schema que o
-- PostgREST não expõe e que o anon key não alcança.
--
-- Uma linha só, id = 'model'. O valor é { key, baseUrl, model, setAt }.

create schema if not exists private;

create table if not exists private.app_config (
  id          text        primary key,
  value       jsonb       not null,
  updated_at  timestamptz not null default now()
);

-- nem anon nem authenticated leem isto; o servidor usa a service key
revoke all on private.app_config from anon, authenticated;

comment on table private.app_config is
  'Server-only settings. Holds the translation engine key set through /api/i18n/setup.';
