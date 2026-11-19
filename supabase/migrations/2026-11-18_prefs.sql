-- Keew IA — appearance preferences travel with the account
--
-- The theme, text size, density and motion settings are applied from the
-- browser instantly. This column mirrors them, so signing in on another
-- device restores the same look.

alter table public.profiles
  add column if not exists prefs jsonb not null default '{}'::jsonb;

comment on column public.profiles.prefs is
  'Appearance preferences: {theme, textScale, density, motion, showTimes, enterToSend}';
