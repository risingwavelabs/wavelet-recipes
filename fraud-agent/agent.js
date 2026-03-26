// Fraud Agent - receives webhook alerts when suspicious users are detected.
// Parses the diff payload and logs color-coded alerts with reason analysis.
// Run: node agent.js

const http = require('http')

const PORT = process.env.PORT || 3001

const RED = '\x1b[31m'
const YELLOW = '\x1b[33m'
const CYAN = '\x1b[36m'
const BOLD = '\x1b[1m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'
const BG_RED = '\x1b[41m'
const BG_YELLOW = '\x1b[43m'
const WHITE = '\x1b[37m'

function classifySeverity(user) {
  const reasons = []
  const txCount = Number(user.tx_count)
  const maxAmount = Number(user.max_amount)
  const countryCount = Number(user.country_count)
  const totalAmount = Number(user.total_amount)

  if (txCount > 20) {
    reasons.push(`High frequency: ${txCount} transactions`)
  }
  if (countryCount > 3) {
    reasons.push(`Multi-country: ${countryCount} distinct countries`)
  }
  if (maxAmount > 5000) {
    reasons.push(`Large amount: max $${maxAmount.toFixed(2)}`)
  }

  // Severity: red if multiple triggers or extreme values, orange otherwise
  const severity = reasons.length >= 2 || maxAmount > 7000 || txCount > 50 ? 'CRITICAL' : 'WARNING'

  return { reasons, severity }
}

function logAlert(user, isNew) {
  const { reasons, severity } = classifySeverity(user)
  const action = isNew ? 'NEW DETECTION' : 'UPDATED'
  const severityColor = severity === 'CRITICAL' ? `${BG_RED}${WHITE}` : `${BG_YELLOW}${WHITE}`
  const borderColor = severity === 'CRITICAL' ? RED : YELLOW

  console.log('')
  console.log(`${borderColor}${'='.repeat(60)}${RESET}`)
  console.log(`${severityColor} ${severity} ${RESET} ${BOLD}${action}${RESET} ${DIM}${new Date().toISOString()}${RESET}`)
  console.log(`${borderColor}${'='.repeat(60)}${RESET}`)
  console.log(`  ${BOLD}User:${RESET}         ${user.user_id}`)
  console.log(`  ${BOLD}Transactions:${RESET} ${user.tx_count}`)
  console.log(`  ${BOLD}Total Volume:${RESET} $${Number(user.total_amount).toFixed(2)}`)
  console.log(`  ${BOLD}Avg Amount:${RESET}   $${Number(user.avg_amount).toFixed(2)}`)
  console.log(`  ${BOLD}Max Amount:${RESET}   $${Number(user.max_amount).toFixed(2)}`)
  console.log(`  ${BOLD}Countries:${RESET}    ${user.country_count}`)
  console.log('')
  console.log(`  ${BOLD}Triggered Rules:${RESET}`)
  for (const reason of reasons) {
    const icon = severity === 'CRITICAL' ? `${RED}[!]${RESET}` : `${YELLOW}[!]${RESET}`
    console.log(`    ${icon} ${reason}`)
  }
  console.log(`${borderColor}${'='.repeat(60)}${RESET}`)
  console.log('')
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      try {
        const payload = JSON.parse(body)

        // Handle inserted (new suspicious users)
        if (payload.inserted && payload.inserted.length > 0) {
          for (const user of payload.inserted) {
            logAlert(user, true)
          }
        }

        // Handle updated (users whose stats changed and still suspicious)
        if (payload.updated && payload.updated.length > 0) {
          for (const entry of payload.updated) {
            const user = entry.new || entry
            logAlert(user, false)
          }
        }

        // Handle deleted (users no longer suspicious — unlikely but handle gracefully)
        if (payload.deleted && payload.deleted.length > 0) {
          for (const user of payload.deleted) {
            console.log(`${CYAN}[CLEARED]${RESET} ${user.user_id} is no longer flagged`)
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true }))
      } catch (err) {
        console.error(`${RED}[error]${RESET} Failed to parse webhook payload:`, err.message)
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'Invalid JSON' }))
      }
    })
  } else {
    res.writeHead(404)
    res.end('Not found')
  }
})

server.listen(PORT, () => {
  console.log(`${CYAN}${BOLD}[agent]${RESET} Fraud agent listening on port ${PORT}`)
  console.log(`${CYAN}[agent]${RESET} Waiting for suspicious_users webhook alerts...`)
  console.log('')
})
