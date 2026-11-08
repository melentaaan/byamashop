# Pre-launch checklist

Nothing below has been invented in the code. Every business fact is either taken from the original site (marked **(orig.)**, still to be confirmed) or left as an explicit placeholder.

## A. Accounts and credentials (owner-controlled)

| Item | Where it goes | Status |
|---|---|---|
| Supabase project, created with the owner's e-mail | Netlify env `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | ☐ to create |
| Owner admin user + `select public.grant_admin('…')` | Supabase | ☐ |
| "Allow new users to sign up" turned off | Supabase › Auth | ☐ |
| Auth redirect URL `https://<site>/admin/mot-de-passe` | Supabase › Auth › URL configuration | ☐ |
| Netlify site, created with the owner's e-mail | — | ☐ |
| Final public address (`VITE_SITE_URL`), optional domain (e.g. `.sn`) | Netlify | ☐ |
| Optional custom SMTP for password e-mails | Supabase › Auth › SMTP | ☐ optional |
| Wave Business API + webhook secret (only for automatic confirmation) | Netlify env `WAVE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` | ☐ optional, see DEPLOYMENT §4 |
| Orange Money merchant API | not implemented (manual mode) | — |

## B. Business information to provide (admin › Réglages)

| Item | Current value |
|---|---|
| WhatsApp number | `221764091727` **(orig.)**: confirm |
| Displayed phone | `+221 76 409 17 27` **(orig.)**: confirm |
| Address | "Dakar, Sénégal" **(orig.)**: give the neighbourhood or pick-up point if any |
| Contact e-mail | empty |
| Opening hours | empty |
| Instagram / TikTok / Facebook / Snapchat links | empty (the original had `#` placeholders) |
| **Wave receiving number and name** | empty: customers are told the number will be given at confirmation |
| **Orange Money receiving number and name** | empty |
| Cash on delivery: offered? In which zones? | enabled **(orig.)**: confirm |
| Delivery zones and fees: Dakar 1 500, Pikine/Guédiawaye/Rufisque 2 000, Thiès/Mbour 3 000, other regions 4 000, pick-up free | **(orig.)**: confirm |
| Delivery times: "Dakar 24 h", "régions 48–72 h" | **(orig.)**: confirm, these are displayed as indications |
| Pick-up location and arrangements | to define |
| Return / exchange policy (the original site said "Échange possible sous 48h") | to define in Réglages › Pages |
| Legal name, legal form, NINEA, RCCM, publication director | empty: required for the legal notice |
| What "Lasalmah" is (brand, partner, product line) and its description | unknown: the category text says "à compléter" |
| What "Ensembles chez Cathy" is (partner boutique?) | unknown: legal notice placeholder |

## C. Content

- ☐ Real products with real photos, prices and stock (CSV import available).
- ☐ Delete the demonstration catalogue (Réglages › Catalogue de démonstration).
- ☐ Replace the homepage hero image, the banner and the category covers. They are illustrations from `public/demo/`.
- ☐ Rewrite the "À propos" text in the owner's own words.
- ☐ Fill in every **"À COMPLÉTER"** in the legal pages, then have **a legal professional review** them. Points to check are listed in `docs/VERIFICATION-REPORT.md` §5.
- ☐ Check whether a declaration to the **CDP** (Commission de Protection des Données Personnelles) is required for customer data processing.
- ☐ Note the Supabase region in the privacy policy (cross-border transfer).

## D. Final checks on the deployed site

- ☐ No "Site de démonstration" banner on the public site.
- ☐ Place a real order from a phone, mark it *test*, confirm it, mark it paid, cancel it, and check that the stock returns.
- ☐ Share a product link on WhatsApp and check the preview (image, title, price).
- ☐ `/sitemap.xml` lists products with the final domain. Submit it in Google Search Console.
- ☐ Run Lighthouse on the deployed URL (scores were **not** measured in this environment).
- ☐ Password reset e-mail works.
- ☐ Export orders (CSV) to confirm backups work.
