-- Keen IA — uma resposta da IA numa página só dela
--
-- Compartilhar publica o TEXTO de uma resposta, e nada mais: sem o resto da
-- conversa, sem o email de quem compartilhou e sem o id da mensagem original.
-- Por isso é uma tabela própria em vez de uma coluna em `messages`: a tabela
-- das mensagens é fechada por RLS a quem é dono da conversa, e o link precisa
-- abrir para qualquer pessoa.
--
-- A escrita é só do servidor (service role), que é quem publica. A leitura é
-- pública: é o ponto do link. Não há listagem, nem busca, nem vizinhança — o
-- id aleatório de 10 caracteres é a única chave.
create table if not exists public.shared_answers (
  id         text primary key,
  text       text not null,
  lang       text not null default 'en',
  title      text not null default '',
  created_at timestamptz not null default now()
);

comment on table public.shared_answers is
  'Respostas publicadas por /api/share. Público por desenho; o id é a única chave.';

alter table public.shared_answers enable row level security;

-- leitura: qualquer um, o que é o propósito de um link compartilhado
drop policy if exists "shared answers: read" on public.shared_answers;
create policy "shared answers: read" on public.shared_answers
  for select using (true);

-- escrita: ninguém pelo cliente. O servidor usa a service role, que ignora RLS.
drop policy if exists "shared answers: no client writes" on public.shared_answers;
create policy "shared answers: no client writes" on public.shared_answers
  for insert with check (false);

create index if not exists shared_answers_created_idx
  on public.shared_answers (created_at desc);
