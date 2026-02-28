const assert = require('assert')
const { test } = require('node:test')
const { createClient } = require('@supabase/supabase-js')
const { restInsert, restSelect, restDelete } = require('../scripts/in_process_api')
const { fetchCourseForMember } = require('../lib/courseContentServer')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE) {
  throw new Error('Missing SUPABASE env vars for integration test')
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE)

// pick any valid course id from lib/courses — use the first one
const streams = require('../lib/courses')
const firstCourseId = streams[0].subcourses[0].id

test('course lessons are fetched from DB for members', { timeout: 60_000 }, async (t) => {
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
      body: JSON.stringify([{ name: 'Test Institution (course-lessons)', email_domain: 'example.test' }]),
    })
    const cjson = await created.json()
    institutionId = cjson[0].id
  }

  // Create admin user
  const adminEmail = `cl-ci-admin+${Date.now()}@example.test`
  const adminPassword = 'Test1234!'
  const adminUser = await adminClient.auth.admin.createUser({ email: adminEmail, password: adminPassword, email_confirm: true, user_metadata: { name: 'CL Admin' } })
  const adminId = adminUser.data.id || adminUser.data.user?.id

  // Upsert admin into users
  const existingAdmin = await restSelect(`users?id=eq.${adminId}&select=id`)
  if (!existingAdmin || existingAdmin.length === 0) {
    await restInsert('users', [{ id: adminId, email: adminEmail.toLowerCase(), name: 'cladmin', user_type: 'institution_admin', institution_id: institutionId }])
  } else {
    await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${adminId}`, {
      method: 'PATCH',
      headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ email: adminEmail.toLowerCase(), name: 'cladmin', user_type: 'institution_admin', institution_id: institutionId }),
    })
  }

  // Create member
  const memberEmail = `cl-member+${Date.now()}@example.test`
  const m = await adminClient.auth.admin.createUser({ email: memberEmail, password: 'Mem1234!', email_confirm: true, user_metadata: { name: 'member' } })
  const memberId = m.data.id || m.data.user?.id

  // Upsert their user row
  await fetch(`${SUPABASE_URL}/rest/v1/users`, {
    method: 'POST',
    headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify([{ id: memberId, email: memberEmail.toLowerCase(), name: 'member', user_type: 'student', institution_id: institutionId }]),
  })

  // Create batch
  const batchCreated = await restInsert('batches', [{ name: `CL Batch ${Date.now()}`, description: 'course lessons test', institution_id: institutionId, created_by_id: adminId }])
  const batchId = Array.isArray(batchCreated) ? batchCreated[0].id : batchCreated.id
  assert.ok(batchId, 'batch created')

  // Add member
  await restInsert('batch_members', [{ batch_id: batchId, user_id: memberId }])

  // Add course to batch
  await restInsert('batch_courses', [{ batch_id: batchId, course_id: firstCourseId, created_by_id: adminId }])

  // Insert a lesson for this course
  const lessonSlug = `lesson-${Date.now()}`
  const lessonTitle = 'Test Lesson'
  const lessonContent = 'This is a test lesson content.'

  await restInsert('course_lessons', [{ course_id: firstCourseId, lesson_slug: lessonSlug, title: lessonTitle, content: lessonContent, "order": 1, created_by_id: adminId }])

  // Fetch via helper
  const res = await fetchCourseForMember(adminClient, memberId, batchId, firstCourseId)
  assert.ok(res.allowed === true, `member allowed: ${JSON.stringify(res)}`)
  assert.ok(res.lessons && res.lessons.length > 0, 'lessons present')
  const found = res.lessons.find((l) => l.id === lessonSlug)
  assert.ok(found, 'inserted lesson returned')
  assert.equal(found.title, lessonTitle)
  assert.equal(found.content, lessonContent)

  // Cleanup
  await restDelete(`course_lessons?course_id=eq.${firstCourseId}`)
  await restDelete(`batch_courses?batch_id=eq.${batchId}`)
  await restDelete(`batch_members?batch_id=eq.${batchId}`)
  await restDelete(`batches?id=eq.${batchId}`)

})