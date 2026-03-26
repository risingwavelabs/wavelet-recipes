// Generates realistic AI API usage data for the Spend Control dashboard
// Run alongside `wavelet dev` to see the dashboard come alive

const WAVELET_URL = process.env.WAVELET_URL || 'http://localhost:8080'

const teams = ['frontend', 'backend', 'data-science', 'ml-ops', 'research']

// Model pricing: cents per 1k tokens
const models = [
  { name: 'claude-sonnet-4-20250514', inputPer1k: 0.3,   outputPer1k: 1.5   },
  { name: 'claude-opus-4-20250514',   inputPer1k: 1.5,   outputPer1k: 7.5   },
  { name: 'gpt-4o',                   inputPer1k: 0.25,  outputPer1k: 1.0   },
  { name: 'claude-haiku',             inputPer1k: 0.025, outputPer1k: 0.125 },
]

const userIds = [
  'alice', 'bob', 'carol', 'dave', 'eve',
  'frank', 'grace', 'heidi', 'ivan', 'judy',
]

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateEvent() {
  const team = pickRandom(teams)

  // Research team uses expensive models heavily to hit the $50 threshold
  let model
  if (team === 'research') {
    // 70% chance of opus, 20% sonnet, 10% other
    const r = Math.random()
    if (r < 0.7) model = models[1]       // claude-opus-4-20250514
    else if (r < 0.9) model = models[0]  // claude-sonnet-4-20250514
    else model = pickRandom(models)
  } else {
    // Other teams: mostly haiku and gpt-4o, sometimes sonnet
    const r = Math.random()
    if (r < 0.4) model = models[3]       // claude-haiku
    else if (r < 0.7) model = models[2]  // gpt-4o
    else if (r < 0.9) model = models[0]  // claude-sonnet-4-20250514
    else model = models[1]               // claude-opus-4-20250514
  }

  // Research team also uses more tokens
  const inputTokens = team === 'research'
    ? randInt(2000, 5000)
    : randInt(500, 3000)
  const outputTokens = team === 'research'
    ? randInt(800, 2000)
    : randInt(100, 1500)

  // Calculate cost in cents based on model pricing
  const cost_cents =
    (inputTokens / 1000) * model.inputPer1k +
    (outputTokens / 1000) * model.outputPer1k

  return {
    team,
    model: model.name,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_cents: Math.round(cost_cents * 1000) / 1000, // 3 decimal places
    user_id: pickRandom(userIds),
    ts: new Date().toISOString(),
  }
}

async function emit() {
  const batch = Array.from({ length: 3 }, generateEvent)
  try {
    await fetch(`${WAVELET_URL}/v1/events/api_usage/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    })
  } catch {}
}

setInterval(emit, 500)
console.log(`Seeding API usage events to ${WAVELET_URL} (3 events every 500ms)`)
console.log('Teams: frontend, backend, data-science, ml-ops, research')
console.log('Research team uses expensive models heavily to trigger budget alerts')
