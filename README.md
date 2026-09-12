# Ivy Homes — Software Engineering Internship Assignment

## 1. Project Overview

A full-stack submission for the Ivy Homes Software Engineering Internship
(September 2026). The project:

1. **Investigates the Ivy Homes public API** (`https://solve.ivy.homes`) — comparing
   documented behavior against the live API, then downloading and analyzing every
   retrievable record for the assigned city (Pune).
2. **Answers the ten assignment questions** from the retrieved dataset and records
   reproducible evidence in `submission.json`.
3. **Builds a production-style React application** that browses listings, rentals and
   projects, manages per-user saved listings, and presents a two-part **Insights
   dashboard** that surfaces the API's real behavior and data-quality findings.

### Product features

| Page | What it does |
| ---- | ------------ |
| `/dashboard` | Signed-in landing page with summary stat cards that link to each section. |
| `/listings` | Filterable grid of 3,800 property listings (locality, BHK, price, furnishing) with session-aware pagination and local keyword search. |
| `/listings/:id` | Full property fact sheet; shows `N/A` for every missing field; per-user save heart. |
| `/rentals` | 1,450 rentals grid with monthly-rent pricing (`₹/month`), shared filters + search. |
| `/projects` | 440 projects grid with crore-scale INR pricing (`₹99.90 Cr` + full rupee line) and click-through to the project detail page. |
| `/projects/:id` | Project fact sheet plus the grid of listings belonging to that project. |
| `/saved` | Per-user bookmarks, keyed by the signed-in user's email; ID-only records self-heal by re-fetching details. |
| `/insights` | Analyst dashboard: API summary with validated fallback, documented-vs-actual discrepancy bars, "lies" categories, dataset composition, and the 10 assignment answers. |

## 2. Candidate

- **Name:** Avinash Gupta
- **Email:** avinashkumargupta306@gmail.com
- **GitHub:** logicalavi09
- **Assigned city:** Pune
- **Assigned locality:** Hadapsar

Sign in with any assignment demo account (e.g. `demo1@ivy.homes`; the demo passwords
are provided in the assignment brief and are **not committed** to this repository).

## 3. Tech Stack

| Layer | Technology |
| ----- | ---------- |
| Frontend | React 18 + Vite 8, React Router (hash routing), Axios |
| Styling | Plain CSS with dark-mode support; charts are dependency-free CSS bars |
| API proxy | Vercel Serverless Function (`api/proxy.js`) |
| Backend API | `https://solve.ivy.homes` (Ivy Homes) |
| Data investigation | Python 3 (stdlib only) + shell/curl probes |
| Hosting | Vercel (static SPA + `api/` functions on one server) |
| Version control | Git + GitHub |

## 4. How to Run Locally

Prerequisites: Node.js 18+, Python 3.10+, Vercel CLI.

```bash
# 1. Configure the API key (it is gitignored)
cp .env.example .env
#    edit .env and set IVY_API_KEY=<your key>

# 2. Install and build the frontend (vercel.json serves frontend/dist)
cd frontend
npm install
npm run build
cd ..

# 3. Run the whole app on one port
vercel dev
#    open http://localhost:3000   (app + /api/* both served here)
```

While iterating on the frontend, `npm run build --watch` (from `frontend/`) keeps the
built `dist/` fresh so `vercel dev` picks up changes automatically.

### Alternative: Vite dev server (hot reload, two ports)

```bash
vercel dev                    # terminal 1 — API/proxy on http://localhost:3000
cd frontend && npm run dev    # terminal 2 — Vite on http://localhost:5173
```

`vite.config.js` proxies `/api → http://localhost:3000`, so both URLs talk to the same
proxy and upstream API.

### Deploying to Vercel

1. Push the repo to GitHub and import it in Vercel (or run `vercel` from the repo root).
2. Add the key server-side — never commit it: `vercel env add IVY_API_KEY`.
3. Set Root Directory to the **repo root** and Framework Preset to **Other**. The
   rewrites in `vercel.json` serve the built SPA from the site root and route `/api/*`
   through `api/proxy.js`.

## 5. Architecture

### 5.1 Single-server layout (`vercel.json`)

The app and API run on **one** origin — no CORS in production, no key in the browser:

- `/api/(.*)` → `api/proxy.js?path=/$1` (query string preserved)
- `/assets/*`, `/favicon.svg` → files in `frontend/dist`
- `/(.*)` → `frontend/dist/index.html` (SPA fallback, so client-side routes survive a refresh)

### 5.2 Secure API proxy

The Ivy Homes API key is **never exposed to the browser**. The browser only talks to a
serverless function, which injects `X-API-Key` server-side.

