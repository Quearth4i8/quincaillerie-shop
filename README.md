# Quincaillerie en ligne

Online hardware store for Tunisia. Customers order on the website or by phone/WhatsApp, the shop calls them to confirm, and the order is delivered and paid in cash on delivery.

**Stack:** Next.js 16 (App Router, Server Actions), React 19, TypeScript, Tailwind CSS 4, Supabase (Postgres, Auth, Storage, Realtime), Zustand (cart), Zod (validation).

---

## 1. Requirements

- Node.js **20.9+** (22 LTS recommended)
- A free Supabase project: https://supabase.com

## 2. Set up Supabase

1. Create a project in Supabase.
2. Open **SQL Editor → New query**, paste the whole of [`supabase/01_schema.sql`](supabase/01_schema.sql) and click **Run**.
3. In a new query, run [`supabase/02_seed.sql`](supabase/02_seed.sql). It adds the 24 gouvernorats, the categories and 10 sample products. This step is optional, and the sample products can be deleted later.
4. In a new query, run [`supabase/03_chat.sql`](supabase/03_chat.sql). It adds the customer service chat (the "Discuter avec nous" button on the shop, answered from **Gestion → Messages**).
5. Go to **Authentication → URL Configuration**:
   - **Site URL**: `http://localhost:3000` (your real domain once the site is online)
   - **Redirect URLs**: add `http://localhost:3000/auth/callback` (and `https://your-domain/auth/callback` later)
6. Optional: under **Authentication → Sign In / Providers → Email**, turn off **Confirm email** so that new customers are signed in immediately, without the confirmation e-mail.

## 3. Configure the app

Fill in `.env.local` (values come from **Project Settings → API** in Supabase):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Only the **public** (anon/publishable) key is used. Never put the `service_role` key in this project: all permissions are enforced by Row Level Security in the database.

## 4. Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## 5. Create the admin and manager accounts

1. Sign up on the site (`/inscription`) with the shop owner's e-mail.
2. In the Supabase **SQL Editor**, run:

   ```sql
   update public.profiles
      set role = 'admin'
    where id = (select id from auth.users where email = 'owner@example.com');
   ```

3. Log in again. You land on `/admin`.
4. **Managers / employees:** they sign up on the site, then the admin changes their role in **Admin → Utilisateurs & rôles**. Only an admin can change roles, and the database enforces this too.

## 6. Roles and pages

| Role | Can access | Main pages |
|---|---|---|
| **Visitor** (no account) | Shop, cart, ordering | `/`, `/produits`, `/produit/[slug]`, `/panier` |
| **Client** (`customer`) | + their own orders and profile | `/compte`, `/compte/commandes/[id]` |
| **Gérant** (`manager`) | + orders, phone orders, products, categories | `/gestion/*` |
| **Admin** (`admin`) | + statistics, users & roles, delivery fees, shop settings | `/admin/*` and `/gestion/*` |

### Order flow

1. The customer orders on the site, with or without an account. The order is **En attente d’appel** (pending).
2. A manager calls the customer and clicks **Client appelé · confirmer**. The order becomes **Confirmée**.
3. **Remettre au livreur** sets it to **En livraison**, and **Livrée et payée** to **Livrée**.
4. Orders taken by phone (**Gestion → Commande téléphone**) are created already confirmed.

Stock is deducted when an order is placed and is returned automatically if the order is cancelled. Prices are always re-read from the database; the price sent by the browser is never trusted. New orders appear live in the back office through Supabase Realtime.

## 7. What to customize first

From **Admin → Paramètres boutique**: shop name, phone number, WhatsApp number, address, opening hours.
From **Admin → Zones de livraison**: the real delivery fee and delay for each gouvernorat (the seeded fees are placeholders).
From **Gestion → Produits**: real products and photos (stored in the Supabase `product-images` bucket, 5 MB max per photo).

## 8. Deploying

The easiest option is **Vercel**:

1. Push the project to GitHub and import it in Vercel.
2. Add the three environment variables from `.env.local`, setting `NEXT_PUBLIC_SITE_URL` to the real domain.
3. In Supabase, update the **Site URL** and **Redirect URLs** to the real domain.

## Project structure

```
supabase/
  01_schema.sql        tables, roles, RLS policies, order functions, storage, realtime
  02_seed.sql          gouvernorats, categories, sample products
  03_chat.sql          customer service chat: conversations, messages, chat functions, realtime
src/
  proxy.ts             refreshes the session, protects /compte /gestion /admin
  app/
    (shop)/            public shop and customer account (header + footer layout)
    gestion/           manager back office
    admin/             admin back office
    actions/           server actions (orders, catalog, auth, profile, admin)
    auth/callback/     e-mail confirmation and password-reset links
  components/
    shop/              storefront components
    admin/             back-office components
    ui/                shared bits (status badge, form messages, buttons)
  lib/                 Supabase clients, auth helpers, formatting, types
  store/cart.ts        cart (saved in the browser)
```

## Troubleshooting

- **"Configuration requise" page:** `.env.local` is empty or the server was not restarted after editing it.
- **"Livraison non disponible pour ce gouvernorat":** the gouvernorat is disabled or missing in **Admin → Zones de livraison** (run `02_seed.sql`).
- **Photo upload fails:** the user must be a manager or admin, and `01_schema.sql` must have run fully, since it creates the `product-images` bucket.
- **E-mail confirmation link fails:** check the Redirect URLs from step 2.4.
- **No live alerts for new orders:** in Supabase **Database → Publications**, check that `orders` is part of `supabase_realtime` (the schema script adds it).
