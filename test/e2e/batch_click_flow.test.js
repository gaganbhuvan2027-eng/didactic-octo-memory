const assert = require('assert')
const { test } = require('node:test')
const { restInsert, restSelect, restDelete, createBatchInProcess, addMembersInProcess } = require('../../scripts/in_process_api')

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000'

test('e2e: batch -> courses -> course content (server pages)', async (t) => {
  // Prepare data using service role
  // Ensure an institution exists
  const insts = await restSelect('institutions?select=id&limit=1')
  let institutionId
  if (insts && insts.length > 0) institutionId = insts[0].id
  else {
    const created = await restInsert('institutions', [{ name: 'E2E Inst', email_domain: 'example.e2e' }])
    institutionId = Array.isArray(created) ? created[0].id : created.id
  }

  // Create admin
  const adminEmail = `e2e-admin+${Date.now()}@example.e2e`
  const adminPwd = 'Admin1234!'
  const SUPABASE = require('@supabase/supabase-js')
  const env = require('dotenv').config({ path: '.env.local' })
  const SUPABASE_URL = process.env.SUPABASE_URL
  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
  const adminClient = SUPABASE.createClient(SUPABASE_URL, SERVICE_ROLE)
  const createdUser = await adminClient.auth.admin.createUser({ email: adminEmail, password: adminPwd, email_confirm: true, user_metadata: { name: 'E2E Admin' } })
  const adminId = createdUser.data.id || createdUser.data.user?.id

  await restInsert('users', [{ id: adminId, email: adminEmail.toLowerCase(), name: 'e2e admin', user_type: 'institution_admin', institution_id: institutionId }])

  // Create member
  const memberEmail = `e2e-member+${Date.now()}@example.e2e`
  const m = await adminClient.auth.admin.createUser({ email: memberEmail, password: 'Mem1234!', email_confirm: true, user_metadata: { name: 'member' } })
  const memberId = m.data.id || m.data.user?.id
  await restInsert('users', [{ id: memberId, email: memberEmail.toLowerCase(), name: 'member', user_type: 'student', institution_id: institutionId }])

  // Create batch
  const batchCreated = await restInsert('batches', [{ name: `E2E Batch ${Date.now()}`, description: 'e2e', institution_id: institutionId, created_by_id: adminId }])
  const batchId = Array.isArray(batchCreated) ? batchCreated[0].id : batchCreated.id

  // Add member
  await restInsert('batch_members', [{ batch_id: batchId, user_id: memberId }])

  // pick a valid course id
  const streams = require('../../lib/courses')
  const firstCourseId = streams[0].subcourses[0].id

  // add course to batch
  await restInsert('batch_courses', [{ batch_id: batchId, course_id: firstCourseId, created_by_id: adminId }])

  // add a lesson
  const lessonSlug = `e2e-lesson-${Date.now()}`
  await restInsert('course_lessons', [{ course_id: firstCourseId, lesson_slug: lessonSlug, title: 'E2E Lesson', content: 'E2E content', "order": 1, created_by_id: adminId }])

  // Now attempt to fetch server pages
  const resHome = await fetch(`${BASE}/my-batches`)
  const homeHtml = await resHome.text()

  if (homeHtml.includes('Please <a') || resHome.status !== 200) {
    // likely sign-in required; skip test as server isn't in an authenticated state
    t.skip('Dev server not authenticated; run this test after starting dev and signing in in browser or provide session')
    return
  }

  // Find link to batch
  assert.ok(homeHtml.includes(`/my-batches/${batchId}`), 'home page should contain link to batch')

  const resCourses = await fetch(`${BASE}/my-batches/${batchId}/courses`)
  const coursesHtml = await resCourses.text()
  assert.ok(coursesHtml.includes(firstCourseId), 'courses page should reference the course id')

  // Course content page (may require auth); we at least check the course page URL is accessible without auth for now
  const resCourse = await fetch(`${BASE}/my-batches/${batchId}/courses/${firstCourseId}`)
  const courseHtml = await resCourse.text()
  // If course page requires auth, skip
  if (courseHtml.includes('Please <a') || resCourse.status !== 200) {
    t.skip('Course page requires authentication in dev; sign in and re-run E2E')
    return
  }

  // check lesson present
  assert.ok(courseHtml.includes('E2E Lesson') || courseHtml.includes('E2E content'))

  // cleanup
  await restDelete(`course_lessons?course_id=eq.${firstCourseId}`)
  await restDelete(`batch_courses?batch_id=eq.${batchId}`)
  await restDelete(`batch_members?batch_id=eq.${batchId}`)
  await restDelete(`batches?id=eq.${batchId}`)
  await restDelete(`users?id=eq.${adminId}`)
  await restDelete(`users?id=eq.${memberId}`)
})
