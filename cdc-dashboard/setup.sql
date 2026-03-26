-- Run this against your source PostgreSQL (not RisingWave)
-- Requires: wal_level = logical in postgresql.conf

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  product_id INT REFERENCES products(id),
  quantity INT NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  customer_email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed products
INSERT INTO products (name, category, price) VALUES
  ('Wireless Earbuds', 'Electronics', 79.99),
  ('USB-C Cable', 'Electronics', 12.99),
  ('Mechanical Keyboard', 'Electronics', 149.99),
  ('Standing Desk', 'Furniture', 499.99),
  ('Monitor Arm', 'Furniture', 89.99),
  ('Desk Lamp', 'Furniture', 45.99),
  ('Python Cookbook', 'Books', 39.99),
  ('System Design Interview', 'Books', 29.99)
ON CONFLICT DO NOTHING;
