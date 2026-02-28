require('dotenv').config({ path: '.env.local' })
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  // allow deferred environment in CI or tests
}

async function restSelect(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
    },
  })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(JSON.stringify(d))
  return d
}

async function restInsert(table, payload) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(JSON.stringify(d))
  return d
}

async function restDelete(query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
    method: 'DELETE',
    headers: {
      apikey: SERVICE_ROLE,
      Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  })
  const d = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(JSON.stringify(d))
  return d
}

async function createBatchInProcess(name, description, adminId, institutionId) {
  const urows = await restSelect(`users?id=eq.${adminId}&select=id,user_type,institution_id`)
  if (!urows || urows.length === 0) throw new Error('Unauthorized')
  const u = urows[0]
  if (u.user_type !== 'institution_admin') throw new Error('Unauthorized')
  if (u.institution_id !== institutionId) throw new Error('Unauthorized')

  const created = await restInsert('batches', [
    { name, description, institution_id: institutionId, created_by_id: adminId },
  ])
  const row = Array.isArray(created) ? created[0] : created
  return row.id
}

async function addMembersInProcess(batchId, memberIds, adminId) {
  const urows = await restSelect(`users?id=eq.${adminId}&select=id,user_type,institution_id`)
  if (!urows || urows.length === 0) throw new Error('Unauthorized')
  const u = urows[0]
  if (u.user_type !== 'institution_admin') throw new Error('Unauthorized')

  const rows = memberIds.map((id) => ({ batch_id: batchId, user_id: id }))
  const inserted = await restInsert('batch_members', rows)
  return inserted
}

async function fetchMembersInProcess(batchId) {
  const members = await restSelect(`batch_members?select=user_id&batch_id=eq.${batchId}`)
  return members
}

async function removeMemberInProcess(batchId, userId, adminId) {
  const urows = await restSelect(`users?id=eq.${adminId}&select=id,user_type`)
  if (!urows || urows.length === 0) throw new Error('Unauthorized')
  const u = urows[0]
  if (u.user_type !== 'institution_admin') throw new Error('Unauthorized')

  await restDelete(`batch_members?batch_id=eq.${batchId}&user_id=eq.${userId}`)
  return true
}

module.exports = {
  createBatchInProcess,
  addMembersInProcess,
  fetchMembersInProcess,
  removeMemberInProcess,
  // exposed for tests/debug
  restSelect,
  restInsert,
  restDelete,
}
