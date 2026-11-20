-- Keen IA — uma mensagem pode ser corrigida depois de enviada
--
-- O botão de lápis troca o texto de uma mensagem no lugar. Sem esta coluna,
-- `updated_at` ficava com o horário do envio e a correção não deixava rastro
-- nenhum — quem olhasse o banco via um texto que "sempre" foi assim.
alter table public.messages
  add column if not exists updated_at timestamptz;

comment on column public.messages.updated_at is
  'Quando o texto foi editado pela última vez. NULL enquanto nunca foi editado.';
