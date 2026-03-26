import { defineConfig, sql } from '@risingwave/wavelet'

export default defineConfig({
  database: process.env.WAVELET_DATABASE_URL ?? 'postgres://root@localhost:4566/dev',

  events: {
    app_events: {
      columns: {
        tenant_id: 'string',
        event_type: 'string',
        page: 'string',
        user_id: 'string',
        duration_ms: 'int',
        ts: 'timestamp',
      }
    }
  },

  queries: {
    // Per-tenant metrics — filtered by JWT claim
    tenant_overview: {
      query: sql`
        SELECT
          tenant_id,
          COUNT(*) AS total_events,
          COUNT(DISTINCT user_id) AS active_users,
          COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_views,
          COUNT(*) FILTER (WHERE event_type = 'click') AS clicks,
          AVG(duration_ms)::INT AS avg_duration
        FROM app_events
        GROUP BY tenant_id
      `,
      filterBy: 'tenant_id',
    },

    // Page breakdown — also filtered
    page_stats: {
      query: sql`
        SELECT
          tenant_id,
          page,
          COUNT(*) AS views,
          COUNT(DISTINCT user_id) AS unique_users,
          AVG(duration_ms)::INT AS avg_duration
        FROM app_events
        WHERE event_type = 'page_view'
        GROUP BY tenant_id, page
        ORDER BY views DESC
      `,
      filterBy: 'tenant_id',
    },

    // Event type breakdown — also filtered
    event_breakdown: {
      query: sql`
        SELECT
          tenant_id,
          event_type,
          COUNT(*) AS count
        FROM app_events
        GROUP BY tenant_id, event_type
      `,
      filterBy: 'tenant_id',
    },

    // Global overview (no filter — admin view)
    global_overview: sql`
      SELECT
        tenant_id,
        COUNT(*) AS total_events,
        COUNT(DISTINCT user_id) AS active_users
      FROM app_events
      GROUP BY tenant_id
      ORDER BY total_events DESC
    `,
  },

  jwt: {
    secret: 'wavelet-demo-secret-key-change-in-production',
  },
})
