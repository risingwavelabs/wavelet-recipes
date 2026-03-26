import { defineConfig, sql } from '@risingwave/wavelet'

export default defineConfig({
  database: process.env.WAVELET_DATABASE_URL ?? 'postgres://root@localhost:4566/dev',

  sources: {
    shop: {
      type: 'postgres',
      connection: process.env.SOURCE_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/shop',
      tables: ['orders', 'products'],
    }
  },

  queries: {
    // Revenue by product (joins CDC orders with products)
    revenue_by_product: sql`
      SELECT
        p.name AS product_name,
        p.category,
        COUNT(*) AS order_count,
        SUM(o.quantity * o.unit_price) AS revenue
      FROM shop_orders o
      JOIN shop_products p ON o.product_id = p.id
      GROUP BY p.name, p.category
      ORDER BY revenue DESC
    `,

    // Revenue by category
    revenue_by_category: sql`
      SELECT
        p.category,
        COUNT(*) AS order_count,
        SUM(o.quantity * o.unit_price) AS revenue
      FROM shop_orders o
      JOIN shop_products p ON o.product_id = p.id
      GROUP BY p.category
      ORDER BY revenue DESC
    `,

    // Order stats
    order_stats: sql`
      SELECT
        COUNT(*) AS total_orders,
        SUM(quantity * unit_price) AS total_revenue,
        AVG(quantity * unit_price)::INT AS avg_order_value
      FROM shop_orders
    `,

    // Recent orders with product info
    recent_orders: sql`
      SELECT
        o.id,
        p.name AS product_name,
        p.category,
        o.quantity,
        o.unit_price,
        o.quantity * o.unit_price AS total,
        o.customer_email,
        o.created_at
      FROM shop_orders o
      JOIN shop_products p ON o.product_id = p.id
      ORDER BY o.created_at DESC
      LIMIT 20
    `,
  },
})
