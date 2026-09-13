# BankPal

A personal finance app designed for iPhone use. The planned beta tracks manual
income and expenses in euros, with one account and monthly category budgets.
Offline entry and syncing are planned separately.

## Current state

Manual income and expense entry with euro amounts, dates, preset categories,
and optional descriptions. The list shows the latest 100 transactions by date.
Authentication, budgets, and offline syncing are not implemented yet.
Run locally only until authentication is added; the API currently has no login.

## Development

Use Node.js 24 and npm.

```sh
npm ci
npm run db:migrate:local
npm run dev
```

Open the URL printed by Vite. Development uses a local Worker runtime and local
D1 database; no Cloudflare account is required.

```sh
npm run check
npm test
npm run build
npm run preview
```

`GET /api/health` checks the Worker and database connection. Unknown API routes
return JSON with a 404 status.

## Structure

- `src/`: React interface and styles.
- `worker/`: backend request handling and database queries.
- `shared/`: transaction types and validation used by the browser and backend.
- `migrations/`: versioned database changes.
- `tests/`: amount and validation tests.
- `wrangler.jsonc`: Cloudflare deployment and D1 configuration.
- `.github/workflows/check.yml`: GitHub type checking and build checks.

## Deployment

GitHub stores the source; Cloudflare runs the app. Nothing deploys automatically.
When ready to publish:

1. Sign in with `npx wrangler login`.
2. Create a database with `npx wrangler d1 create bankpal`.
3. Replace the placeholder `database_id` in `wrangler.jsonc` with the returned ID.
4. After authentication is implemented, apply the schema with `npx wrangler d1 migrations apply DB --remote`.
5. Run `npm run check`, `npm test`, and `npm run deploy`.

Implement authentication before adding real financial data. Keep secrets out of
Git; use Wrangler secrets in production and `.dev.vars` locally.

Based on [Cloudflare's React and Vite guide](https://developers.cloudflare.com/workers/vite-plugin/tutorial/).
See [CONTRIBUTING.md](CONTRIBUTING.md) for coding conventions.

## Transactions API

- `GET /api/transactions`: latest 100 entries, ordered by date.
- `POST /api/transactions`: JSON containing `type` (`income` or `expense`),
  positive integer `amountCents`, `date` (`YYYY-MM-DD`), `category`, and
  `description` (up to 200 characters). Categories are defined in
  `shared/transactions.ts`. Successful creation returns HTTP 201.

Amounts accept a decimal point or comma in the form, with up to two decimal
places. Saving requires an internet connection. If a connection fails during a
save, refresh the list before retrying to avoid a duplicate entry.
