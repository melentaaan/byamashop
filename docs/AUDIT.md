# Audit of the original site and architecture decisions

## 1. What was inspected

- **The source ZIP** (`byamashop_1.zip`), kept unchanged in `docs/original-site/`:
  - `index.html`, `app.js`, `products.js`, `style.css`, `merci.html`, `netlify.toml`, `assets/logo.svg`, `assets/favicon.svg`, `LISEZMOI.md`
  - about 880 lines in total
- **The live site** `https://byamashop.netlify.app/` **could not be fetched from the build environment.** Its network policy blocked the host (HTTP 403 at the proxy). The audit is therefore based on the ZIP only. If the live site differs from the ZIP, those differences were not reviewed.

## 2. Findings

### Technology
The original is a static one-page site: vanilla HTML/CSS/JS, Poppins from Google Fonts, hosted on Netlify. The catalogue is hard-coded in `products.js`, and editing products means editing code.

### Working features worth keeping (all were kept)
- Brand palette and logo:
  - violet `#7C3AED`, magenta `#C026D3`, pink `#FF6FB5`
  - rose `#E11D48` for "shop", green leaf `#16A34A`
  - bag + crescent + star mark
- Categories, WhatsApp number, phone, delivery zones and fees.
- The three payment methods (Wave, Orange Money, cash on delivery).
- Cart in `localStorage`.
- WhatsApp contact.

### Limitations and problems
| # | Issue | Impact |
|---|---|---|
| 1 | **No real order system**: checkout opened WhatsApp with a pre-filled message, then **emptied the cart and showed "Commande envoyée 🎉"** whether or not the message was sent | Orders could be silently lost, and the success message was misleading |
| 2 | Orders were also posted "fire and forget" to Netlify Forms, with no confirmation, reference, stock check or duplicate protection | Unreliable records |
| 3 | No stock management, no variants beyond a size list, no order statuses | Overselling; no fulfilment tracking |
| 4 | No administration: products, prices and settings needed code edits and redeploys | Unusable for a non-developer owner |
| 5 | **Emoji used as product images** (🧕 🌸 🕌 📦) on gradient placeholders | Looked unprofessional |
| 6 | Unverifiable claims: "100% satisfaction", "9 catégories" (8 existed), "Produits vérifiés", "Best-seller" tags | Misleading |
| 7 | Products shown in a modal, with **no product URLs** | Impossible to share or index products; no SEO |
| 8 | Accessibility: modals without focus trap or `role="dialog"`, emoji-only buttons ("🗑", "✕"), no visible focus styles | Keyboard and screen-reader users blocked |
| 9 | Prices calculated only client-side; cart prices trusted from `products.js` | Fine for a WhatsApp-only flow, unsafe for real orders |
| 10 | Category "Produits Alibaba" | Renamed **"Produits importés"** per the brief |
| 11 | Socials were `#` placeholders; Google Fonts loaded from a third party | Dead links; extra third-party request |
| 12 | `netlify.toml` had no security headers | — |

**Security:** the original had no back end, so it had no server-side vulnerabilities. Its HTML escaping (`esc()`) was adequate. The risks were functional (lost or duplicate orders, misleading confirmations), not exploitable flaws.

## 3. Decision: rebuild

Keeping the architecture was **not justified**. Every brief requirement (admin, stock, reliable orders, authorization, product URLs) needs a back end and a component architecture. Brand assets, business data and copy were reused.

| Need | Choice | Why |
|---|---|---|
| UI | **React 19 + TypeScript + Vite** | Typed, component-based, fast builds, code splitting; small runtime compared with a full SSR framework |
| Data, auth, files | **Supabase** (Postgres, Auth, Storage) | Managed, free tier, owner-controllable dashboard. Postgres **row-level security** and `SECURITY DEFINER` functions put pricing, stock and authorization rules *in the database*, so they apply whatever the client does |
| Hosting | **Netlify** (already used) | Static hosting, HTTPS, security headers. Edge functions give share previews and a sitemap without a server framework |
| SEO for an SPA | Edge-injected Open Graph tags + JSON-LD + canonical + sitemap | WhatsApp and Facebook previews don't execute JS. Google renders JS for the rest |
| Payments | Manual confirmation by default; Wave webhook interface behind env vars | No credentials available; payments must never be faked |

**Alternative considered:** Next.js with SSR. It gives slightly better first paint and SEO for product pages. It was rejected because it adds server runtime complexity and cost for a small shop, and edge-injected metadata covers the sharing use case.

**Scale note:** the storefront loads the published catalogue in one request and filters it in the browser. This is instant for hundreds of products (fine up to roughly 1–2 000). Beyond that, move search and pagination to the database.

## 4. Brand changes (and why)

### Logo redesign (10 November 2026, at the owner's request)
- **Mark:** a Moorish arch filled with the brand gradient (pink `#FF6FB5` → magenta `#C026D3` → violet `#7C3AED`), a serif "B" monogram in white, and a gold crescent and star on top. The crescent and star come from the original logo; the arch echoes the shop's prayer and Moroccan ranges.
- **Wordmark:** "Byama" in Cormorant Garamond (deep plum `#2A0F33`) followed by "shop" in Cormorant italic (magenta `#A01BB0`). The name itself is unchanged.
- **Built by** `scripts/build-logo.mjs`. Letters are converted to vector shapes, so no font is needed to display the logo. Cormorant Garamond is under the SIL Open Font License.
- **Raster assets** (`og-image.png`, app icons) are regenerated by `scripts/build-raster-assets.mjs`.
- The first redesign, described below, and the original files in `docs/original-site/assets/` are kept for reference.

### First redesign (8 November 2026)

- **Logo:**
  - Same mark (bag, crescent and star, leaf) and same two-tone wordmark.
  - Text converted to vector paths, so it no longer depends on Poppins being installed.
  - The gradient was harmonised, and "shop" moved from rose-red `#E11D48` to a brand pink-magenta `#E0246F`.
  - The three small coloured bars under the wordmark were removed: they added clutter at small sizes.
  - The original files are in `docs/original-site/assets/`.
- **Palette:** kept, with a deep plum `#2A0F33` for text. Gradients are limited to the logo, thin rules and soft background washes.
- **Typography:** Fraunces (editorial serif, headings) and Plus Jakarta Sans (body), self-hosted. Poppins is kept only inside the logo.
