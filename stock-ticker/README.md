# Stock Ticker

Real-time stock price tracking with VWAP, volume, buy/sell pressure, and a live trade tape.

## What it shows

- 4 live metrics: total volume, trade count, active symbols, buy/sell ratio
- Ticker board with per-symbol VWAP, high/low range, and volume (prices flash green/red on change)
- Volume by symbol (bar chart)
- Buy vs sell pressure (grouped bar chart)
- Trade tape showing recent trades with buy/sell coloring

All data updates automatically. The seed script generates ~15 trades/second across 7 symbols with continuous random-walk prices.

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
streams: { trades: { columns: { symbol, price, volume, side, ts } } }

views: {
  ticker:           VWAP, volume, trade_count, high, low GROUP BY symbol
  volume_chart:     SUM(volume), COUNT(*) GROUP BY symbol
  market_pressure:  buy_volume vs sell_volume GROUP BY symbol
  trade_tape:       last 40 trades
}
```

## What to try

1. Open the dashboard and watch prices walk
2. Stop `seed.js` -- prices freeze immediately
3. Restart `seed.js` -- prices resume from where they left off
4. Add a new symbol in `seed.js` -- it appears on the ticker board automatically
