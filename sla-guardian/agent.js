// SLA Guardian Agent — receives webhook alerts from wavelet when SLA violations occur.
// Run: node agent.js
// Listens on port 3001 (or PORT env var)

const http = require('node:http')

const PORT = process.env.PORT || 3001

// ANSI color helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bgRed: '\x1b[41m',
  white: '\x1b[37m',
}

function formatTimestamp() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

function classifyBreach(row) {
  const breaches = []
  const errorRate = parseFloat(row.error_rate)
  const p99 = parseInt(row.p99_latency)
  if (errorRate > 5.0) {
    breaches.push(`${c.red}error_rate ${errorRate}% > 5.0%${c.reset}`)
  }
  if (p99 > 500) {
    breaches.push(`${c.red}p99_latency ${p99}ms > 500ms${c.reset}`)
  }
  return breaches
}

function printViolation(row) {
  const breaches = classifyBreach(row)
  const svc = row.service || 'unknown'
  const ep = row.endpoint || '/'
  const method = row.method || '?'
  const requests = row.requests || 0

  console.log(`  ${c.bold}${c.red}VIOLATION${c.reset} ${c.cyan}${svc}${c.reset} ${c.dim}${method}${c.reset} ${ep}`)
  console.log(`    Requests: ${requests}`)
  for (const b of breaches) {
    console.log(`    Breach:   ${b}`)
  }
  console.log()
}

const server = http.createServer((req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok' }))
    return
  }

  // Webhook endpoint
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ received: true }))

      try {
        const payload = JSON.parse(body)
        const inserted = payload.inserted || []
        const updated = payload.updated || []
        const violations = [...inserted, ...updated]

        if (violations.length === 0) return

        console.log(`${c.bgRed}${c.white}${c.bold} SLA ALERT ${c.reset} ${c.dim}${formatTimestamp()}${c.reset}`)
        console.log(`${c.dim}  Query: ${payload.query || 'sla_violations'}${c.reset}`)
        console.log(`${c.dim}  ${violations.length} violation(s) detected${c.reset}`)
        console.log()

        for (const row of violations) {
          printViolation(row)
        }

        console.log(`${c.dim}${'─'.repeat(60)}${c.reset}\n`)
      } catch (err) {
        console.error(`${c.yellow}[agent]${c.reset} Failed to parse webhook payload:`, err.message)
      }
    })
    return
  }

  // 404 for anything else
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'not found' }))
})

server.listen(PORT, () => {
  console.log(`${c.cyan}${c.bold}[agent]${c.reset} SLA Guardian agent listening on port ${PORT}`)
  console.log(`${c.dim}[agent] Webhook endpoint: http://localhost:${PORT}/webhook${c.reset}`)
  console.log(`${c.dim}[agent] Waiting for SLA violations...${c.reset}\n`)
})
