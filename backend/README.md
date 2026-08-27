# KinoMart backend

A small Express API that sits between the KinoMart frontend and your Neon
Postgres database. The frontend never talks to Postgres directly — it can't
(browsers can't open raw TCP/Postgres connections, and a DB password must
never ship in client-side JS). This backend is that missing piece.

## What it replaces

The original frontend called Supabase directly from the browser using the
public `@supabase/supabase-js` client. This backend + `src/lib/apiClient.ts`
in the frontend together are a drop-in replacement for that — same tables
(`products`, `categories`, `settings`, `coupons`, `team`, `orders`,
`customer_profiles`), same shape of data, just backed by your own Neon
database instead of Supabase.

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in DATABASE_URL (a .env with your Neon
                        # connection string is already included for you)
npm run migrate        # creates the tables + seeds a default settings row
npm start               # http://localhost:4000
```

## Deploying (Vercel — as a second Vercel project)

This backend also runs as a Vercel serverless function (`api/index.js`
wraps the same Express app from `src/app.js` — `src/server.js` is only for
`npm run dev` locally, Vercel doesn't use it). Deploy it as its **own**
Vercel project, separate from the frontend:

1. Push this whole repo to GitHub (frontend + `backend/` folder together is fine).
2. In Vercel: **Add New Project** → import the repo again → set **Root
   Directory** to `backend`. This creates a second, independent Vercel
   project from the same repo.
3. Environment variables (Project Settings → Environment Variables):
   `DATABASE_URL` (your Neon connection string) and `CORS_ORIGIN` (your
   frontend's Vercel URL, comma-separated if more than one — you can update
   this after the frontend project has a URL).
4. Deploy. Vercel auto-detects `vercel.json`'s rewrite, so every path hits
   the one serverless function and Express routes it internally.
5. Run the migration once, pointed at the same `DATABASE_URL` — easiest is
   locally: `cd backend && npm install && npm run migrate`.

## Deploying (Render — alternative)

1. Push this `backend/` folder to its own GitHub repo (or a subfolder of one).
2. New Web Service on Render → connect the repo → root directory `backend`.
3. Build command: `npm install`. Start command: `npm start`.
4. Environment variables: `DATABASE_URL` and `CORS_ORIGIN`, same as above.
5. Run the migration the same way as step 5 above.

## API shape

Every table gets the same 4 endpoints:

- `GET /api/:table` — all rows (`?limit=n` optional)
- `POST /api/:table` — upsert one row or an array of rows (must include the
  primary key: `id`, except `customer_profiles` which uses `phone`)
- `PATCH /api/:table/:id` or `PATCH /api/:table?match_column=x&match_value=y`
  — partial update, merges into the existing row
- `DELETE /api/:table/:id` or `DELETE /api/:table?match_column=x&match_value=y`

Each row is `{ id, ...a few flat columns for filtering, data: {...}, created_at, updated_at }`.
`data` always holds the full object exactly as the frontend's TypeScript
types expect (`Product`, `Order`, etc.) — the flat columns are just a
convenience mirror of a few fields, not the source of truth.

## Not included (by design, for now)

- **Realtime push updates.** Supabase's live `postgres_changes` subscription
  isn't replicated — the frontend's existing 30-second polling fallback
  (already in `StoreContext.tsx`) is what keeps data fresh instead. Fine for
  a single-store admin panel; if you outgrow it, add a WebSocket layer later.
- **Auth/row-level security.** This API has no authentication of its own —
  it trusts whatever calls it. That was already true of how the anon
  Supabase key worked here (all access control was client-side, via the
  admin login modal), so this isn't a regression, but it does mean anyone
  who finds your Render URL can read/write the database. If that matters to
  you, add an API key check or move admin-only routes behind real auth.
