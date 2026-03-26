// Simulates real-world traffic by inserting random orders into the source Postgres.
// Wavelet picks up changes via CDC — no event streams involved.
//
// Requires: npm install pg

const { Client } = require('pg')

const connectionString =
  process.env.SOURCE_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/shop'

const products = [
  { id: 1, price: 79.99 },
  { id: 2, price: 12.99 },
  { id: 3, price: 149.99 },
  { id: 4, price: 499.99 },
  { id: 5, price: 89.99 },
  { id: 6, price: 45.99 },
  { id: 7, price: 39.99 },
  { id: 8, price: 29.99 },
]

const firstNames = ['alice', 'bob', 'carol', 'dan', 'eve', 'frank', 'grace', 'hank']
const domains = ['example.com', 'test.io', 'acme.co', 'shop.dev']

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomEmail() {
  return `${pick(firstNames)}${Math.floor(Math.random() * 100)}@${pick(domains)}`
}

async function main() {
  const client = new Client({ connectionString })
  await client.connect()
  console.log(`Connected to ${connectionString}`)
  console.log('Inserting a random order every 2 seconds. Press Ctrl+C to stop.\n')

  async function insertOrder() {
    const product = pick(products)
    const quantity = Math.floor(Math.random() * 5) + 1
    const email = randomEmail()
    const total = (quantity * product.price).toFixed(2)

    await client.query(
      'INSERT INTO orders (product_id, quantity, unit_price, customer_email) VALUES ($1, $2, $3, $4)',
      [product.id, quantity, product.price, email]
    )

    const now = new Date().toLocaleTimeString()
    console.log(
      `[${now}]  product_id=${product.id}  qty=${quantity}  unit_price=$${product.price}  total=$${total}  email=${email}`
    )
  }

  // Insert one immediately, then every 2 seconds
  await insertOrder()
  setInterval(insertOrder, 2000)
}

main().catch(err => {
  console.error('Failed to connect:', err.message)
  process.exit(1)
})
