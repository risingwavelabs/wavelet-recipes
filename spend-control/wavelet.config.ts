import { defineConfig, sql } from '@risingwave/wavelet'

export default defineConfig({
  database: process.env.WAVELET_DATABASE_URL ?? 'postgres://root@localhost:4566/dev',

  events: {
    api_usage: {
      columns: {
        team: 'string',
        model: 'string',
        input_tokens: 'int',
        output_tokens: 'int',
        cost_cents: 'float',
        user_id: 'string',
        ts: 'timestamp',
      }
    },
    agent_actions: {
      columns: {
        team: 'string',
        action: 'string',
        reason: 'string',
        ts: 'timestamp',
      }
    }
  },

  queries: {
    // Per-team spend summary
    team_spend: sql`
      SELECT
        team,
        SUM(cost_cents) / 100.0 AS total_spend_usd,
        COUNT(*) AS total_calls,
        SUM(input_tokens) AS total_input_tokens,
        SUM(output_tokens) AS total_output_tokens
      FROM api_usage
      GROUP BY team
      ORDER BY total_spend_usd DESC
    `,

    // Per-model breakdown
    model_usage: sql`
      SELECT
        model,
        COUNT(*) AS calls,
        SUM(cost_cents) / 100.0 AS spend_usd,
        SUM(input_tokens + output_tokens) AS total_tokens
      FROM api_usage
      GROUP BY model
      ORDER BY spend_usd DESC
    `,

    // Budget alerts — teams exceeding $50 threshold
    budget_alerts: {
      query: sql`
        SELECT
          team,
          SUM(cost_cents) / 100.0 AS total_spend_usd,
          COUNT(*) AS total_calls
        FROM api_usage
        GROUP BY team
        HAVING SUM(cost_cents) / 100.0 > 50
      `,
      webhook: process.env.WEBHOOK_URL ?? 'http://localhost:3001/webhook',
    },

    // Recent API calls
    recent_calls: sql`
      SELECT team, model, input_tokens, output_tokens, cost_cents, user_id, ts
      FROM api_usage
      ORDER BY ts DESC
      LIMIT 25
    `,

    // Agent action log
    action_log: sql`
      SELECT team, action, reason, ts
      FROM agent_actions
      ORDER BY ts DESC
      LIMIT 10
    `,
  },
})
