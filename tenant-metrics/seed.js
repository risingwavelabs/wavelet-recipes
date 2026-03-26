// Generates multi-tenant app analytics events
// Each tenant has distinct usage patterns to make the demo interesting
// Run alongside wavelet dev: node seed.js

const WAVELET_URL = process.env.WAVELET_URL || 'http://localhost:8080'

const pages = ['/dashboard', '/settings', '/billing', '/docs', '/api-keys']
const eventTypes = ['page_view', 'click', 'scroll', 'form_submit', 'error']

// Tenant profiles — each has a different usage pattern
const tenants = {
  acme: {
    users: 50,          // heavy usage, many users
    pageWeights: [30, 15, 15, 25, 15],   // spread across pages
    eventWeights: [50, 20, 15, 10, 5],   // mostly page_views
    durationRange: [200, 8000],
  },
  globex: {
    users: 20,          // moderate usage
    pageWeights: [20, 20, 20, 20, 20],   // balanced
    eventWeights: [25, 25, 20, 20, 10],  // balanced events
    durationRange: [300, 5000],
  },
  initech: {
    users: 10,          // light usage, few users
    pageWeights: [40, 10, 20, 20, 10],
    eventWeights: [30, 20, 25, 15, 10],
    durationRange: [500, 12000],
  },
  hooli: {
    users: 8,           // heavy but concentrated on few pages
    pageWeights: [60, 5, 5, 25, 5],      // mostly /dashboard and /docs
    eventWeights: [40, 30, 10, 15, 5],
    durationRange: [100, 3000],
  },
}

// Weighted random pick
function weightedChoice(items, weights) {
  const total = weights.reduce((s, w) => s + w, 0)
  let r = Math.random() * total
  for (let i = 0; i < items.length; i++) {
    r -= weights[i]
    if (r <= 0) return items[i]
  }
  return items[items.length - 1]
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Tenant selection: acme and hooli produce ~2x more events than globex/initech
const tenantNames = Object.keys(tenants)
const tenantWeights = [40, 25, 15, 20]

function randomEvent() {
  const tenantName = weightedChoice(tenantNames, tenantWeights)
  const profile = tenants[tenantName]

  return {
    tenant_id: tenantName,
    event_type: weightedChoice(eventTypes, profile.eventWeights),
    page: weightedChoice(pages, profile.pageWeights),
    user_id: `user_${randomInt(1, profile.users)}`,
    duration_ms: randomInt(profile.durationRange[0], profile.durationRange[1]),
    ts: new Date().toISOString(),
  }
}

async function emit() {
  const batch = Array.from({ length: 5 }, randomEvent)
  try {
    await fetch(`${WAVELET_URL}/v1/events/app_events/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    })
  } catch {}
}

setInterval(emit, 300)
console.log(`Seeding app_events to ${WAVELET_URL} (5 events every 300ms)`)
console.log('Tenants: acme (heavy/50 users), globex (moderate/20), initech (light/10), hooli (concentrated/8)')
