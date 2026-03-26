// Spend Control Agent — webhook receiver for budget alerts
// Creates a closed loop: data -> alert -> agent action -> action visible in dashboard

const http = require('http')

const WAVELET_URL = process.env.WAVELET_URL || 'http://localhost:8080'
const PORT = process.env.AGENT_PORT || 3001

// Track which teams we've already throttled to avoid spamming actions
const throttledTeams = new Set()

function log(msg) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

async function recordAction(team, action, reason) {
  const payload = JSON.stringify({
    team,
    action,
    reason,
    ts: new Date().toISOString(),
  })

  try {
    const res = await fetch(`${WAVELET_URL}/v1/events/agent_actions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    })
    if (res.ok) {
      log(`  -> Recorded action: ${action} for team "${team}"`)
    } else {
      log(`  -> Failed to record action: ${res.status} ${res.statusText}`)
    }
  } catch (err) {
    log(`  -> Error recording action: ${err.message}`)
  }
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', async () => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))

      try {
        const data = JSON.parse(body)
        const rows = data.rows || data || []
        const alertRows = Array.isArray(rows) ? rows : [rows]

        for (const row of alertRows) {
          const team = row.team
          const spend = Number(row.total_spend_usd).toFixed(2)

          if (!team) continue

          log(`Budget alert: team "${team}" has spent $${spend}`)

          if (!throttledTeams.has(team)) {
            throttledTeams.add(team)
            log(`  -> Throttling team "${team}" (first time exceeding budget)`)
            await recordAction(team, 'throttle', `Budget exceeded $50 (current: $${spend})`)
          } else {
            log(`  -> Team "${team}" already throttled, skipping`)
          }
        }
      } catch (err) {
        log(`Error processing webhook: ${err.message}`)
      }
    })
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

server.listen(PORT, () => {
  log(`Spend Control Agent listening on port ${PORT}`)
  log(`Waiting for budget alert webhooks...`)
  log(`Actions will be recorded back to ${WAVELET_URL}`)
  log('')
  log('Closed-loop pattern:')
  log('  1. seed.js sends API usage events')
  log('  2. Wavelet detects budget threshold breach')
  log('  3. Webhook fires to this agent')
  log('  4. Agent records throttle action back to Wavelet')
  log('  5. Action appears in the dashboard')
})
