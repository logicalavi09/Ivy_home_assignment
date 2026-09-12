# Ivy Homes — Software Engineering Internship Assignment

## Overview

This repository contains my submission for the Ivy Homes Software Engineering Internship Assignment (September 2026).

The assignment involved:
- Investigating the Ivy Homes API
- Validating API documentation against observed behavior
- Retrieving and analyzing the complete available datasets
- Answering the ten assignment questions
- Identifying API/documentation discrepancies and data-quality issues
- Building a frontend for browsing listings, rentals, projects, saved listings, and insights

## Candidate

- Name: Avinash Gupta
- GitHub: logicalavi09
- Assigned city: Pune
- Assigned locality: Hadapsar

## Tech Stack

- Frontend: React + Vite (`frontend/`)
- API proxy: Vercel Serverless Functions (`api/proxy.js`)
- API/data investigation: Python
- Data analysis: Python standard library
- Version control: Git + GitHub
- Deployment: Vercel

AI/LLM assistance was used during development for investigation support, implementation guidance, debugging, and documentation.

---

## Phase 1: Infrastructure and Secure API Proxy

### Security model

The Ivy Homes API key (`IVY_API_KEY`) is **never exposed to the browser**. The browser only
talks to a Vercel Serverless Function, which forwards requests to `https://solve.ivy.homes`
and injects the key into the `X-API-Key` header server-side.

```
Browser ── /api/v1/listings ──▶ Vercel rewrite ──▶ api/proxy.js
                                                       │
                                              IVY_API_KEY injected here
                                                       ▼
                                      https://solve.ivy.homes/v1/listings
```

- `vercel.json` serves the frontend and the API from **one server**: `/api/(.*)` is rewritten
  to `/api/proxy?path=/$1` (preserving the query string), the built SPA in `frontend/dist` is
  served from the site root (`/assets/*`, `/favicon.svg`), and every other path falls back to
  `frontend/dist/index.html` so client-side routes survive a refresh.
- `api/proxy.js` strips the `path` parameter, rebuilds the query string, injects `X-API-Key`
  from the environment, forwards the browser's `Authorization` header (if present), and passes
  the upstream status/body back to the client.
- CORS headers are set on every response so a locally-running frontend can call the local proxy
  directly; an `ALLOWED_ORIGIN` env var can restrict origins (default `*` for dev).
- A client-supplied `X-API-Key` is never forwarded — only the server-side one.

### Local development

Prerequisites: Node.js 18+, Python 3.10+, and the Vercel CLI.

1. Create `.env` at the repo root (it is gitignored):

   ```bash
   cp .env.example .env
   # edit .env and set IVY_API_KEY=...
   ```

