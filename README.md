# Byamashop

Online boutique for **Byamashop** (Dakar, Senegal). It sells prayer dresses and prayer rugs, perfumes, second-hand clothing, *Ensembles chez Cathy*, products from Morocco, imported products and *Lasalmah*. The site is in French, prices are in FCFA (XOF), and the owner manages everything from a mobile-friendly admin.

> **Status:** the code is functional and tested in this repository. **It is not live yet.** It needs a Supabase project, a Netlify site and real business information first: see [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md). The catalogue currently holds **34 demonstration products** (`is_demo = true`) with illustrated placeholder visuals.

| Document | For |
|---|---|
| [`docs/GUIDE-PROPRIETAIRE.md`](docs/GUIDE-PROPRIETAIRE.md) | 🇫🇷 Owner's guide: daily use of the admin |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Step-by-step Supabase + Netlify setup |
| [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md) | Credentials, business details and checks required before going public |
| [`docs/AUDIT.md`](docs/AUDIT.md) | Audit of the original site and architecture decisions |
| [`docs/VERIFICATION-REPORT.md`](docs/VERIFICATION-REPORT.md) | What was tested, how, and what remains |

## Architecture (short)

- **Front end:** React 19 + TypeScript + Vite, React Router, TanStack Query, and a hand-written CSS design system (`src/styles`). It is a single-page app with code-split admin and secondary pages.
- **Back end:** **Supabase** (Postgres, Auth, Storage).
  - Business rules live **in the database**: price calculation, promotions, stock reservation, idempotent orders, rate limiting and status history.
  - They are exposed through `SECURITY DEFINER` functions and protected by **row-level security**.
  - Visitors can only read published catalogue data and call `place_order`, `get_order_status` (reference + secret token), `submit_contact_message` and `subscribe_newsletter`.
- **Hosting:** **Netlify**.
  - Static build with security headers and a CSP.
  - Edge functions inject Open Graph tags into product pages, so WhatsApp and Facebook previews work without JavaScript. They also serve `sitemap.xml` and `robots.txt`.
  - An optional, disabled-by-default Wave payment webhook is included.
- **Demo mode:** when no Supabase variables are set, the app runs on an in-browser back end (`src/backend/demo.ts`) that mirrors the database rules.
  - A permanent banner states that orders are **not** transmitted.
  - The end-to-end tests use this mode.

```
src/
  backend/        ShopBackend interface + Supabase and demo implementations
  data/demo/      demonstration catalogue (single source for the app and supabase/seed.sql)
  lib/            pricing, search/filters, cart, CSV import/export, validation, images
  components/ pages/   storefront
  admin/          owner dashboard
supabase/migrations/   schema, RLS, functions, storage policies
supabase/seed.sql      generated demo content + legal page templates
content/legal/         editable legal templates (Markdown)
netlify/               edge functions (OG tags, sitemap, robots) + Wave webhook
tests/unit tests/db tests/e2e
```

## Local development

```bash
npm install
npm run dev            # http://localhost:5173 — demo mode if .env is empty
```

To use a real Supabase project, copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

Demo admin (demo mode only): `admin@demo.byamashop` / `demo-byamashop` at `/admin`.

## Tests

```bash
npm test                         # unit tests (pricing, search, CSV, demo back end, OG tags, Wave signature)
scripts/db-test-server.sh start  # temporary local PostgreSQL 16 on port 54329
npm run test:db                  # SQL migrations, RLS, orders, stock, admin functions on real Postgres
npx playwright test              # end-to-end tests (desktop + Pixel 7) + axe accessibility checks
npm run build                    # type-check + production build
```

## Regenerating generated files

```bash
npm run seed:generate             # supabase/seed.sql + supabase/installation-complete.sql from src/data/demo + content/legal
node scripts/build-logo.mjs       # vector logo (text converted to paths)
node scripts/generate-demo-art.mjs  # demo illustrations in public/demo
node scripts/build-raster-assets.mjs # og-image.png and PNG icons
```

The original site (static HTML/JS) is kept for reference in `docs/original-site/`.
