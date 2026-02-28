const assert = require('assert')
const { test } = require('node:test')

const { resendConfirmation } = require('../lib/supabase/resend')

// Helper to create a fake supabase client
function makeClient(response) {
  return {
    auth: {
      resend: async () => response,
    },
  }
}

test('resendConfirmation: success', async () => {
  const client = makeClient({ error: null })
  const res = await resendConfirmation({ supabase: client, email: 'a@example.test' })
  assert.equal(res.success, true)
  assert.ok(res.message.includes('Confirmation email resent'))
})

test('resendConfirmation: invalid email', async () => {
  const client = makeClient({ error: { message: 'Email address is invalid' } })
  const res = await resendConfirmation({ supabase: client, email: 'bad' })
  assert.equal(res.success, false)
  assert.ok(res.message.includes('Failed to resend:'))
})

test('resendConfirmation: smtp error', async () => {
  const client = makeClient({ error: { message: 'SMTP connection failed' } })
  const res = await resendConfirmation({ supabase: client, email: 'a@example.test' })
  assert.equal(res.success, false)
  assert.ok(res.message.includes('Check your email provider settings'))
})
