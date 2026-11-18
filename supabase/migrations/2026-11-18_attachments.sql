-- Keew IA — attachments on messages
--
-- Stores the name, type, size and thumbnail of each file sent. The file
-- itself never goes into the database: images and videos show the preview
-- generated in the browser, and text files are read at the moment of the
-- question. A PDF is stored by name only, and the interface says so.

alter table public.messages
  add column if not exists attachments jsonb not null default '[]'::jsonb;

comment on column public.messages.attachments is
  'Files sent with this message: [{id,name,mime,size,kind,thumb,text}]';