```
Browser ── /api/v1/listings ──▶ Vercel rewrite ──▶ api/proxy.js
                                                      │
                                             X-API-Key injected here (server env)
                                                      ▼
                                     https://solve.ivy.homes/v1/listings
```

`api/proxy.js` strips the internal `path` parameter, rebuilds the query string, injects
the key, forwards the browser's `Authorization` header (used by the auth flow), and
passes the upstream status/headers/body back. CORS headers are set so a locally-running
frontend or the Vite dev server can call the proxy directly (`ALLOWED_ORIGIN` restricts
this for production if desired). Non-2xx upstream responses are sanitized into short,
user-facing error messages instead of raw backend dumps.

### 5.3 Authentication & token-refresh engine

Authentication is a full OAuth-style flow behind the axios client:

```
LoginPage ──▶ AuthContext.login() ──▶ POST /api/auth/login
                                          ▼
                     { access_token, refresh_token, expires_in=900 }
                                          ▼
                     setSession() ──▶ localStorage
                     (access_token, refresh_token, user, expires_at)

Any API call ──▶ Axios (baseURL /api)
   │  request interceptor: attach Authorization: Bearer <token>
   │                       + proactively refresh if within 60s of expiry
   ▼
 401? ──▶ response interceptor ──▶ POST /api/auth/refresh
   ▲                                    │  (single shared promise,
   └── retry original request  ◀────────┘   coalesced across requests)
                                          ▼
                      refresh fails? ──▶ clear session ──▶ redirect #/login
```

Key points:

- Login returns `access_token` + `refresh_token` and `expires_in=900` (not the
  documented `expires_in=86400` without refresh — see §8). Refresh calls
  `/api/auth/refresh` with `{ refresh_token }`.
- The request interceptor re-attaches the token and refreshes **proactively** when the
  token is within 60s of expiry, so near-expired tokens never round-trip through a 401.
- The response interceptor retries a 401 exactly once after a single refresh; concurrent
  401s are coalesced into one `/auth/refresh`. If refresh fails, the session is cleared
  and the user is redirected to `/login`.
- Sessions hydrate from localStorage on load, so a refresh keeps you signed in.
- The typed email is persisted at login so saved data is keyed per-user
  (`saved_listings_<email>`); logout clears that scope.

### 5.4 Data flow (pagination)

The API caps `limit` at 50 and paginates by `offset`/`limit` returning
`limit, offset, count, total, has_more` (the documented `page`/`page_size` contract is
wrong — see §8). The UI pages through `has_more` until `false` so the true dataset size
is always reached.

## 6. Methodology for Data Investigation

1. **Read the documentation first.** Endpoints, request/response schemas and auth were
   read from the assignment brief and noted as the "documented" contract.
2. **Probe the live API with `curl`.** Auth was characterized first: the documented
   `api_key` query parameter is rejected; the key must be sent as the `X-API-Key`
   header. The login endpoint was called and its real response inspected.
3. **Download the complete datasets.** `fetch_data.py` (`reachable data/`, gitignored)
   pages `GET /v1/listings`, `/v1/rentals` and `/v1/projects` with `offset`/`limit=50`
   until `has_more=false`, saving every record to `data/*.json`.
4. **Analyze.** Standard-library analysis derived per-dataset totals, locality
   distributions, medians, rent sums, ₹/sqft averages, last-7-days counts, corrupt/fake
   IDs, and project listing-count checks (summaries committed as `analysis.txt` and
   `deep_check.txt`).
5. **Cross-check documented vs. observed.** Each discrepancy was reproduced (e.g. using
   the reported `total` stops pagination early; `X-API-Key` required; `expires_in=86400`
   is actually 900) and recorded with endpoints and impact in `submission.json`.
6. **Commit evidence.** `fetch_data.py`, the analysis outputs, and `submission.json`
   stay in the repo; the raw `data/` JSON dumps remain gitignored.

## 7. Truth About the API — Findings

Every finding below was reproduced against the live API and recorded in
`submission.json#findings`. The list of "lies" (documented vs. actual):

