# SaaS Revenue Dashboard

Real-time revenue dashboard with per-tenant JWT filtering.

## What it shows

- 4 live metrics: total revenue, order count, avg order value, active tenants
- Revenue by product (bar chart)
- Revenue by region (doughnut chart)
- Recent orders table with live updates

All data updates automatically. The seed script generates ~15 orders/second across 5 tenants.

## Run

```bash
curl -L https://risingwave.com/sh | sh   # install RisingWave (if not already)
npm install @risingwave/wavelet
npx wavelet dev --config wavelet.config.ts &
node seed.js &
open index.html
```

## Config

```typescript
streams: { orders: { columns: { tenant_id, amount, product, region, ts } } }

views: {
  tenant_revenue:      SUM(amount), COUNT(*) GROUP BY tenant_id -- filterBy: tenant_id
  revenue_by_product:  SUM(amount), COUNT(*) GROUP BY product
  revenue_by_region:   SUM(amount), COUNT(*) GROUP BY region
  recent_orders:       last 20 orders
}
```

## What to try

1. Open the dashboard and watch numbers tick
2. Stop `seed.js` -- updates stop immediately
3. Restart `seed.js` -- updates resume
4. Add a new view to `wavelet.config.ts`, restart `wavelet dev` -- it appears automatically
