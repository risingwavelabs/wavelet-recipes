# Fraud Watchdog

Real-time fraud detection agent that monitors payment transactions, flags suspicious users, and triggers webhook alerts.

## What it shows

- 4 live metrics: total transactions, total volume, flagged users, countries
- Transaction volume by country (bar chart)
- Flagged users card with severity classification and triggered rules
- Live transaction feed with fraud highlighting

The seed script generates normal user transactions for 8 seconds, then injects fraud patterns (high frequency, multi-country, large amounts). The agent receives webhook alerts and logs color-coded alerts to the console.

## Run

```bash
curl -L https://risingwave.com/sh | sh   # install RisingWave (if not already)
npm install @risingwave/wavelet
npx wavelet dev --config wavelet.config.ts &
node agent.js &
node seed.js &
open index.html
```

## Config

```typescript
events: { transactions: { columns: { user_id, amount, currency, merchant, country, card_type, ts } } }

queries: {
  user_activity:        per-user SUM, COUNT, AVG, MAX, DISTINCT country
  geo_distribution:     volume by country
  suspicious_users:     users with COUNT > 20 OR countries > 3 OR max > $5000 (webhook)
  recent_transactions:  last 30 transactions
}
```

## What to try

1. Open the dashboard and watch normal transactions flow
2. After ~8 seconds, fraud users appear — watch the flagged card light up
3. Check the agent console for detailed webhook alerts with severity classification
4. Stop `seed.js` — updates stop immediately
5. Restart `seed.js` — fraud detection resumes
