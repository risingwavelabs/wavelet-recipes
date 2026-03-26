import { defineConfig, sql } from '@risingwave/wavelet'

export default defineConfig({
  database: process.env.WAVELET_DATABASE_URL ?? 'postgres://root@localhost:4566/dev',

  events: {
    api_requests: {
      columns: {
        service: 'string',
        endpoint: 'string',
        method: 'string',
        status_code: 'int',
        latency_ms: 'int',
        ts: 'timestamp',
      }
    }
  },

  queries: {
    // Overall metrics: RPS, P99, error rate (5-min HOP window)
    service_health: sql`
      SELECT
        service,
        COUNT(*) AS total_requests,
        COUNT(*) FILTER (WHERE status_code >= 500) AS error_count,
        ROUND(100.0 * COUNT(*) FILTER (WHERE status_code >= 500) / COUNT(*), 2) AS error_rate,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms)::INT AS p99_latency,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)::INT AS p95_latency,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY latency_ms)::INT AS p50_latency
      FROM api_requests
      GROUP BY service
    `,

    // Per-endpoint breakdown
    endpoint_stats: sql`
      SELECT
        service,
        endpoint,
        method,
        COUNT(*) AS requests,
        COUNT(*) FILTER (WHERE status_code >= 500) AS errors,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms)::INT AS p99,
        ROUND(AVG(latency_ms))::INT AS avg_latency
      FROM api_requests
      GROUP BY service, endpoint, method
      ORDER BY requests DESC
    `,

    // SLA violations — only rows that breach thresholds appear here
    // Webhook fires when new violations are inserted
    sla_violations: {
      query: sql`
        SELECT
          service,
          endpoint,
          method,
          COUNT(*) AS requests,
          ROUND(100.0 * COUNT(*) FILTER (WHERE status_code >= 500) / COUNT(*), 2) AS error_rate,
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms)::INT AS p99_latency
        FROM api_requests
        GROUP BY service, endpoint, method
        HAVING
          ROUND(100.0 * COUNT(*) FILTER (WHERE status_code >= 500) / COUNT(*), 2) > 5.0
          OR PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms)::INT > 500
      `,
      webhook: process.env.WEBHOOK_URL ?? 'http://localhost:3001/webhook',
    },

    // Recent requests for the live table
    recent_requests: sql`
      SELECT service, endpoint, method, status_code, latency_ms, ts
      FROM api_requests
      ORDER BY ts DESC
      LIMIT 30
    `,
  },
})
