/*
 * Test script: simulate upload processing using Supabase service role key
 * Usage: node scripts/test_upload_members.js
 * It reads a sample CSV from inline content, extracts emails, finds users, and adds them to an institution.
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

function loadEnv(filePath) {
  const env = {}
  if (!fs.existsSync(filePath)) return env
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  lines.forEach((line, idx) => {
    // Debug print to help diagnose parsing issues
    console.log(idx+1, line.slice(0,80).replace(/\r/g, '\\r'))
    // Robust parsing: find the first '=' char and split there
    const eq = line.indexOf('=')
    if (eq !== -1) {
      const key = line.slice(0, eq).trim()
      const val = line.slice(eq + 1).trim()
      if (key && !key.startsWith('#')) {
        env[key] = val
      }
    }
  })
  return env
}

function extractEmailsFromText(text) {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi
  const matches = text.match(emailRegex)
  if (!matches) return []
  const unique = Array.from(new Set(matches.map((m) => m.toLowerCase())))
  return unique
}

async function run() {
  const env = loadEnv(path.join(__dirname, '..', '.env.local'))
  console.log('Parsed .env keys:', Object.keys(env))
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log('supabaseUrl:', !!supabaseUrl, 'serviceKey:', !!serviceKey)

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase credentials in .env.local (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Get a real existing user email to test
  const { data: anyUsers } = await supabase.from('users').select('email').limit(1)
  const existingEmail = (anyUsers && anyUsers[0] && anyUsers[0].email) || 'existing@example.com'
  // Sample CSV text
  const sampleCsv = `${existingEmail}\nnotfound@example.com\n` // Replace with actual existing user email if available
  console.log('Using sample CSV with existing email:', existingEmail)

  const emails = extractEmailsFromText(sampleCsv)
  console.log('Extracted emails:', emails)

  if (emails.length === 0) {
    console.log('No emails found in sample')
    return
  }

  // Find first institution to add users to
  const { data: institutions } = await supabase.from('institutions').select('id,name').limit(1)
  if (!institutions || institutions.length === 0) {
    console.error('No institution found in DB')
    return
  }
  const institution = institutions[0]
  console.log('Using institution:', institution)

  // Find users by email
  const { data: users } = await supabase.from('users').select('id,email').in('email', emails)

  const usersList = users || []
  const foundEmails = usersList.map((u) => u.email.toLowerCase())
  const notFound = emails.filter((e) => !foundEmails.includes(e.toLowerCase()))

  console.log('Found users:', usersList)
  console.log('Not found emails:', notFound)

  if (usersList.length === 0) {
    console.log('No users to add, exiting')
    return
  }

  const userIds = usersList.map((u) => u.id)

  // Check existing members
  const { data: existingMembers } = await supabase.from('institution_members').select('user_id').eq('institution_id', institution.id).in('user_id', userIds)
  const existingUserIds = (existingMembers || []).map((m) => m.user_id)

  const toAdd = usersList.filter((u) => !existingUserIds.includes(u.id))

  if (toAdd.length === 0) {
    console.log('All users are already members')
    return
  }

  const inserts = toAdd.map((u) => ({ user_id: u.id, institution_id: institution.id, role: 'member', joined_at: new Date().toISOString() }))
  const { data: insertData, error: insertError } = await supabase.from('institution_members').insert(inserts).select()
  if (insertError) {
    console.error('Insert error:', insertError)
    return
  }

  // Update users.institution_id for added users
  const idsToUpdate = toAdd.map((u) => u.id)
  const { error: updateError } = await supabase.from('users').update({ institution_id: institution.id }).in('id', idsToUpdate)
  if (updateError) console.error('Error updating users.institution_id', updateError)

  console.log('Added users:', toAdd.map((u) => u.email))
}

run().catch((err) => {
  console.error('Error running test script:', err)
})
