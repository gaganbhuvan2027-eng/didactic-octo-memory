This repository is a Next.js (app-router) frontend backed by Supabase and several client-side media components.

Guiding summary for coding agents
- Big picture: app/ contains the Next.js app-router routes and page layouts. `components/` holds reusable UI and media-heavy interview components (e.g. `audio-video-interviewer.tsx`, `interview-room.tsx`, `interview-transcript.tsx`). `scripts/` and `test/` contain utility scripts and in-process tests that interact directly with Supabase.
- Data & auth: Supabase is the primary backend. Server-side code (API routes and scripts) relies on `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_JWT_SECRET` from `.env.local`. Client uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`/`NEXT_PUBLIC_SUPABASE_URL`.

Developer workflows (commands)
- Local dev: `npm run dev` (requires `.env.local` for Supabase keys and any third-party API keys).
- Build: `npm run build` and `npm run start` for production preview.
- Lint: `npm run lint`.
- Tests: unit and integration harnesses live under `test/` and use `node --test` wrappers. Run integration tests with:

```bash
# ensure .env.local contains SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
npm run test:integration
```

Key project-specific conventions
- App router: look in `app/` for route handlers and layouts — prefer editing the app-router files rather than mixing page-router conventions.
- UI/components: prefer creating or updating files in `components/` for shared UI; pages import these. Example patterns: `interview-*` components encapsulate interview flows and stateful media handling.
- Env-driven behavior: admin honeypot and real admin path are configured via `.env.local` variables (`ADMIN_HONEYPOT_ENABLED`, `REAL_ADMIN_PATH`, `ADMIN_ALERT_WEBHOOK`). Changing admin behavior usually requires checking both client routes (`app/super-admin` or `app/admin`) and server-side helpers.
- Tests: the `scripts/README.md` documents that in-process tests call Supabase REST directly — tests create entities and clean up certain tables but intentionally preserve created user accounts.

Integration points & external dependencies
- Supabase: used for auth, DB, and server-side operations. Keep service keys out of commits.
- Deepgram and other API keys: referenced in `.env.local` (e.g. `DEEPGRAM_API_KEY`) — media processing is often client-side or via WASM where noted.
- Vercel / v0.app: repository is linked to a Vercel deployment and a v0.app editor sync; changes may be overwritten if edited outside the v0 interface in some workflows — check `README.md` when unsure.

How to make safe edits
- When modifying data-access code, update both the server helper (look for `lib/` or `api/` helpers) and the UI component that displays the data (e.g., `components/*` or `app/*` route). Search for Supabase key usages before running tests.
- For UI changes, follow existing Tailwind/TW classes; project uses `tailwindcss` and many TSX components. Keep logic in components and routing/side-effects in `app/` routes.

Where to look first for common tasks
- Add feature UI: `components/` then `app/` route that uses it.
- Fix auth/role bugs: `app/auth/`, any `lib/supabase` helper, and `.env.local` secrets.
- Adjust tests: `test/` and `scripts/`; update `scripts/README.md` for any test workflow changes.

If you modify environment-dependent code
- Document required env vars at top of the changed files and update `scripts/README.md` where integration tests are affected.

After changes
- Run `npm run dev` and the relevant tests: `npm run test`, `npm run test:integration`.

If anything here is unclear or you want more detail on a specific subsystem (auth, interview media pipeline, or tests), tell me which area and I'll expand the instructions or link exact files.
