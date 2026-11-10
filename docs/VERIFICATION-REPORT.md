# Verification report

Environment: Linux build container, Node 22, PostgreSQL 16.15 (local), Chromium (Playwright 1.63). Date: 8 November 2026, updated 10 November 2026.
Every result below was **actually executed** in this environment. Anything not executed is listed in §4 and §5.

## 1. Automated tests: results

| Suite | Command | Result |
|---|---|---|
| Type-check + production build | `npm run build` | ✅ passes |
| Unit tests (Vitest) | `npm test` | ✅ **33 / 33** |
| Database tests on real PostgreSQL 16 | `npm run test:db` | ✅ **23 / 23** |
| End-to-end browser tests (Playwright, desktop 1366 px + Pixel 7) | `npx playwright test` | ✅ **37 / 37** |
| Accessibility (axe-core, WCAG 2 A/AA, serious and critical violations) on 7 pages × 2 viewports | included above | ✅ 0 violations |

### Coverage of the 15 required workflows

| # | Workflow | Where |
|---|---|---|
| 1 | Product browsing | e2e `storefront: 1.` (home → category → product, JSON-LD, canonical) |
| 2 | Search and filtering | e2e `storefront: 2.`; unit `format-search` (accents, category, price, size, stock, sort) |
| 3 | Variant selection | e2e `storefront: 3.` (price per size, colour, stock indicator) |
| 4 | Add to cart | e2e `storefront: 4-6.` |
| 5 | Cart persistence | e2e `4-6.` (reload keeps the cart) |
| 6 | Quantity updates | e2e `4-6.` + "stock limits quantity" |
| 7 | Delivery-fee calculation | e2e `checkout: 7-8.` (zones, pick-up); unit `pricing` (free-from threshold); e2e admin "frais modifiés appliqués" |
| 8 | Order submission | e2e `checkout: 7-8.` (reference, confirmation, tracking page after reload); DB `place_order` |
| 9 | Duplicate prevention | e2e `checkout: 9.` (triple click → 1 order); DB "même clé" (idempotency key); unit demo back end |
| 10 | Administrator login | e2e `admin: 10-11.` |
| 11 | Unauthorized access rejection | e2e `admin: 10-11.` (logged out, wrong password); DB tests: anonymous and non-admin users cannot read orders, change products or settings, or call admin functions |
| 12 | Product creation and editing | e2e `admin: 12.` (create with variants → visible in shop → edit price), editor validation; DB `admin_save_product` (transactional, invalid data rejected, non-admin refused) |
| 13 | Stock updates | e2e `admin: 13.` (stock edit → product page "Plus que 2"; unpublish → 404); DB stock tests; e2e cancellation puts stock back (demo) and DB cancellation puts stock back exactly once |
| 14 | Mobile navigation | e2e `mobile: 14.` (menu, filters sheet, bottom bar, cart, checkout, no horizontal overflow; admin on phone without overflow) |
| 15 | Error handling | e2e: 404 pages, unknown order, checkout validation messages, stock changed during checkout; DB: validation errors, out-of-stock rollback, rate limiting, honeypot |

**Also tested:**
- Payment marked paid by the admin, visible to the customer, and counted in revenue
- Delivery zone settings applied at checkout
- CSV import (e2e + unit: errors reported per line, existing products updated rather than duplicated)
- Contact form
- Favourites
- Legal pages with placeholders
- Open Graph injection and sitemap
- Wave webhook signature verification
- Wave Business payment link: invalid links refused in admin; "Payer avec Wave" button shown after a Wave order; the order stays "payment pending" (e2e + unit)
- Provider payment confirmation (server-only, checks the amount, idempotent)

## 2. What the database tests prove

The tests in `tests/db/` load the real migrations and seed into PostgreSQL 16. A small shim reproduces Supabase's roles, `auth.uid()` and `storage` schema. Each query runs under the `anon` or `authenticated` role with JWT claims, the way PostgREST does. Verified:

- **Prices:**
  - recomputed server-side, so a client-supplied price is ignored
  - promotions and per-variant prices applied
  - rounding identical to the TypeScript code (parity tests)
- **Stock:**
  - reserved atomically, with row locks
  - insufficient stock rolls back the whole order
  - cancelling restocks once
  - a cancelled order cannot be revived
- **Idempotency:** the same key returns the same order, never a second one.
- **RLS:**
  - visitors see only published products and variants
  - no one but admins can read orders, messages or subscribers
  - order amounts and statuses cannot be changed by direct `UPDATE`, even by an admin; status changes must go through the logged `admin_update_order`
  - `grant_admin` and `confirm_provider_payment` are not callable through the API
