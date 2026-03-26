# CDC Dashboard — Postgres to Real-time

Turn any PostgreSQL database into a live dashboard. No event streams, no message queues, no custom ingestion code — wavelet watches your source database directly via Change Data Capture (CDC).

When a row changes in Postgres, the dashboard updates instantly.

## What it shows

- 3 live metrics: total orders, total revenue, avg order value
- Revenue by product (bar chart)
- Revenue by category (doughnut chart)
- Recent orders table with live updates

All data comes from a standard PostgreSQL database. Any tool that writes to that database — a Rails app, Django, raw SQL, a cron job — automatically updates the dashboard.

## Prerequisites

- **PostgreSQL** with `wal_level = logical` (required for CDC)
- **RisingWave** (the wavelet runtime)
- **Node.js** 18+ (for the simulation script)

To enable logical replication in PostgreSQL, add this to `postgresql.conf`:

```
wal_level = logical
```

Then restart PostgreSQL.

## Run

### 1. Set up the source database

Create a database and run the setup script:

```bash
createdb shop
psql -d shop -f setup.sql
```

### 2. Install and start wavelet

```bash
curl -L https://risingwave.com/sh | sh   # install RisingWave (if not already)
npm install @risingwave/wavelet

# Point wavelet at your source Postgres
export SOURCE_DATABASE_URL='postgres://postgres:postgres@localhost:5432/shop'
npx wavelet dev --config wavelet.config.ts
```

### 3. Simulate live traffic

In another terminal, install the `pg` module and run the simulation:

```bash
npm install pg
node simulate.js
```

This inserts a random order every 2 seconds. You'll see each insert logged to the console.

### 4. Open the dashboard

```bash
open index.html
```

The dashboard connects to wavelet at `localhost:8080` and updates live as new orders appear in Postgres.

## Config

```typescript
sources: {
  shop: {
    type: 'postgres',
    connection: 'postgres://postgres:postgres@localhost:5432/shop',
    tables: ['orders', 'products'],
  }
}

queries: {
  revenue_by_product:  SUM(quantity * unit_price) GROUP BY product — joins orders + products
  revenue_by_category: SUM(quantity * unit_price) GROUP BY category
  order_stats:         COUNT(*), SUM, AVG across all orders
  recent_orders:       last 20 orders with product info
}
```

## What to try

1. Open the dashboard and watch numbers tick as `simulate.js` runs
2. Stop `simulate.js` — updates stop (no new rows in Postgres)
3. Insert an order manually via `psql` — it shows up immediately:
   ```sql
   INSERT INTO orders (product_id, quantity, unit_price, customer_email)
   VALUES (3, 2, 149.99, 'manual@test.com');
   ```
4. Update a product name — the dashboard reflects the change across all views:
   ```sql
   UPDATE products SET name = 'Pro Keyboard' WHERE id = 3;
   ```
5. Any application that writes to the `shop` database will update the dashboard — no code changes needed

## How CDC works

Wavelet uses PostgreSQL logical replication to subscribe to changes in the source tables. When a row is inserted, updated, or deleted, the change is captured and materialized into the configured queries. The dashboard subscribes to those queries via WebSocket and re-fetches when changes are detected.

No Kafka. No Debezium. No custom event producers. Just Postgres.
