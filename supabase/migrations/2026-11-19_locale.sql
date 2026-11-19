-- Keew IA — interface language travels with the account
--
-- The language is applied from the browser instantly. This column mirrors the
-- choice, so signing in on another device opens the app in the same language.

alter table public.profiles
  add column if not exists locale text;

comment on column public.profiles.locale is
  'Interface language: en, pt-BR, es, fr, de or it. Null follows the device.';
