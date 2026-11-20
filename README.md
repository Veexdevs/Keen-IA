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
- **20 languages** — English, Português, Español, Français, Deutsch, Italiano, Nederlands,
  Polski, Türkçe, Русский, Українська, العربية, हिन्दी, Indonesia, 日本語, 한국어, 中文,
  Tiếng Việt, ไทย, עברית. Detected on first open from the browser and the time zone, switchable
  in Settings → Language, searchable, each with its round flag, right-to-left for Arabic and
  Hebrew.
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

## Installing it

The web app is installable as it is: Android/Chrome → menu → *Install app*;
iPhone/Safari → Share → *Add to Home Screen*. There is a service worker and a manifest, so it
opens with no connection to the shell.

Native files (`.apk`, `.ipa`, `.exe`, `.AppImage`/`.deb`) are **not** built by this repository
on its own — a site cannot produce them, and no machine here has Xcode, the Android SDK or
Windows. They are built by `.github/workflows/installers.yml`, which runs each target on the
system it needs (Windows runner for `.exe`, macOS runner for `.ipa`, Linux runner for AppImage,
Ubuntu + JDK + Android SDK for `.apk`) and attaches the results to a GitHub Release.

```bash
node tools/installers.mjs            # what each target needs, and what this machine can do
node tools/installers.mjs --trigger  # start the build on GitHub Actions
```

The phone apps are Capacitor shells around the deployed site (`capacitor.config.ts`); the
desktop apps are Electron windows around the same site (`desktop/`). Nothing is duplicated:
an update to the site is an update to every app.

**Signing.** The files are unsigned. Windows shows the SmartScreen warning, macOS asks for
"Open anyway" once, and the `.ipa` needs sideloading (AltStore, Sideloadly) because Apple only
installs signed apps. Signing needs a paid certificate; nothing here pretends otherwise.

## Scripts

```bash
npm run dev        # development server on 0.0.0.0:3000
npm run build      # production build
npm start          # production server
npm run typecheck  # tsc --noEmit
npm test           # auth routes, translation, locale store, flags
npm run installers # status of each installer target
```

## Tests

`npm test` runs four plain-Node suites against the real modules, through
`tools/tests/loader.mjs` — no framework, no build step:

| suite | what it pins down |
| --- | --- |
| `auth` | signup and signin against a fake GoTrue: validation, existing account, wrong password, the rate limiter |
| `i18n` | `/api/i18n` against a fake model: language resolution, aliases, cache, junk keys, the limiter |
| `locale-store` | choosing a language: English until strings land, one request per batch, layout stays LTR, all 183 selectable |
| `brand` | the two letters after "Keew" per language (IA, KI, ИИ, AI…), the mark without its plate, and the manifest never opening as an app |
| `flags` | Arabic and Hebrew point at their own flags |

## Settings

The panel has five sections, reachable by tapping, the arrows or a horizontal swipe:
**Connectors · Appearance · Language · Account · About**. Language has a search box that
ignores accents and accepts the language's own name, its English name, its region, its code or
a Portuguese alias ("japão", "alemão", "rússia"). Appearance switches light / gray / dark with
a cross-fade of the whole frame (View Transitions; instant where unsupported, off when motion
is reduced).

## Languages

The list has **183 languages**, and they are translated in two different ways:

- **20 have hand-written dictionaries** in `lib/i18n/dict.ts`. Complete, instant, offline.
- **The other 163 are translated on demand.** `app/api/i18n` asks the model for the strings a
  screen is about to draw, caches them in `i18n_strings` in Supabase, and returns them. Until a
  string arrives the English one shows, so a freshly chosen language looks half-translated for a
  moment and then settles. Chat replies were never in question: the model answers in whatever
  language the message is written in.

Translation needs a model key. It can come from `KEEW_MODEL_API_KEY` in the environment, or be
stored once through `POST /api/i18n/setup`:

```bash
curl -X POST https://keew-ia.vercel.app/api/i18n/setup \
  -H 'content-type: application/json' \
  -d '{"key":"sk-…"}'
```

The first call wins; after a key exists the route refuses to replace it unless `KEEW_SETUP_TOKEN`
is set and sent in `x-keew-setup-token`. The key lives in `private.app_config` — a schema
PostgREST does not expose, so the anon key cannot read it.

The download page is its own project in `site/`, deployed as `keew-get.vercel.app`.

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
supabase/schema.sql       tables, triggers and RLS policies
supabase/schema-i18n.sql  translation cache and the server-only config table
site/                     the download page: its own Next project
public/             mark, icons, manifest, OG image
```

## Design

Black `#000`, panels `#0c0c0c`, borders `#151515`, one accent: the brand blue `#0048f8`.
Type is Plus Jakarta Sans, served locally so no font request leaves your server. The mark is
`public/mark.svg`, traced from the original artwork.
