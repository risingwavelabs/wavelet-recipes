// Auto-generates realistic stock trade data with continuous random-walk prices
// Run alongside wavelet dev to see the ticker board come alive

const WAVELET_URL = process.env.WAVELET_URL || 'http://localhost:8080'

const symbols = [
  { symbol: 'AAPL',  base: 190 },
  { symbol: 'GOOGL', base: 175 },
  { symbol: 'MSFT',  base: 420 },
  { symbol: 'AMZN',  base: 185 },
  { symbol: 'NVDA',  base: 130 },
  { symbol: 'TSLA',  base: 250 },
  { symbol: 'META',  base: 500 },
]

// Track last price per symbol for continuous random walk
const lastPrice = new Map()
for (const s of symbols) lastPrice.set(s.symbol, s.base)

function randomTrade() {
  const { symbol } = symbols[Math.floor(Math.random() * symbols.length)]
  const prev = lastPrice.get(symbol)

  // Random walk: +-0.5% from last price
  const change = prev * (Math.random() - 0.5) * 0.01
  const price = Math.round((prev + change) * 100) / 100
  lastPrice.set(symbol, price)

  return {
    symbol,
    price,
    volume: Math.floor(Math.random() * 9901) + 100, // 100-10000
    side: Math.random() < 0.5 ? 'buy' : 'sell',
    ts: new Date().toISOString(),
  }
}

async function emit() {
  const batch = Array.from({ length: 3 }, randomTrade)
  try {
    await fetch(`${WAVELET_URL}/v1/events/trades/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    })
  } catch {}
}

setInterval(emit, 200)
console.log(`Seeding trades to ${WAVELET_URL} (3 trades every 200ms)`)
