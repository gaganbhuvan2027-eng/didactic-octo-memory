const assert = require('assert')
const { test } = require('node:test')
const { createClient } = require('@supabase/supabase-js')
const { createBatchInProcess, addMembersInProcess, restInsert, restSelect, restDelete } = require('../scripts/in_process_api')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error('Missing SUPABASE env vars for integration test')
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE)

test('my-batches flow: create batch, add member, schedule interview', { timeout: 60_000 }, async (t) => {
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
      body: JSON.stringify([{ name: 'Test Institution (my-batches-integration)', email_domain: 'example.test' }]),
    })
    const cjson = await created.json()
    institutionId = cjson[0].id
  }

  // Create admin user
  const adminEmail = `mb-ci-admin+${Date.now()}@example.test`
  const adminPassword = 'Test1234!'
  const adminUser = await adminClient.auth.admin.createUser({ email: adminEmail, password: adminPassword, email_confirm: true, user_metadata: { name: 'MB CI Admin' } })
  const adminId = adminUser.data.id || adminUser.data.user?.id

  // Upsert admin into users (insert or patch existing)
  const existingAdmin = await restSelect(`users?id=eq.${adminId}&select=id`)
  if (!existingAdmin || existingAdmin.length === 0) {
    await restInsert('users', [{ id: adminId, email: adminEmail.toLowerCase(), name: 'mbciadmin', user_type: 'institution_admin', institution_id: institutionId }])
  } else {
    // Patch existing row
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${adminId}`, {
      method: 'PATCH',
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ email: adminEmail.toLowerCase(), name: 'mbciadmin', user_type: 'institution_admin', institution_id: institutionId }),
    })
  }

  // Create member
  const memberEmail = `mb-ci-member+${Date.now()}@example.test`
  const member = await adminClient.auth.admin.createUser({ email: memberEmail, password: 'Mem1234!', email_confirm: true, user_metadata: { name: 'mbmember' } })
  const memberId = member.data.id || member.data.user?.id

  // Upsert member user row (insert or patch if exists)
  const existingMember = await restSelect(`users?id=eq.${memberId}&select=id`)
  if (!existingMember || existingMember.length === 0) {
    await restInsert('users', [{ id: memberId, email: memberEmail.toLowerCase(), name: 'mbmember', user_type: 'student', institution_id: institutionId }])
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${memberId}`, {
      method: 'PATCH',
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ email: memberEmail.toLowerCase(), name: 'mbmember', user_type: 'student', institution_id: institutionId }),
    })
  }

  // Create batch via in-process helper
  const batchId = await createBatchInProcess(`MB CI Batch ${Date.now()}`, 'integration test', adminId, institutionId)
  assert.ok(batchId, 'batchId should be returned')

  // Add member
  const inserted = await addMembersInProcess(batchId, [memberId], adminId)
  assert.ok(inserted && inserted.length === 1, 'one member inserted')

  // Schedule interview via REST
  const futureDate = new Date(Date.now() + 1000 * 60 * 30).toISOString()
  const sched = await restInsert('scheduled_interviews', [{ course: 'MB CI Interview', difficulty: 'medium', scheduled_date: futureDate, member_id: memberId, scheduled_by_id: adminId, institution_id: institutionId, batch_id: batchId, status: 'pending' }])
  assert.ok(sched && (Array.isArray(sched) ? sched.length > 0 : sched.id), 'scheduled interview created')

  // Verify interview exists for batch
  const interviews = await restSelect(`scheduled_interviews?batch_id=eq.${batchId}&select=*`)
  assert.ok(interviews && interviews.length >= 1, 'interview fetched for batch')

  // Cleanup
  await restDelete(`scheduled_interviews?batch_id=eq.${batchId}`)
  await restDelete(`batch_members?batch_id=eq.${batchId}`)
  await restDelete(`batches?id=eq.${batchId}`)

})
