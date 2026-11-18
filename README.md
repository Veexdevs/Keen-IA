# Keew IA

Your own intelligence — a chat interface with accounts, saved conversations and a
deterministic reasoning core that works without calling anything external.

## What is real today

- **Interface** — dark shell, brand sidebar, chat history, message actions, pill composer
  with attachments, login and profile modals, share link, toasts. Motion throughout.
- **Accounts** — email/password and Google sign-in through Supabase Auth. Sessions live in
  cookies, so the server knows who is talking to it.
- **Chats in the database** — every chat and message is a row in Postgres, protected by row
  level security. Sign in on another device and the history is there.
- **Local core** — arithmetic, percentages, units and temperature, dates and deadlines,
  extractive summaries, text transforms (slug, base64, JSON, word count) and retrieval over
  the knowledge base. Deterministic, auditable, no network.
- **Honest fallback** — for open-ended language questions the app says it has no language
  engine connected instead of inventing an answer.

Without Supabase credentials the app still runs: it switches to a guest mode where chats stay
in that browser only, and the login screen says so plainly.

## Setup

```bash
npm install

cp .env.example .env.local   # fill in the Supabase values
npm run dev
```

### Database

Run `supabase/schema.sql` once in the Supabase SQL editor (or `supabase db push`). It creates
`profiles`, `chats` and `messages`, the trigger that creates a profile on signup, and the RLS
policies that keep each account's data private.

Then, in Supabase → Authentication:

- **URL configuration** — set the site URL to your deployment and add `http://localhost:3000`
  to the redirect allow list.
- **Providers** — email is on by default. For Google sign-in, enable the Google provider and
  paste the client ID and secret from Google Cloud Console.

Environment variables live in `.env.local` and are never committed:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (public, RLS protects the data) |
| `NEXT_PUBLIC_APP_URL` | Public URL, used in metadata and auth redirects |
| `KEEW_MODEL_BASE_URL` | Optional language engine, OpenAI-compatible |
| `KEEW_MODEL_NAME` | Model name the engine expects |

## Scripts

```bash
npm run dev        # development server on 0.0.0.0:3000
npm run build      # production build
npm start          # production server
npm run typecheck  # tsc --noEmit
```

## Structure

```
app/
  layout.tsx        fonts, metadata, icons
  page.tsx          renders the chat screen
  globals.css       design tokens and the .md typography
  api/chat/         the single endpoint: local core → engine → honest fallback
components/
  chat.tsx          the screen, wiring everything together
  sidebar.tsx       brand, new chat, history grouped by day, profile card
  composer.tsx      pill input, attachments, send / stop
  message.tsx       message stream with actions, typing dots, read aloud
  welcome.tsx       logo, wordmark, suggestion cards
  modals.tsx        login, profile, share
lib/
  store.ts          app state: session, chats, streaming
  local-engine.ts   the deterministic reasoning core
  knowledge.ts      knowledge base and retrieval
  supabase/         browser client, server client, row types
supabase/schema.sql tables, triggers and RLS policies
public/             mark, icons, manifest, OG image
```

## Design

Black `#000`, panels `#0c0c0c`, borders `#151515`, one accent: the brand blue `#0048f8`.
Type is Plus Jakarta Sans, served locally so no font request leaves your server. The mark is
`public/mark.svg`, traced from the original artwork.
