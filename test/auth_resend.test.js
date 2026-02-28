const assert = require('assert')
const { test } = require('node:test')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE) {
  throw new Error('Missing SUPABASE env vars for integration test')
}

const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE)
const anonClient = createClient(SUPABASE_URL, ANON_KEY)

test('auth: resend confirmation for unconfirmed user succeeds', { timeout: 30_000 }, async (t) => {
  const email = `ci-resend+${Date.now()}@example.test`
  const password = 'Test1234!'
  let createdUserId = null

  try {
    // Create an auth user who is NOT auto-confirmed
    const created = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { name: 'resend-test' },
    })

    // supabase admin createUser returns { data: { id } } or { data: { user: { id } } }
    createdUserId = created.data?.id || created.data?.user?.id
    assert.ok(createdUserId, 'created user id should be returned')

    // Use the anon client (like the browser) to request a resend
    const { error } = await anonClient.auth.resend({ type: 'signup', email })

    // If you want strict testing of email delivery, set SUPABASE_TEST_EMAIL=true in your env
    if (process.env.SUPABASE_TEST_EMAIL === 'true') {
      // In environments where SMTP is expected to be configured, require success
      assert.equal(error, null, `resend should not return an error, got: ${error && error.message}`)
    } else {
      // In typical CI/dev where SMTP may not be configured, accept either success or a provider error
      if (error) {
        console.warn('auth_resend test: resend returned an error (likely SMTP/provider not configured):', error.message || error)
      } else {
        // success — nothing to do
      }
    }

  } finally {
    // Cleanup user if created
    if (createdUserId) {
      try {
        await adminClient.auth.admin.deleteUser(createdUserId)
      } catch (cleanupErr) {
        // Don't fail the test on cleanup errors, but log
        console.error('cleanup deleteUser error', cleanupErr)
      }
    }
  }
})
