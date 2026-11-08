# Deployment guide: Supabase + Netlify

Both services have free tiers that cover a small boutique. **Create both accounts with the store owner's own e-mail address**, so that she owns the site, the data and the billing. A developer can be invited as a collaborator.

> ⚠️ **Do not deploy over the current live site** (`byamashop.netlify.app`) without the owner's explicit agreement. The safest path:
> 1. Deploy to a **new** Netlify site.
> 2. Check it.
> 3. Then switch the domain or site name.

---

## 1. Supabase (database, login, photos)

1. **Create the project.**
   - Go to https://supabase.com and click **New project**.
   - Region: pick the closest available region to Senegal (e.g. *West EU (Paris/London)*). Note it for the privacy policy.
   - Keep the database password somewhere safe (a password manager). It is **not** needed by the site.
2. **Create the tables, security rules and demo content.**
   - **Without the command line:** open **SQL Editor › New query**, paste the whole content of `supabase/installation-complete.sql`, then click **Run**. Do this once, on a new project.
   - **With the Supabase CLI:**
     ```bash
     supabase link --project-ref <ref>
     supabase db push
     psql "$DB_URL" -f supabase/seed.sql
     ```
3. **Check the photo storage.** **Storage** should list a public bucket called `product-images`. The migration creates it.
4. **Create the owner's admin account.**
   1. Go to **Authentication › Users › Add user › Create new user**. Enter the owner's e-mail and a strong password (at least 12 characters), and tick *Auto confirm user*.
   2. In the **SQL Editor**, run:
      ```sql
      select public.grant_admin('owner@example.com');
      ```
      You should see `Accès administrateur accordé à …`. Only accounts listed in `admin_users` can access `/admin`. Any other account is refused by the database itself.
5. **Configure authentication.**
   1. **Authentication › Providers › Email:** keep e-mail login on.
   2. **Authentication › Sign In / Providers:** turn **off** *Allow new users to sign up*. Customers do not need accounts, and nobody should be able to self-register.
   3. **Authentication › URL Configuration:**
      - *Site URL* = the final site address.
      - Add `https://<your-site>/admin/mot-de-passe` to *Redirect URLs*. This is needed for password reset e-mails.
   4. Optional: configure a custom SMTP sender, so reset e-mails come from the shop's address.
6. **Copy the API keys.** Under **Project Settings › API**, copy the *Project URL* and the *anon public* key. **Never** put the `service_role` key in a `VITE_` variable or in the front end.

## 2. Netlify (hosting)

1. **Push this repository** to a GitHub account the owner controls, or give her access to it.
2. **Create the site.** In Netlify, click **Add new site › Import an existing project** and choose the repository. `netlify.toml` already sets the build:
   - build command: `npm run build`
   - publish directory: `dist`
   - Node 22
3. **Set the environment variables.** Go to **Site configuration › Environment variables**:

   | Variable | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | Supabase Project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase anon public key |
   | `VITE_SITE_URL` | `https://<final address>` (no trailing slash) |

   Leave `VITE_DEMO_MODE` empty. Do not set the Wave variables yet (see §4).
4. **Deploy.** Then open:
   - `/`: the demo banner must **not** appear.
   - `/admin`: log in with the owner account.
   - `/sitemap.xml` and `/robots.txt`
5. **Domain (optional).** Under **Domain management**, add a custom domain such as `byamashop.sn`. HTTPS is automatic. Update `VITE_SITE_URL`, the Supabase *Site URL* and the redirect URL, then redeploy.

### Content Security Policy

`netlify.toml` allows connections and images only to the site itself and `*.supabase.co`. If you add an analytics tool, a chat widget or an external image host, add its domain to the CSP, or it will be blocked.

## 3. Going from demo to real catalogue

1. In `/admin/reglages`, fill in the contact details, the **payment numbers** (Wave / Orange Money), the delivery zones and fees, and the legal information.
2. Add real products, either one by one or with **Produits › Importer (CSV)**.
3. Rewrite the legal pages (Réglages › Pages) and have them reviewed.
4. Replace the homepage and category images (Réglages › Page d'accueil, Catalogue › Catégories). The editorial images in `public/demo/editorial/` are illustrations.
5. **Réglages › Catalogue de démonstration › Supprimer le contenu de démonstration.** This removes every `is_demo` product and collection and nothing else. Past orders keep their line names and prices.
6. Place one real **test order**. In the admin, tick *Commande de test* so it is excluded from statistics, then cancel it to put the stock back.

## 4. Optional: automatic Wave confirmation

By default, Wave and Orange Money are in **manual confirmation mode**: an order stays "Paiement en attente" until the owner marks it paid after checking her Wave or Orange Money account. Nothing in the site claims a payment is received before that.

The repository includes a webhook endpoint for Wave Checkout (`netlify/functions/wave-webhook.ts`, path `/api/paiements/wave/webhook`). It:
- verifies the `Wave-Signature` HMAC
- calls `confirm_provider_payment`, which only marks an order paid if the amount and currency match exactly

To activate it you need a **Wave Business** account with API access. Then:
1. Set `WAVE_WEBHOOK_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` in Netlify. These are server-side only, with no `VITE_` prefix.
2. Register the webhook URL in the Wave Business portal.
3. **Before relying on it:**
   - Check the signature format and event payload against Wave's current documentation. The implementation follows the `t=…,v1=…` HMAC-SHA256 scheme and the `checkout.session.completed` event. It was unit-tested but **not tested against Wave's live API**.
   - Creating Wave checkout sessions (redirecting the customer to Wave) is **not implemented**. It needs the Wave API key and a server function that calls `POST /v1/checkout/sessions` with `client_reference = order reference`.

Orange Money (Sonatel) web payment needs a merchant contract and API credentials. Only manual mode is provided.

## 5. Maintenance

- **Backups:** Supabase free tier keeps daily backups for a limited time. Export the orders regularly (Commandes › Exporter CSV) or upgrade the plan.
- **Free-tier pause:** inactive free Supabase projects can be paused after a week without traffic. A live shop normally has traffic. Check the Supabase dashboard if the site shows "Impossible de charger la boutique".
- **Future schema changes:** add a new numbered file to `supabase/migrations/`. Never edit an applied migration.
- **New tables:** Supabase grants default privileges to `anon`/`authenticated` on new tables in `public`. Always add `enable row level security` and explicit grants, as the existing migrations do.
