This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Distribution CRM (MVP)

SaaS-style distribution management: multi-tenant, with **API** and **frontend** in Next.js (App Router).

### Features

- **Auth:** Register company (tenant) + first user, login, session (JWT cookie).
- **Dashboard:** Counts (distributors, agents, stores, products, orders), revenue, recent orders.
- **Territories:** List and create (used by agents/stores).
- **Distributors / Agents / Stores:** CRUD (list + add new).
- **Catalog:** Categories and brands per distributor (required for products).
- **Products:** List and add (category, brand, pricing, inventory).
- **Orders:** List and create store orders with line items.

### Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` (and optionally `JWT_SECRET`, `NEXT_PUBLIC_APP_URL`).
2. Ensure MongoDB is running (e.g. `mongodb://localhost:27017`).
3. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).
4. Use **Register** to create a company and first user, then sign in.

### API routes (all under `/api`)

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET|POST /api/territories`, `GET|POST /api/distributors`, `GET|PATCH|DELETE /api/distributors/[id]`
- `GET|POST /api/agents`, `GET|POST /api/stores`, `GET|POST /api/categories`, `GET|POST /api/brands`
- `GET|POST /api/products`, `GET|POST /api/orders`
- `GET /api/dashboard` (stats for current tenant)

Protected routes use the session cookie; tenant is inferred from the logged-in user.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
