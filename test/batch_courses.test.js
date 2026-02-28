const assert = require('assert')
const { test } = require('node:test')
const { createClient } = require('@supabase/supabase-js')
const { createBatchInProcess, restInsert, restSelect, restDelete } = require('../scripts/in_process_api')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error('Missing SUPABASE env vars for integration test')
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE)

test('batch courses flow: attach courses to batch and verify', { timeout: 60_000 }, async (t) => {
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
      body: JSON.stringify([{ name: 'Test Institution (batch-courses-integration)', email_domain: 'example.test' }]),
    })
    const cjson = await created.json()
    institutionId = cjson[0].id
  }

  // Create admin user
  const adminEmail = `bc-ci-admin+${Date.now()}@example.test`
  const adminPassword = 'Test1234!'
  const adminUser = await adminClient.auth.admin.createUser({ email: adminEmail, password: adminPassword, email_confirm: true, user_metadata: { name: 'BC CI Admin' } })
  const adminId = adminUser.data.id || adminUser.data.user?.id

  // Upsert admin into users (insert or patch if exists)
  const existingAdmin = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${adminId}&select=id`, { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } }).then((r) => r.json())
  if (!existingAdmin || existingAdmin.length === 0) {
    await fetch(`${SUPABASE_URL}/rest/v1/users`, {
      method: 'POST',
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify([{ id: adminId, email: adminEmail.toLowerCase(), name: 'bciadmin', user_type: 'institution_admin', institution_id: institutionId }]),
    })
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${adminId}`, {
      method: 'PATCH',
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ email: adminEmail.toLowerCase(), name: 'bciadmin', user_type: 'institution_admin', institution_id: institutionId }),
    })
  }

  // Create batch via helper
  const batchId = await createBatchInProcess(`BC CI Batch ${Date.now()}`, 'integration test for batch courses', adminId, institutionId)
  assert.ok(batchId, 'batchId should be returned')

  // Insert courses into batch_courses
  const rows = [
    { batch_id: batchId, course_id: 'react', created_by_id: adminId },
    { batch_id: batchId, course_id: 'nodejs', created_by_id: adminId },
  ]

  let inserted
  try {
    inserted = await restInsert('batch_courses', rows)
  } catch (e) {
    const msg = e && e.message ? e.message : String(e)
    if (msg.includes("Could not find the table 'public.batch_courses'")) {
      throw new Error("batch_courses table not found in DB. Please run the SQL migration scripts/013_create_batch_courses.sql")
    }
    throw e
  }
  assert.ok(inserted && inserted.length === 2, 'two courses inserted')

  // Verify they exist
  const fetched = await restSelect(`batch_courses?batch_id=eq.${batchId}&select=*`)
  assert.ok(fetched && fetched.length === 2, 'fetched two batch courses')

  // Cleanup
  await restDelete(`batch_courses?batch_id=eq.${batchId}`)
  await restDelete(`batches?id=eq.${batchId}`)
})
