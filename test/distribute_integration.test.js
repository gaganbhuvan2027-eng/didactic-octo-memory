const assert = require('assert')
const { test } = require('node:test')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error('Missing SUPABASE env vars for integration test')
}

const API_HEADERS = {
  'Content-Type': 'application/json',
  apikey: SERVICE_ROLE,
  Authorization: `Bearer ${SERVICE_ROLE}`,
}

async function restInsert(table, rows) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url, { method: 'POST', headers: { ...API_HEADERS, Prefer: 'return=representation' }, body: JSON.stringify(rows) })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${text}`)
  return JSON.parse(text)
}

async function restUpsert(table, rows, onConflict) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url + `?on_conflict=${onConflict}`, { method: 'POST', headers: { ...API_HEADERS, Prefer: 'return=representation, resolution=merge-duplicates' }, body: JSON.stringify(rows) })
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

async function rpc(name, body) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${name}`
  const res = await fetch(url, { method: 'POST', headers: API_HEADERS, body: JSON.stringify(body) })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${text}`)
  return JSON.parse(text)
}

// Integration test: RPC + DB effects
test('distribute_credits_to_batch rpc updates institution balance and member credits', { timeout: 60_000 }, async (t) => {
  // Create a fresh institution
  const instName = `Test Dist Inst ${Date.now()}`
  const instRows = await restInsert('institutions', [{ name: instName, email_domain: `dist${Date.now()}.test` }])
  const institutionId = instRows[0].id

  // Find up to 3 student users in the institution; if none exist, fail fast to avoid creating auth users in test
  let memberRows = await restSelect(`users?select=id,user_type,institution_id&institution_id=eq.${institutionId}&user_type=eq.student&limit=3`)

  if (!memberRows || memberRows.length === 0) {
    // If no students are available in this new institution, create sample student users (best effort)
    // We prefer not to create auth users in tests that can't be cleaned up, so try to find any existing students across the project
    memberRows = await restSelect('users?select=id,user_type,institution_id&user_type=eq.student&limit=3')
    if (!memberRows || memberRows.length === 0) {
      throw new Error('No student users available to run distribution test. Please create at least one student user in the DB or run the test with an existing student.')
    }
  }

  const membersToUse = memberRows.slice(0, 3).map((r) => r.id)

  // Create batch and add members
  const batch = (await restInsert('batches', [{ name: `Dist Batch ${Date.now()}`, institution_id: institutionId, created_by_id: (memberRows[0].id || null) }]))[0]
  const batchId = batch.id
  const bmRows = membersToUse.map((mid) => ({ batch_id: batchId, user_id: mid }))
  await restInsert('batch_members', bmRows)

  // Seed institution credits
  const initialBalance = 1000
  await restUpsert('institution_credits', [{ institution_id: institutionId, balance: initialBalance }], 'institution_id')

  // Call RPC to distribute
  const perMember = 7
  const rpcResult = await rpc('distribute_credits_to_batch', { p_batch_id: batchId, p_amount_per_member: perMember, p_performed_by: (memberRows[0].id) })

  assert.ok(rpcResult && rpcResult.success === true, 'RPC should return success')
  assert.strictEqual(rpcResult.distributed_to, membersToUse.length, 'distributed_to should match member count')
  assert.strictEqual(Number(rpcResult.total_debited), perMember * membersToUse.length, 'total_debited should be perMember * count')

  // Verify institution balance
  const instAfterArr = await restSelect(`institution_credits?select=institution_id,balance&institution_id=eq.${institutionId}`)
  assert.ok(instAfterArr && instAfterArr.length === 1, 'institution_credits row should exist')
  const instAfter = instAfterArr[0]
  const expectedBalance = initialBalance - perMember * membersToUse.length
  assert.strictEqual(Number(instAfter.balance), expectedBalance, 'institution balance should be debited')

  // Verify user_credits for members
  const userCredits = await restSelect(`user_credits?select=user_id,balance`)
  const filtered = userCredits.filter((r) => membersToUse.includes(r.user_id) && Number(r.balance) >= perMember)
  const missing = membersToUse.filter((id) => !filtered.find((r) => r.user_id === id))
  assert.ok(missing.length === 0, 'All members should have received credits')

  // Verify credit_transactions were created for members
  const cts = await restSelect('credit_transactions?select=user_id,delta,metadata')
  const txsForBatch = cts.filter((tx) => tx.metadata && tx.metadata.batch_id === batchId)
  assert.ok(txsForBatch.length === membersToUse.length, 'Each member should have a credit_transaction with metadata.batch_id')

  // Verify institution_credit_transactions entry
  const instTxs = await restSelect('institution_credit_transactions?select=institution_id,delta,reason,metadata')
  const instTxForBatch = instTxs.filter((tx) => tx.metadata && tx.metadata.batch_id === batchId)
  assert.ok(instTxForBatch.length === 1, 'One institution_credit_transactions row should be present for the batch')
  assert.strictEqual(Number(instTxForBatch[0].delta), -1 * perMember * membersToUse.length)

  // Cleanup: remove batch members and batch
  await fetch(`${SUPABASE_URL}/rest/v1/batch_members?batch_id=eq.${batchId}`, { method: 'DELETE', headers: API_HEADERS })
  await fetch(`${SUPABASE_URL}/rest/v1/batches?id=eq.${batchId}`, { method: 'DELETE', headers: API_HEADERS })
  // Note: we do not remove users or transactions to avoid deleting shared test data in CI.
})
