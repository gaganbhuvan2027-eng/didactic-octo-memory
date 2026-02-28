/*
 * Test script: upload an XLSX file to the /api/institution/members/upload endpoint
 * Uses SUPABASE_SERVICE_ROLE_KEY in .env.local and passes x-institution-id header to target institution
 * Usage: node scripts/test_upload_file_endpoint.js
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const FormData = require('form-data')
const xlsx = require('xlsx')

function loadEnv(filePath) {
  const env = {}
  if (!fs.existsSync(filePath)) return env
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')
  lines.forEach((line) => {
    const eq = line.indexOf('=')
    if (eq !== -1) {
      const key = line.slice(0, eq).trim()
      const val = line.slice(eq + 1).trim()
      if (key && !key.startsWith('#')) env[key] = val
    }
  })
  return env
}

async function run() {
  const env = loadEnv(path.join(__dirname, '..', '.env.local'))
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('Missing SUPABASE config in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Find an institution to target
  const { data: institutions } = await supabase.from('institutions').select('id,name').limit(1)
  if (!institutions || institutions.length === 0) {
    console.error('No institution found')
    return
  }
  const institution = institutions[0]
  console.log('Using institution:', institution)

  // Find an existing user email to include
  const { data: anyUsers } = await supabase.from('users').select('email').limit(1)
  const existingEmail = (anyUsers && anyUsers[0] && anyUsers[0].email) || 'existing@example.com'

  // Create XLSX in memory
  const wb = xlsx.utils.book_new()
  const ws = xlsx.utils.aoa_to_sheet([[existingEmail], ['notfound@example.com']])
  xlsx.utils.book_append_sheet(wb, ws, 'Sheet1')
  const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' })

  // Save to a file (optional)
  const tempDir = path.join(__dirname, 'test_files')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)
  const filePath = path.join(tempDir, 'members_test.xlsx')
  fs.writeFileSync(filePath, buffer)

  // Build multipart request using form-data
  const form = new FormData()
  form.append('file', fs.createReadStream(filePath), { filename: 'members_test.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

  console.log('Posting file to upload endpoint...')

  const resp = await fetch('http://localhost:3000/api/institution/members/upload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      'x-institution-id': institution.id,
      ...form.getHeaders(),
    },
    body: form,
  })

  const result = await resp.json()
  console.log('Response status:', resp.status)
  console.log('Response body:', result)
}

run().catch((err) => {
  console.error('Error:', err)
})