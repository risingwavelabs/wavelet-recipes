// Generates realistic payment transaction data for Fraud Agent.
// Normal users make small, infrequent purchases. Fraud users appear after ~8 seconds
// with high-frequency, multi-country, high-value transactions.
// Run: node seed.js

const WAVELET_URL = process.env.WAVELET_URL || 'http://localhost:8080'

const normalUsers = Array.from({ length: 20 }, (_, i) => `user_${String(i + 1).padStart(3, '0')}`)
const fraudUsers = ['user_fraud_1', 'user_fraud_2', 'user_fraud_3']

const normalMerchants = ['Amazon', 'Uber', 'Starbucks', 'Walmart', 'Netflix', 'Spotify', 'Target', 'DoorDash']
const fraudMerchants = ['CryptoExchange', 'WireTransfer', 'GiftCardShop', 'OffshoreBet', 'AnonymousVPN']

const normalCountries = ['US']
const fraudCountries = ['US', 'RU', 'CN', 'BR', 'NG', 'UA']

const cardTypes = ['visa', 'mastercard', 'amex']
const currencies = ['USD']

const startTime = Date.now()
const FRAUD_DELAY_MS = 8_000

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function normalAmount() {
  return Math.round((Math.random() * 195 + 5) * 100) / 100
}

function fraudAmount() {
  // Mix of moderate and very large amounts
  const r = Math.random()
  if (r < 0.3) return Math.round((Math.random() * 3000 + 5000) * 100) / 100  // $5000-$8000
  if (r < 0.6) return Math.round((Math.random() * 2000 + 500) * 100) / 100   // $500-$2500
  return Math.round((Math.random() * 400 + 50) * 100) / 100                  // $50-$450
}

function generateNormalTx() {
  return {
    user_id: pick(normalUsers),
    amount: normalAmount(),
    currency: pick(currencies),
    merchant: pick(normalMerchants),
    country: Math.random() < 0.9 ? 'US' : pick(['CA', 'GB']),
    card_type: pick(cardTypes),
    ts: new Date().toISOString(),
  }
}

function generateFraudTx() {
  return {
    user_id: pick(fraudUsers),
    amount: fraudAmount(),
    currency: pick(currencies),
    merchant: pick(fraudMerchants),
    country: pick(fraudCountries),
    card_type: pick(cardTypes),
    ts: new Date().toISOString(),
  }
}

async function emit() {
  const elapsed = Date.now() - startTime
  const inFraudPhase = elapsed > FRAUD_DELAY_MS

  const batch = []

  // Always generate normal transactions
  for (let i = 0; i < 3; i++) {
    batch.push(generateNormalTx())
  }

  // After fraud delay, inject 1-2 fraud transactions per batch
  if (inFraudPhase) {
    batch.push(generateFraudTx())
    if (Math.random() < 0.5) {
      batch.push(generateFraudTx())
    }
  }

  try {
    await fetch(`${WAVELET_URL}/v1/events/transactions/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    })
  } catch {
    // wavelet not ready yet, will retry
  }
}

setInterval(emit, 400)

const elapsed = () => ((Date.now() - startTime) / 1000).toFixed(0)
console.log(`\x1b[36m[seed]\x1b[0m Sending 4 events every 400ms to ${WAVELET_URL}`)
console.log(`\x1b[36m[seed]\x1b[0m Normal phase for first 8 seconds, then fraud patterns begin`)
console.log(`\x1b[36m[seed]\x1b[0m Press Ctrl+C to stop\n`)

setTimeout(() => {
  console.log(`\x1b[31m[seed]\x1b[0m Fraud injection started — watch for suspicious users`)
}, FRAUD_DELAY_MS)

setInterval(() => {
  const phase = Date.now() - startTime > FRAUD_DELAY_MS ? 'FRAUD' : 'NORMAL'
  const color = phase === 'NORMAL' ? '\x1b[32m' : '\x1b[31m'
  console.log(`${color}[${elapsed()}s]\x1b[0m Phase: ${phase}`)
}, 5000)
