# Wavelet Recipes

Ready-to-run examples for [Wavelet](https://github.com/risingwavelabs/wavelet), the reactive backend for agents and apps.

Each recipe is a self-contained project. Install, run, open the browser. Data generates automatically.

## Recipes

### Live Dashboards

| Recipe | What it does | Key features |
|--------|-------------|--------------|
| [SaaS Revenue Dashboard](saas-dashboard/) | Real-time revenue, orders, product breakdown | Aggregation queries, Chart.js, WebSocket |
| [Stock Ticker](stock-ticker/) | Live stock prices with VWAP, buy/sell pressure | Random-walk prices, dark terminal theme |
| [CDC Dashboard](cdc-dashboard/) | Postgres changes become a live dashboard instantly | Postgres CDC, JOIN queries, zero event streams |

### Agent Monitoring (Webhook)

| Recipe | What it does | Key features |
|--------|-------------|--------------|
| [SLA Guardian](sla-guardian/) | API latency and error rate monitoring with alerts | P99/P95, webhook on SLA breach |
| [Spend Control](spend-control/) | AI/cloud cost tracking with automated budget enforcement | Webhook + write-back closed loop |
| [Fraud Watchdog](fraud-watchdog/) | Transaction fraud detection with anomaly alerts | Multi-rule detection, severity classification |

### Multi-Tenant

| Recipe | What it does | Key features |
|--------|-------------|--------------|
| [Tenant-Isolated Metrics](tenant-metrics/) | Same dashboard, different data per tenant | JWT filterBy, server-side row filtering |

## Quick Start

```bash
# Pick a recipe
cd wavelet-recipes/sla-guardian

# Start Wavelet
npx wavelet dev --config wavelet.config.ts &

# Start the data generator
node seed.js &

# For agent recipes, start the webhook receiver
node agent.js &

# Open the dashboard
open index.html
```

## Recipe Structure

Each recipe directory contains:

- `wavelet.config.ts` - event streams, queries, webhook and JWT config
- `index.html` - frontend dashboard that subscribes to queries via WebSocket
- `seed.js` - data generator that feeds the event streams
- `README.md` - what the recipe demonstrates and how to run it

Agent recipes also include:

- `agent.js` - webhook receiver that acts on alerts from Wavelet

CDC recipes include:

- `setup.sql` - source database schema and seed data
- `simulate.js` - script that inserts rows into the source database

## License

Apache 2.0. See [LICENSE](./LICENSE).
