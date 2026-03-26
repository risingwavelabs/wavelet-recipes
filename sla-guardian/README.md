# SLA Guardian

Real-time SLA monitoring agent that watches API metrics and fires webhook alerts when thresholds are breached.

## What it shows

- Live metric cards: total requests, P99 latency, error rate, active services
- P99 latency bar chart per endpoint (bars turn red when over 500ms)
- Error rate chart per service (bars turn red when over 5%)
- SLA violation panel that highlights breached endpoints in real-time
- Recent requests table with color-coded status codes (2xx green, 4xx yellow, 5xx red)
- Webhook agent that receives alerts and logs violations to the console

## Run

```bash
npx wavelet dev --config wavelet.config.ts &
node agent.js &
node seed.js &
open index.html
```

The seed script starts with healthy traffic for the first 10 seconds, then begins injecting latency spikes and 500 errors. Watch the dashboard go from green to red.

## How the webhook works

The `sla_violations` query in `wavelet.config.ts` uses a `HAVING` clause to filter for endpoints where the error rate exceeds 5% or P99 latency exceeds 500ms. When wavelet detects new or updated rows in this materialized view, it sends a POST to the webhook URL (`http://localhost:3001/webhook`). The `agent.js` server receives these alerts and logs the violation details with color-coded output.