| # | Category | Endpoint | Documented | Actual | Impact |
| - | -------- | -------- | ---------- | ------ | ------ |
| 1 | Auth | `/v1/*` | API key sent as `api_key` query param. | Key required as `X-API-Key` **header**; query param rejected. | Clients following the docs cannot authenticate. |
| 2 | Auth | `/auth/login` | Returns token, `expires_in=86400`, no refresh. | Returns `access_token` + `refresh_token`, `expires_in=900`, `refresh_url=/auth/refresh`. | Must use a different field, 15-min lifetime, and a refresh flow. |
| 3 | Pagination | `/v1/listings` | Uses `page`/`page_size`. | Uses `offset`/`limit`; returns `limit, offset, count, total, has_more`. | Documented contract cannot paginate the dataset. |
| 4 | Completeness | `/v1/listings` | `total` = complete record count. | `total=3543` initially but **3,800** records are retrievable (`has_more=false`). | Stop-at-total undercounts by 257. |
| 5 | Completeness | `/v1/rentals` | `total` = complete record count. | `total=1352` initially but **1,450** retrievable records. | Undercounts by 98. |
| 6 | Completeness | `/v1/projects` | `total` = complete record count. | `total=410` initially but **440** retrievable projects. | Undercounts by 30. |
| 7 | Consistency | `/v1/projects` | `total_listings` matches linked listings. | **317** projects disagree with the actual count of listings carrying that `project_id`. | Project listing counts cannot be trusted. |
| 8 | Units | `/v1/projects` | Project `price_min`/`price_max` presented as prices. | Values are **crore-scale**; P30394 `price_max=99.9` = **₹99,90,00,000**. | Treating them as raw INR gives wrong results. |
| 9 | Availability | `/v1/analytics/summary` | (documented) summary endpoint. | Returns **404 Not Found** on the live API. | Insights page must fall back to validated numbers. |

**Data quality:** of 3,800 listings, 21 are corrupt (missing/empty core fields) and 7
are fake (fabricated/placeholder records) — disjoint sets, leaving 3,772 healthy.
The top locality is **Hadapsar** (417 listings).

## 8. Assignment Answers

All answers are derived from the retrieved dataset and stored in `submission.json`
(which the Insights page renders directly, so the UI cannot drift from the submission).

| # | Question | Answer |
| - | -------- | ------ |
| 1 | Total listing records | **3,800** |
| 2 | Unique properties | **3,800** |
| 3 | Active listings (live) | **2,998** |
| 4 | Corrupt listing IDs | **21** (see `submission.json` / Insights modal) |
| 5 | Total monthly rent in Hadapsar | **₹53,35,700** |
| 6 | Average price per sq.ft. for 2 BHK | **₹18,314.23** |
| 7 | Costliest project | **P30394** — ₹99,90,00,000 |
| 8 | Listings in the last 7 days | **128** |
| 9 | Fake listing IDs | **7** (see `submission.json` / Insights modal) |
| 10 | Projects with wrong listing count | **317** |

## 9. Repository Layout

```
├── api/proxy.js            # Vercel serverless API proxy (X-API-Key injected server-side)
├── fetch_data.py           # data-collection evidence (paged to has_more=false)
├── analysis.txt            # dataset analysis summary (evidence)
├── deep_check.txt          # deep data-quality check results (evidence)
├── submission.json         # assignment answers + findings (single source of truth)
├── vercel.json             # rewrites: /api/* → proxy, static SPA fallback
├── .env.example            # committed template (real key lives only in .env — gitignored)
├── frontend/               # React app (Vite)
│   └── src/
│       ├── api/client.js            # axios + auth/refresh interceptors
│       ├── auth/                    # AuthContext, tokenStorage
│       ├── saved/                   # per-user saved listings (context + storage)
│       ├── listings/                # shared formatters, filters, local search
│       ├── insights/                # validated summary constants
│       ├── components/              # cards, filters, pagination, search, modals
│       └── pages/                   # Dashboard, Listings, Rentals, Projects,
│                                    #  ListingDetail, ProjectDetail, Saved, Insights
└── data/                   # raw API dumps — GITIGNORED (not tracked)
```

## 10. Security & Cleanup Notes

- **No hardcoded secrets:** a repository-wide scan for the `IVY26-` key prefix found
  matches only inside the gitignored `.env`. The committed `.env.example` carries an
  empty placeholder; the key is injected server-side by the proxy.
- **`data/` and `.env` are 100% gitignored** and not tracked by Git (verified with
  `git check-ignore`). Raw dataset dumps are regenerable via `fetch_data.py`.
- **No sensitive technical errors reach the UI.** The client shows friendly copy
  ("We couldn't load listings right now…", "Listing not found"), and the proxy sanitizes
  upstream error bodies into short messages.
- **No debug logging** remains in the client or proxy request path.

## 11. AI Assistance

AI/LLM assistance was used for **investigation support** (structuring the API
discrepancy analysis and data-quality checks), **implementation guidance** (proxy/auth
architecture, React components, formatting edge cases), **debugging**, and
**documentation**. All findings were reproduced and validated against the live API and
dataset; the analysis scripts and outputs are committed as reproducible evidence.

---

*Submitted by Avinash Gupta — September 2026.*