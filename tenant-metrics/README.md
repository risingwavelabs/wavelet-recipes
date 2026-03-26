# Tenant-Isolated Metrics

One dashboard, four tenants, zero client-side filtering. Each tenant sees only its own data — enforced server-side by Wavelet using JWT claims.

## What it demonstrates

- **`filterBy`** — queries declare which column to filter on, and Wavelet automatically restricts results to match the JWT's claim
- **JWT-based data isolation** — the same WebSocket endpoint returns different data depending on the token
- **No client-side filtering** — the frontend never receives rows it shouldn't see; the server strips them before they hit the wire
- **Admin view** — a token without a `tenant_id` claim bypasses the filter, showing aggregate data across all tenants

## How it works

```
wavelet.config.ts
├── events: app_events (tenant_id, event_type, page, user_id, duration_ms, ts)
└── queries:
    ├── tenant_overview   ← filterBy: tenant_id (JWT-gated)
    ├── page_stats        ← filterBy: tenant_id (JWT-gated)
    ├── event_breakdown   ← filterBy: tenant_id (JWT-gated)
    └── global_overview   ← no filter (admin-only in the UI)
```

When a query has `filterBy: 'tenant_id'`, Wavelet reads the `tenant_id` claim from the JWT and appends a `WHERE tenant_id = '...'` condition to the materialized view. Clients cannot override this — the filter is enforced at the query layer.

## Run

```bash
curl -L https://risingwave.com/sh | sh   # install RisingWave (if needed)
npm install @risingwave/wavelet
npx wavelet dev --config wavelet.config.ts &
node seed.js &
open index.html
```

## Generate JWT tokens

```bash
node generate-tokens.js
```

This prints tokens for each tenant (acme, globex, initech, hooli) and an admin token. The dashboard generates tokens client-side for demo convenience — in production, your auth service would issue these.

## What to try

1. **Switch tenants** in the dropdown — metrics, charts, and totals change immediately
2. **Compare tenants** — Acme has 50 users and heavy traffic; Initech has 10 users and light usage
3. **Select Admin / All** — the global comparison table appears, showing all tenants side by side
4. **Stop seed.js** — updates stop; restart it and they resume
5. **Inspect network** — filtered queries return only rows for the selected tenant

## Tenant profiles

| Tenant  | Users | Pattern |
|---------|-------|---------|
| Acme    | 50    | Heavy usage, mostly page views |
| Globex  | 20    | Moderate, balanced event types |
| Initech | 10    | Light usage, longer durations |
| Hooli   | 8     | Heavy but concentrated on /dashboard |

## Key config details

```typescript
// Any query with filterBy is automatically scoped to the JWT's claim
tenant_overview: {
  query: sql`SELECT ... FROM app_events GROUP BY tenant_id`,
  filterBy: 'tenant_id',  // ← this is the magic line
}

// JWT config — tokens are signed with this secret
jwt: {
  secret: 'wavelet-demo-secret-key-change-in-production',
}
```

The frontend connects with `?token=<JWT>` on both REST and WebSocket endpoints. When the user switches tenants, the dashboard closes all connections and reconnects with a new token — the server handles the rest.
