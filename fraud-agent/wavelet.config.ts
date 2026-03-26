import { defineConfig, sql } from '@risingwave/wavelet'

export default defineConfig({
  database: process.env.WAVELET_DATABASE_URL ?? 'postgres://root@localhost:4566/dev',

  events: {
    transactions: {
      columns: {
        user_id: 'string',
        amount: 'float',
        currency: 'string',
        merchant: 'string',
        country: 'string',
        card_type: 'string',
        ts: 'timestamp',
      }
    }
  },

  queries: {
    // Per-user transaction summary
    user_activity: sql`
      SELECT
        user_id,
        COUNT(*) AS tx_count,
        SUM(amount) AS total_amount,
        AVG(amount)::INT AS avg_amount,
        MAX(amount) AS max_amount,
        COUNT(DISTINCT country) AS country_count
      FROM transactions
      GROUP BY user_id
      ORDER BY total_amount DESC
    `,

    // Geographic distribution
    geo_distribution: sql`
      SELECT
        country,
        COUNT(*) AS tx_count,
        SUM(amount) AS total_amount
      FROM transactions
      GROUP BY country
      ORDER BY total_amount DESC
    `,

    // Suspicious activity — high frequency OR multi-country OR large amounts
    suspicious_users: {
      query: sql`
        SELECT
          user_id,
          COUNT(*) AS tx_count,
          SUM(amount) AS total_amount,
          AVG(amount)::INT AS avg_amount,
          MAX(amount) AS max_amount,
          COUNT(DISTINCT country) AS country_count
        FROM transactions
        GROUP BY user_id
        HAVING
          COUNT(*) > 20
          OR COUNT(DISTINCT country) > 3
          OR MAX(amount) > 5000
      `,
      webhook: process.env.WEBHOOK_URL ?? 'http://localhost:3001/webhook',
    },

    // Recent transactions for live feed
    recent_transactions: sql`
      SELECT user_id, amount, currency, merchant, country, card_type, ts
      FROM transactions
      ORDER BY ts DESC
      LIMIT 30
    `,
  },
})
