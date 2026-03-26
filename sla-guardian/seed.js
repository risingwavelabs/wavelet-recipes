// Generates realistic API request data for the SLA Guardian dashboard.
// Starts healthy, then after ~10 seconds injects latency spikes and errors.
// Run: node seed.js

const WAVELET_URL = process.env.WAVELET_URL || 'http://localhost:8080'

const services = {
  'auth-service': {
    endpoints: [
      { path: '/login', method: 'POST' },
      { path: '/logout', method: 'POST' },
      { path: '/refresh', method: 'POST' },
      { path: '/verify', method: 'GET' },
    ],
  },
  'payment-api': {
    endpoints: [
      { path: '/charge', method: 'POST' },
      { path: '/refund', method: 'POST' },
      { path: '/balance', method: 'GET' },
      { path: '/transactions', method: 'GET' },
    ],
  },
  'user-service': {
    endpoints: [
      { path: '/users', method: 'GET' },
      { path: '/users', method: 'POST' },
      { path: '/users/:id', method: 'GET' },
      { path: '/users/:id', method: 'PUT' },
    ],
  },
  'order-api': {
    endpoints: [
      { path: '/orders', method: 'GET' },
      { path: '/orders', method: 'POST' },
      { path: '/orders/:id', method: 'GET' },
      { path: '/orders/:id/cancel', method: 'POST' },
    ],
  },
}

const serviceNames = Object.keys(services)
const startTime = Date.now()
const ANOMALY_DELAY_MS = 10_000

// Which services get hit with anomalies (rotate to make it interesting)
let anomalyTarget = null
let anomalyCycle = 0

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomLatency(isAnomaly) {
  if (isAnomaly && Math.random() < 0.4) {
    // Spike: 500-2000ms
    return Math.floor(Math.random() * 1500) + 500
  }
  // Normal: 10-100ms
  return Math.floor(Math.random() * 90) + 10
}

function randomStatus(isAnomaly) {
  if (isAnomaly && Math.random() < 0.18) {
    // High error rate during anomaly: 500-503
    return pick([500, 502, 503])
  }
  // Normal: mostly 200, occasional 4xx
  const r = Math.random()
  if (r < 0.92) return 200
  if (r < 0.95) return 201
  if (r < 0.97) return 204
  if (r < 0.99) return pick([400, 401, 404, 429])
  return 500 // rare error in normal mode
}

function generateRequest() {
  const elapsed = Date.now() - startTime
  const inAnomalyPhase = elapsed > ANOMALY_DELAY_MS

  // Every 15 seconds, rotate which service gets anomalies
  if (inAnomalyPhase) {
    const cycle = Math.floor((elapsed - ANOMALY_DELAY_MS) / 15_000)
    if (cycle !== anomalyCycle || anomalyTarget === null) {
      anomalyCycle = cycle
      anomalyTarget = serviceNames[cycle % serviceNames.length]
    }
  }

  const svcName = pick(serviceNames)
  const ep = pick(services[svcName].endpoints)
  const isAnomaly = inAnomalyPhase && svcName === anomalyTarget

  return {
    service: svcName,
    endpoint: ep.path,
    method: ep.method,
    status_code: randomStatus(isAnomaly),
    latency_ms: randomLatency(isAnomaly),
    ts: new Date().toISOString(),
  }
}

async function emit() {
  const batch = Array.from({ length: 5 }, generateRequest)
  try {
    await fetch(`${WAVELET_URL}/v1/events/api_requests/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    })
  } catch {
    // wavelet not ready yet, will retry
  }
}

setInterval(emit, 300)

const elapsed = () => ((Date.now() - startTime) / 1000).toFixed(0)
console.log(`\x1b[36m[seed]\x1b[0m Sending 5 events every 300ms to ${WAVELET_URL}`)
console.log(`\x1b[36m[seed]\x1b[0m Healthy phase for first 10 seconds, then anomalies begin`)
console.log(`\x1b[36m[seed]\x1b[0m Press Ctrl+C to stop\n`)

// Log phase transitions
setTimeout(() => {
  console.log(`\x1b[33m[seed]\x1b[0m Anomaly injection started — watch the dashboard turn red`)
}, ANOMALY_DELAY_MS)

setInterval(() => {
  const phase = Date.now() - startTime > ANOMALY_DELAY_MS ? 'ANOMALY' : 'HEALTHY'
  const target = anomalyTarget ? ` (target: ${anomalyTarget})` : ''
  const color = phase === 'HEALTHY' ? '\x1b[32m' : '\x1b[31m'
  console.log(`${color}[${elapsed()}s]\x1b[0m Phase: ${phase}${target}`)
}, 5000)