2. Build the frontend once (the repo's `vercel.json` serves `frontend/dist`):

   ```bash
   cd frontend
   npm install
   npm run build
   cd ..
   ```

3. Start everything on a single port — the Vercel proxy plus the built SPA:

   ```bash
   vercel dev
   # open http://localhost:3000  — both the app and /api/* work here
   ```

   While developing the frontend you can keep the dist fresh with
   `npm run build --watch` (from `frontend/`).

#### Alternative: Vite dev server with HMR (two ports)

For hot module reload, run Vite instead and let it proxy `/api` to the Vercel server:

```bash
vercel dev                    # terminal 1 — API/proxy on http://localhost:3000
cd frontend && npm run dev    # terminal 2 — Vite on http://localhost:5173
```

Vite's `vite.config.js` proxies `/api → http://localhost:3000`, so the app on
http://localhost:5173 talks to the same proxy/API as the single-port setup.

At either URL you can verify the proxy (`GET /api/v1/listings`), log in via
`POST /api/auth/login`, and confirm Authorization header forwarding.

### API key for the data-fetching scripts

The Ivy Homes API key is private and is intentionally NOT committed to this repository.
For the Python data scripts, set it in the shell instead:

```bash
export IVY_API_KEY="YOUR_API_KEY"
python fetch_data.py
```

### Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel (or run `vercel` from the repo root).
2. Add the secret server-side (never commit it):

   ```bash
   vercel env add IVY_API_KEY
   ```

3. Set the project's Root Directory to the **repo root** and Framework Preset to **Other**
   (static). Vercel serves `frontend/dist` and the `api/` functions through the rewrites in
   `vercel.json`. `vercel.json` rewrites map the built SPA to the site root and preserve the
   `/api` proxying:

   - `GET /` → SPA  (index.html from `frontend/dist`)
   - `GET /dashboard`, `/listings`, … → SPA fallback (server-side routing safe)
   - `GET /api/v1/listings` → `api/proxy.js` → `solve.ivy.homes` with `X-API-Key`

   If you prefer the classic Vite deploy (Root Directory = `frontend`), keep the old
   framework-detected build: restore the `frontend` Root Directory and hosting pipeline and only
   deploy `api/` separately — the `vercel.json` above is tuned for the repo-root static + API
   layout.

---

## Phase 2: Authentication & Token Refresh Engine

### Architecture

```
LoginPage ──▶ AuthContext.login() ──▶ POST /api/auth/login
                                           │  (demo password from user input only)
                                           ▼
                              { access_token, refresh_token, expires_in=900 }
                                           │
                                       setSession() ──▶ localStorage
                                            ├─ ivy.access_token
                                            ├─ ivy.refresh_token
                                            ├─ ivy.user
                                            └─ ivy.expires_at

Any API call ──▶ axios instance (/api)
                   │ request interceptor: attach Authorization: Bearer <access_token>
                   │                      + proactively refresh if within 60s of expiry
                   ▼
              401? ──▶ response interceptor ──▶ POST /api/auth/refresh
                   ▲                                  │
                   └── retry original request  ◀── update localStorage ◀──┘
                                                            │
                                   refresh fails? ──▶ clear localStorage ──▶ redirect #/login
```

### What was built

- `frontend/src/api/client.js` — an Axios instance with `baseURL: '/api'` (all calls go
  through the same proxy as Phase 1), plus two interceptors:
  - **Request:** attaches `Authorization: Bearer <token>` when a token exists, and whenever
    the token is within 60 seconds of expiry it *proactively* calls `/auth/refresh` so a
    near-expired token never round-trips through a guaranteed 401.
  - **Response:** on a `401` it single-refreshes via `/auth/refresh` using the stored
    refresh token, updates localStorage and retries the original request exactly once.
    If refresh fails, storage is cleared and the app redirects to `/#/login`.
  - Concurrent refresh requests are coalesced through a single shared promise so a burst of
    parallel calls only triggers one `/auth/refresh`.
- `frontend/src/auth/tokenStorage.js` — localStorage helpers for `access_token`,
  `refresh_token`, user data and an expiry timestamp. Expiry is computed from the JWT `exp`
  claim, else from the server's `expires_in`, else a 15-minute fallback.
- `frontend/src/auth/AuthContext.jsx` — React context that hydrates from localStorage on
  app mount (so a browser refresh keeps you signed in; an expired-but-refreshable session is
  refreshed automatically), and exposes `login`, `logout`, `user`, `isAuthenticated`.
- `frontend/src/pages/LoginPage.jsx` — professional login form with loading and error states
  (`Invalid credentials` on HTTP 401). The **password is never hardcoded** — it is read from
  the password field; the demo email `demo1@ivy.homes` is prefilled for convenience.
- `frontend/src/components/ProtectedRoute.jsx` — route guard; unauthenticated visitors are
  redirected to `/#/login` (remembering where they came from). `/dashboard`, `/listings`
  and every child route are wrapped in it.
- `frontend/src/components/Layout.jsx`, `pages/Dashboard.jsx`, `pages/Listings.jsx` — the
  signed-in shell with a working **Sign out** button (calls `/api/auth/logout`, then clears
  local state) and sample protected pages that fetch through the authenticated axios client.

### Notes

- Routing uses `HashRouter` (`/#/login`, `/#/dashboard`) so deep links survive a browser
  refresh on Vercel's static hosting without extra rewrites. The interceptor redirect uses
  `window.location.hash`, so it is router-agnostic.
- Logout invalidates the server-side session best-effort and always clears client storage.
- The `/auth/refresh` body is sent as `{ "refresh_token": ... }` (the token field the
  upstream returns). If the live API expects a different field for a future deployment, it is
  a one-line change in `frontend/src/api/client.js`.

---

## Phase 3: Listings Browser with Filters

The `/listings` page is now a filterable card grid at `/api/v1/listings`.

### What was built

- `frontend/src/components/ListingFilters.jsx` — a filter sidebar with:
  - **Locality** dropdown (the 10 Pune localities in the dataset)
  - **Bedrooms (BHK)** — `1 / 2 / 3 / 4+`
  - **Price range** — min/max inputs in ₹ Lakhs with a dedicated *Apply price* button
  - **Furnishing** — `unfurnished`, `semi-furnished`, `fully-furnished`
  - Active-filter counter + *Clear* button, and validation for invalid price ranges
- `frontend/src/components/ListingCard.jsx` — card showing apartment/project name, INR price,
  locality, BHK, area (sqft) and furnishing, plus *Verified* / *Live* badges.
- `frontend/src/components/Pagination.jsx` — numbered pager (First/Prev, page window with
  ellipsis, Next/Last), driven by `offset`/`limit`.
- `frontend/src/pages/Listings.jsx` — grid layout wired to the axios client from Phase 2
  (**auth logic untouched**). Select-type filters trigger a new API call immediately; the
  price range applies on *Apply price*. While fetching, the grid is replaced by a shimmer
  skeleton; a "No results found" empty state appears when a filter set returns nothing.
- `frontend/src/listings/filterOptions.js` — the filter option lists and the empty state.

### Pagination

The API caps `limit` at 50, so the page fetches **`limit=50`** with `offset = page × 50`
and renders up to `ceil(total / 50)` numbered pages using the response's `total`/`has_more`
(paginating until `has_more=false` matches the Phase 1 finding that `total` undercounts).

### Server-side filter query parameters

Filters are sent as query parameters on `GET /v1/listings` (snake_case, matching the API's
field style). They are all defined in `filtersToParams()` at the top of
`frontend/src/pages/Listings.jsx`:

| Filter      | Query params                         |
| ----------- | ------------------------------------ |
| Locality    | `locality=hadapsar`                  |
| BHK exact   | `bedroom=2`                          |
| BHK 4+      | `bedroom_gte=4`                      |
| Price range | `min_price=...` / `max_price=...` (INR) |
| Furnishing  | `furnishing=fully-furnished`         |

If the upstream expects a different parameter name for any filter, adjust the one map
(`filtersToParams`) and the rest of the UI stays untouched.

---

## Running the Python Analysis

```bash
pip install -r requirements.txt   # if any dependencies are added
python fetch_data.py              # downloads data/ (gitignored)
python analyze.py                 # outputs analysis.txt
python deep_check.py              # outputs deep_check.txt
```