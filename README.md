# Live Green Honey

Premium e-commerce site for **Live Green Honey** — a direct-from-farm raw honey brand. Full storefront plus an admin panel for catalog, orders, payments, logistics, marketing, and analytics.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, React Router 7, Vite 6, TypeScript |
| Styling | Tailwind CSS v4, Motion, GSAP, Lenis |
| Backend | Express 4 (single `server.ts`), Node + tsx |
| Database | PostgreSQL (Supabase) via `pg` |
| Auth | JWT (admin), bcrypt password hashing |
| Payments | Razorpay |
| Logistics | iCarry (shipping estimate, booking, tracking) |
| AI | Hugging Face / Gemini chat proxy |
| Deploy | Vercel (serverless function wraps the Express app) |

## Features

**Storefront**
- Product catalog, detail pages, quick view, zoom, compare, wishlist
- Cart, Razorpay + COD checkout, promo codes, bundles, gift cards
- Subscriptions, order tracking, referrals
- Blogs, recipes, honey-map, health calculator, FAQ
- Reviews, Google reviews, video testimonials, NPS survey
- SEO tags, dark mode, PWA (service worker + manifest)

**Admin panel** (`/admin`)
- Dashboard & analytics (revenue, CLV, CAC, NPS, CSAT, traffic)
- Orders (with iCarry shipment booking/retry), customers, subscriptions
- Products, blogs, bundles, promo codes
- Inquiries, reviews, Google reviews, video testimonials
- Email campaigns + abandoned-cart recovery, referrals
- Audit log, notifications, settings, backup

## Getting Started

**Prerequisites:** Node.js 18+, a PostgreSQL database (Supabase recommended).

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env
#    fill in DATABASE_URL, JWT_SECRET, Razorpay & iCarry keys (see below)

# 3. Run dev server (Vite + Express on http://localhost:4502)
npm run dev
```

On first run the server auto-creates all tables and seeds demo products, blogs,
reviews, and an admin user. If `ADMIN_PASSWORD` is not set, a random initial
password is generated and printed to the server logs once — save it and change
it after first login.

## Environment Variables

See [.env.example](.env.example) for the full template.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | yes | Postgres / Supabase connection string |
| `JWT_SECRET` | yes (prod) | Signs admin auth tokens. Server refuses to start in production without it. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | no | Initial admin account (seeded once). Random password if unset. |
| `RAZORPAY_KEY` / `RAZORPAY_SECRET` | for payments | Razorpay API credentials |
| `ICARRY_USERNAME` / `ICARRY_KEY` | for shipping | iCarry API credentials |
| `ICARRY_PICKUP_ADDRESS_ID` | for shipping | Pickup address ID from the iCarry dashboard |
| `HF_API_KEY` | optional | Hugging Face key for the AI chat feature |

> Keep secrets out of git. In production set these as Vercel environment variables.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite + Express dev server (port 4502) |
| `npm run build` | Production build to `dist/` |
| `npm start` | Run the Express server (`tsx server.ts`) |
| `npm run preview` | Preview the production build |
| `npm run lint` | Type-check (`tsc --noEmit`) |
| `npm run clean` | Remove `dist/` |

## Project Structure

```
server.ts              Express API — all routes, DB init/migrations, integrations
api/index.ts           Vercel serverless entry (wraps the Express app)
src/
  App.tsx              Routes + global error boundary
  pages/               Storefront + admin pages
  components/          UI components
    admin/             Admin panel tabs
  context/             Auth, Cart, Wishlist providers
  lib/
    api.ts             Typed fetch client for all endpoints
    db.ts              Postgres pool wrapper (SQL translation, column mapping)
    icarry.ts          iCarry logistics client
public/                Static assets (images, videos, PWA files)
```

## Architecture Notes

- **Single Express app** serves the API and (in production) the built SPA. The
  same `app` runs locally via `tsx` and on Vercel as a serverless function.
- **Schema is code-managed:** `initDB()` in `server.ts` creates tables and runs
  idempotent column migrations on every boot — no separate migration tool.
- **DB layer** ([src/lib/db.ts](src/lib/db.ts)) translates `?` placeholders to
  `$n`, auto-appends `RETURNING id` on inserts, and maps snake_case columns to
  the camelCase the frontend expects.

## Deployment (Vercel)

1. Import the repo into Vercel (framework: Vite).
2. Set all environment variables in the Vercel project settings.
3. Deploy. `vercel.json` rewrites API/admin routes to the serverless function
   and serves the SPA for everything else.

## Payments & Logistics Flow

1. Checkout calls `create_razorpay_order` — the server recomputes the total from
   DB prices (never trusts client amounts) and pre-inserts a `pending` order.
2. After payment, `verify_razorpay_payment` validates the Razorpay signature
   (timing-safe), marks the order `paid`, updates stock and customer records.
3. An iCarry shipment is then booked automatically. Any booking error is stored
   on the order (`icarry_error`) and can be retried from the admin Orders tab.
