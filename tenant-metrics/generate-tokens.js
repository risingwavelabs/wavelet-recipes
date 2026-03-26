// Generates JWT tokens for each tenant using only Node.js built-in crypto
// No external dependencies required
//
// Usage: node generate-tokens.js
// Paste the output tokens into the dashboard or use them with curl

import { createHmac } from 'node:crypto'

const SECRET = 'wavelet-demo-secret-key-change-in-production'

function base64url(data) {
  if (typeof data === 'string') {
    return Buffer.from(data).toString('base64url')
  }
  return data.toString('base64url')
}

function signJwt(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + 3600, // 1 hour
  }

  const headerB64 = base64url(JSON.stringify(header))
  const payloadB64 = base64url(JSON.stringify(fullPayload))
  const signingInput = `${headerB64}.${payloadB64}`

  const signature = createHmac('sha256', secret)
    .update(signingInput)
    .digest()

  const signatureB64 = base64url(signature)
  return `${signingInput}.${signatureB64}`
}

// Generate tenant tokens
const tenantIds = ['acme', 'globex', 'initech', 'hooli']

console.log('=== Tenant-Isolated Metrics — JWT Tokens ===')
console.log()
console.log(`Secret: ${SECRET}`)
console.log(`Expiry: 1 hour from now`)
console.log()

for (const tenantId of tenantIds) {
  const token = signJwt({ tenant_id: tenantId }, SECRET)
  console.log(`--- ${tenantId} ---`)
  console.log(token)
  console.log()
}

// Admin token (no tenant_id — sees all data on unfiltered queries)
const adminToken = signJwt({ role: 'admin' }, SECRET)
console.log('--- admin (no tenant filter) ---')
console.log(adminToken)
console.log()

console.log('=== Usage ===')
console.log()
console.log('REST:  curl http://localhost:8080/v1/queries/tenant_overview?token=<TOKEN>')
console.log('WS:    ws://localhost:8080/subscribe/tenant_overview?token=<TOKEN>')
console.log()
console.log('Filtered queries (tenant_overview, page_stats, event_breakdown) will')
console.log('only return rows matching the tenant_id in the JWT.')
console.log('Unfiltered queries (global_overview) return all rows regardless of token.')
