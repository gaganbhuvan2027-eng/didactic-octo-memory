const assert = require('assert')
const { test } = require('node:test')
const { createClient } = require('@supabase/supabase-js')
const { createBatchInProcess, addMembersInProcess, fetchMembersInProcess, removeMemberInProcess, restDelete, restSelect, restInsert } = require('../scripts/in_process_api')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE) {
  throw new Error('Missing SUPABASE env vars for integration test')
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE)
const anonClient = createClient(SUPABASE_URL, ANON_KEY)

test('in-process API end-to-end', { timeout: 60_000 }, async (t) => {
  // Ensure institution exists
  const instRes = await fetch(`${SUPABASE_URL}/rest/v1/institutions?select=id&limit=1`, {
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` },
  })
  const instJson = await instRes.json()
  let institutionId
  if (instJson && instJson.length > 0) {
    institutionId = instJson[0].id
  } else {
    const created = await fetch(`${SUPABASE_URL}/rest/v1/institutions`, {
      method: 'POST',
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify([{ name: 'Test Institution (integration)', email_domain: 'example.test' }]),
    })
    const cjson = await created.json()
    institutionId = cjson[0].id
  }

  // Create admin
  const adminEmail = `ci-admin+${Date.now()}@example.test`
  const adminPassword = 'Test1234!'
  const adminUser = await adminClient.auth.admin.createUser({ email: adminEmail, password: adminPassword, email_confirm: true, user_metadata: { name: 'CI Admin' } })
  const adminId = adminUser.data.id || adminUser.data.user?.id

  // Upsert public.users for admin
  const existingAdmin = await restSelect(`users?id=eq.${adminId}&select=id`)
  if (!existingAdmin || existingAdmin.length === 0) {
    await restInsert('users', [{ id: adminId, email: adminEmail.toLowerCase(), name: 'ciadmin', user_type: 'institution_admin', institution_id: institutionId }])
  } else {
    // Patch existing row
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${adminId}`, {
      method: 'PATCH',
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ email: adminEmail.toLowerCase(), name: 'ciadmin', user_type: 'institution_admin', institution_id: institutionId }),
    })
  }

  // Create two members
  const member1 = await adminClient.auth.admin.createUser({ email: `ci-m1+${Date.now()}@example.test`, password: 'Mem1234!', email_confirm: true, user_metadata: { name: 'member1' } })
  const member2 = await adminClient.auth.admin.createUser({ email: `ci-m2+${Date.now()}@example.test`, password: 'Mem1234!', email_confirm: true, user_metadata: { name: 'member2' } })
  const memberIds = [member1.data.id || member1.data.user?.id, member2.data.id || member2.data.user?.id]

  // Upsert their users rows
  await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(memberIds.map((id, idx) => ({ id, email: `ci-m${idx+1}@example.test`, name: `member${idx+1}`, user_type: 'student', institution_id: institutionId })) ),
  })

  // Create batch via in-process
  const batchId = await createBatchInProcess(`CI Batch ${Date.now()}`, 'Integration test', adminId, institutionId)
  assert.ok(batchId, 'batchId should be returned')

  // Add members
  const inserted = await addMembersInProcess(batchId, memberIds, adminId)
  assert.ok(inserted && inserted.length === 2, 'two members inserted')

  // Fetch members
  const members = await fetchMembersInProcess(batchId)
  assert.ok(members && members.length >= 2, 'members fetched')

  // Remove one
  await removeMemberInProcess(batchId, memberIds[0], adminId)
  const membersAfter = await fetchMembersInProcess(batchId)
  assert.ok(membersAfter.length === members.length - 1, 'one member removed')

  // Cleanup: delete batch members and batch
  await restDelete(`batch_members?batch_id=eq.${batchId}`)
  await restDelete(`batches?id=eq.${batchId}`)

})
