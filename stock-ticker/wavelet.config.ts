import { defineConfig, sql } from '@risingwave/wavelet'

export default defineConfig({
  database: process.env.WAVELET_DATABASE_URL ?? 'postgres://root@localhost:4566/dev',

  events: {
    trades: {
      columns: {
        symbol: 'string',
        price: 'float',
        volume: 'int',
        side: 'string',
        ts: 'timestamp',
      }
    }
  },

  queries: {
    // Latest price per symbol with running stats
    ticker: sql`
      SELECT
        symbol,
        (SUM(price * volume) / SUM(volume))::FLOAT AS vwap,
        SUM(volume) AS total_volume,
        COUNT(*) AS trade_count,
        MIN(price)::FLOAT AS low,
        MAX(price)::FLOAT AS high
      FROM trades
      GROUP BY symbol
      ORDER BY total_volume DESC
    `,

    // Volume by symbol for the bar chart
    volume_chart: sql`
      SELECT
        symbol,
        SUM(volume) AS total_volume,
        COUNT(*) AS trades
      FROM trades
      GROUP BY symbol
      ORDER BY total_volume DESC
    `,

    // Buy vs sell pressure
    market_pressure: sql`
      SELECT
        symbol,
        SUM(volume) FILTER (WHERE side = 'buy') AS buy_volume,
        SUM(volume) FILTER (WHERE side = 'sell') AS sell_volume
      FROM trades
      GROUP BY symbol
    `,

    // Recent trades tape
    trade_tape: sql`
      SELECT symbol, price, volume, side, ts
      FROM trades
      ORDER BY ts DESC
      LIMIT 40
    `,
  },
})