- **Abuse protection:** at most 5 orders per phone per hour (also per IP when available); honeypot fields.
- **Dashboard:** counts real (non-test) orders only.
- **Demo removal:** deletes demo products without breaking past orders.
- **`installation-complete.sql`:** applies cleanly to an empty database.

## 3. Measured performance (Lighthouse 12, local `vite preview`, demo mode)

| Page | Mobile perf. | Desktop perf. | Accessibility | Best practices | SEO* | CLS (m/d) | LCP mobile |
|---|---|---|---|---|---|---|---|
| `/` | 90 | 100 | 100 | 100 | 92 | 0 / 0.015 | 3.1 s |
| `/boutique` | 88 | 100 | 99 | 100 | 92 | 0.05 / 0.02 | 3.4 s |
| `/produit/…` | 90 | 100 | 100 | 100 | 92 | 0 / 0.001 | 3.2 s |

*These Lighthouse scores were measured before the 10 November visual update (animations, carousels), which was not re-measured with Lighthouse. Layout shift was re-checked after it with a browser script: CLS ≤ 0.007 on `/`, `/boutique` and a product page, desktop and mobile.*

*The `/boutique` row was measured **before** the final layout-shift fix (the announcement bar appearing after load). It was not re-measured; `/` and `/produit/…` were.*

*The SEO deduction is only the `robots.txt` audit: in local preview, `/robots.txt` falls through to the app, because it is served by a Netlify edge function in production.*

*Mobile LCP uses Lighthouse's simulated slow 4G, without Netlify's compression or CDN. Real-world numbers on the deployed site will differ: measure them after deployment.*

## 4. Not tested in this environment (and why)

| Item | Reason | What to do |
|---|---|---|
| The **Supabase client adapter** (`src/backend/supabase.ts`) against a real Supabase project, including Auth login, password reset e-mails and Storage photo upload | No Supabase project or credentials; the sandbox could not reach supabase.com. The SQL it calls *was* tested on PostgreSQL, and the UI flows were tested against the demo back end, which implements the same interface | After deployment, run `docs/LAUNCH-CHECKLIST.md` §D by hand (≈15 minutes) |
| Storage RLS policies (`20261108000003_storage.sql`) | Applied to a shim schema only | Upload a photo from the admin, and confirm that an anonymous upload is refused |
| Netlify edge functions at runtime (Deno) | No Netlify runtime here; their pure logic (meta injection, sitemap) is unit-tested | Check `/sitemap.xml`, `/robots.txt` and a WhatsApp link preview after deploy |
| Wave webhook against Wave's real API | No Wave Business account; signature format to be confirmed with Wave's docs | See DEPLOYMENT §4. **Manual confirmation remains the default** |
| The live original site | The sandbox network policy blocked `byamashop.netlify.app` | Audit based on the ZIP only |
| Real photography | No access to image sources; demo visuals are generated SVG illustrations, clearly labelled | Replace with real photos |
| Real-device testing (iOS Safari, low-end Android) | Only Chromium emulation was available | Test on 2–3 real phones before launch |

## 5. Known limitations and open points

- **Legal texts are templates**, not legal advice, and must be reviewed. Points flagged while drafting them:
  1. Whether Loi n° 2008-12 on personal data is still the law in force: a new data-protection law was in preparation.
  2. The exact reference of the consumer-protection law (Loi n° 2021-25) was not cited by name.
  3. No statutory cooling-off period is claimed: returns are presented as shop policy.
  4. CDP declaration and authorisation for data transfers abroad (Netlify in the USA, Supabase region, Meta/WhatsApp).
  5. Retention periods, data-breach notification, VAT/TTC wording, competent court and capital are left as placeholders.
- **Online payment** is manual confirmation only. Wave checkout redirection and the Orange Money API are not implemented.
- **Newsletter:** opt-ins are stored with consent, but the site sends no e-mails. Export the list to an e-mailing tool.
- **Customer accounts:** none (guest checkout). Customers track orders through a private link shown after checkout and kept on their device.
- **Catalogue scale:** search and filtering run in the browser, which is suitable up to roughly 1–2 000 products (see AUDIT §3).
- **Saving a product:** product, variants and photos are saved in one transaction (`admin_save_product`). Photo files are uploaded first, so an abandoned edit can leave unused files in Storage. This is harmless but takes space.
- **Bundle:** about 220 kB gzip of JavaScript on first load, including the Supabase client. Admin, checkout and secondary pages are lazy-loaded.
- **Demo illustrations:** some are weaker (hooded garments, folded items, the children's wax flat-lay). They are placeholders by design.
