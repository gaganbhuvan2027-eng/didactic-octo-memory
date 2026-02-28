const assert = require('assert')
const { test } = require('node:test')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const API_HEADERS = {
  'Content-Type': 'application/json',
  apikey: SERVICE_ROLE,
  Authorization: `Bearer ${SERVICE_ROLE}`,
}

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error('Missing SUPABASE env vars for integration test')
}

async function restInsert(table, rows) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url, { method: 'POST', headers: { ...API_HEADERS, Prefer: 'return=representation' }, body: JSON.stringify(rows) })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${text}`)
  return JSON.parse(text)
}

async function restSelect(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url, { method: 'GET', headers: API_HEADERS })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${text}`)
  return JSON.parse(text)
}

async function fetchApp(path, options = {}) {
  const base = process.env.APP_URL || 'http://localhost:3000'
  const url = base.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path)
  console.log('fetchApp url ->', url)
  const res = await fetch(url, options)
  return res
}

// Test: set institution balance via super-admin route and verify DB update
test('super admin can set institution balance via POST and DB is updated', { timeout: 30_000 }, async (t) => {
  // Create an institution
  const instRows = await restInsert('institutions', [{ name: `SetBalance Test ${Date.now()}`, email_domain: `sb${Date.now()}.test` }])
  const institutionId = instRows[0].id

  // Ensure starting balance is zero
  let before = await restSelect(`institution_credits?select=institution_id,balance&institution_id=eq.${institutionId}`)
  assert.ok(before.length === 0 || Number(before[0].balance) === 0, 'Starting balance should be 0 or missing')

  // Call super-admin route to set balance to 500 (use set_to absolute)
  const res = await fetchApp(`/api/super-admin/institutions/${institutionId}/credits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ set_to: 500, reason: 'test_set_balance' }),
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`POST failed: ${res.status} ${res.statusText} - ${text}`)
  const d = JSON.parse(text)
  assert.strictEqual(Number(d.newBalance), 500, 'API should return newBalance 500')

  // Check DB
  const after = await restSelect(`institution_credits?select=institution_id,balance&institution_id=eq.${institutionId}`)
  assert.ok(after && after.length === 1, 'institution_credits row should exist')
  assert.strictEqual(Number(after[0].balance), 500, 'DB balance should be 500')

  // Now set to 750 (use set_to absolute; this should compute +250 on server)
  const res2 = await fetchApp(`/api/super-admin/institutions/${institutionId}/credits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ set_to: 750, reason: 'test_increment' }),
  })

  const t2 = await res2.text()
  if (!res2.ok) throw new Error(`POST failed: ${res2.status} ${res2.statusText} - ${t2}`)
  const d2 = JSON.parse(t2)
  assert.strictEqual(Number(d2.newBalance), 750, 'API should return newBalance 750')

  const after2 = await restSelect(`institution_credits?select=institution_id,balance&institution_id=eq.${institutionId}`)
  assert.strictEqual(Number(after2[0].balance), 750, 'DB balance should be 750')
})
