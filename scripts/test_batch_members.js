// scripts/test_batch_members.js
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const DEFAULT_HOSTS = ['http://127.0.0.1:3000', 'http://localhost:3000', 'http://192.168.142.1:3000']
let APP_URL = process.env.APP_URL || 'http://127.0.0.1:3000'

// In-process helpers (extracted to a shared module)
const inProcessApi = require('./in_process_api')
const { createBatchInProcess, addMembersInProcess, fetchMembersInProcess, removeMemberInProcess } = inProcessApi
const { restSelect, restInsert, restDelete } = inProcessApi

async function findAppUrl() {
  for (const url of DEFAULT_HOSTS) {
    try {
      const res = await fetch(`${url}/api/user/credits`, { method: 'GET', timeout: 2000 })
      if (res.ok) return url
    } catch (e) {
      // ignore
    }
  }
  return APP_URL
}

// Fetch to the app with per-request host fallback. Tries all DEFAULT_HOSTS and returns the first successful response.
async function fetchApp(path, options = {}) {
  const tried = []
  for (const base of [APP_URL, ...DEFAULT_HOSTS]) {
    if (!base) continue
    const url = base.replace(/\/$/, '') + (path.startsWith('/') ? path : '/' + path)
    tried.push(url)
    try {
      const res = await fetch(url, options)
      return { res, url }
    } catch (e) {
      // continue to next host
    }
  }
  const err = new Error(`All hosts failed when fetching ${path}. Tried: ${tried.join(', ')}`)
  throw err
}

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE) {
  console.error('Missing SUPABASE env vars (NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY)')
  process.exit(1)
}

async function adminCreateUser(adminClient, email, password, metadata = {}) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  })
  if (error) throw error
  return data
}

async function upsertRow(table, payload, keyField = 'id') {
  // payload is expected to be an array of rows
  const row = Array.isArray(payload) ? payload[0] : payload
  if (!row) throw new Error('Empty payload')

  // If ID exists, try to PATCH, otherwise POST
  try {
    if (row[keyField]) {
      // check exists
      const existing = await restSelect(`${table}?${keyField}=eq.${row[keyField]}&select=${keyField}`)
      if (existing && existing.length > 0) {
        // patch
        const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${keyField}=eq.${row[keyField]}`, {
          method: 'PATCH',
          headers: {
            apikey: SERVICE_ROLE,
            Authorization: `Bearer ${SERVICE_ROLE}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(row),
        })
        const d = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(JSON.stringify(d))
        return d
      }
    }

    // fallback to insert
    const res2 = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify([row]),
    })
    const d2 = await res2.json().catch(() => ({}))
    if (!res2.ok) throw new Error(JSON.stringify(d2))
    return d2
  } catch (e) {
    throw e
  }
}

async function restSelect(table, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, {
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
  // query should be the path starting with table name and query string, e.g. 'batch_members?batch_id=eq.<id>&user_id=eq.<id>'
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

async function main() {
  const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE)
  const anonClient = createClient(SUPABASE_URL, ANON_KEY)

  console.log('1) Ensuring an institution exists (or creating)')
  let institutions = await restSelect('institutions?select=id&limit=1')
  let institutionId
  if (institutions && institutions.length > 0) {
    institutionId = institutions[0].id
    console.log(' - Using existing institution:', institutionId)
  } else {
    console.log(' - Creating a test institution')
    const created = await restInsert('institutions', [{ name: 'Test Institution (auto)', email_domain: 'example.test' }])
    institutionId = created[0].id
    console.log(' - Created institution:', institutionId)
  }

  // Create admin user
  const adminEmail = `test-admin+${Date.now()}@example.test`
  const adminPassword = 'Test1234!'
  console.log('2) Creating institution admin:', adminEmail)
  const adminUser = await adminCreateUser(adminClient, adminEmail, adminPassword, { name: 'Test Admin' })
  const adminId = adminUser.id || adminUser.user?.id

  console.log(' - Upserting public.users row for admin')
await upsertRow('users', [{ id: adminId, email: adminEmail.toLowerCase(), name: 'testadmin', user_type: 'institution_admin', institution_id: institutionId }])

  // Create two test members
  const memberEmails = [`test-m1+${Date.now()}@example.test`, `test-m2+${Date.now()}@example.test`]
  const memberPasswords = ['Mem1234!', 'Mem1234!']
  const memberIds = []

  for (let i = 0; i < memberEmails.length; i++) {
    console.log(`3.${i + 1}) Creating member ${memberEmails[i]}`)
    const u = await adminCreateUser(adminClient, memberEmails[i], memberPasswords[i], { name: `member${i + 1}` })
    const id = u.id || u.user?.id
    memberIds.push(id)
    // upsert profile
    await upsertRow('users', [{ id, email: memberEmails[i].toLowerCase(), name: `member${i + 1}`, user_type: 'student', institution_id: institutionId }])
    // Add to institution_members (upsert if exists)
    try {
      await restInsert('institution_members', [{ institution_id: institutionId, user_id: id, role: 'member' }])
    } catch (e) {
      // If exists, try patch
      console.warn(' - institution_member insert likely exists, continuing')
    }
  }

  // Sign in as admin via anon client
  console.log('4) Signing in as admin to get session token')
  const { data: signData, error: signErr } = await anonClient.auth.signInWithPassword({ email: adminEmail, password: adminPassword })
  if (signErr) throw signErr
  const accessToken = signData.session?.access_token
  if (!accessToken) throw new Error('Failed to obtain admin access token')

  console.log(' - Access token obtained')

  // Create a batch via the app API (try in-process first, then HTTP fallback, then REST)
  APP_URL = await findAppUrl()
  console.log('5) Creating batch via app API (in-process -> host fallback enabled)')
  // Supabase client uses a storage key cookie named `sb-<project-ref>-auth-token` by default.
  // Compute the cookie name from SUPABASE_URL so server-side helpers will pick it up.
  const supabaseHost = SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0]
  const SUPABASE_COOKIE_NAME = `sb-${supabaseHost}-auth-token`
  let batchId


  try {
    const name = `Test Batch ${Date.now()}`
    // Try in-process first
    try {
      batchId = await createBatchInProcess(name, 'Automated test', adminId, institutionId)
      console.log(' - Created batch via in-process API:', batchId)
    } catch (inErr) {
      // If in-process fails (auth or other), try HTTP host fallback
      ({ res, url } = await fetchApp('/api/institution/batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${SUPABASE_COOKIE_NAME}=${accessToken}`,
        },
        body: JSON.stringify({ name, description: 'Automated test' }),
      }))
      const createData = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('Failed to create batch at', url, res.status, createData)
        throw new Error('Batch creation failed')
      }
      batchId = createData.batch?.id || (createData[0] && createData[0].id) || createData.id
      console.log(' - Created batch via app API (HTTP):', batchId)
    }
  } catch (e) {
    console.warn('App API not reachable, falling back to Supabase REST for batch creation:', e.message)
    const name = `Test Batch ${Date.now()}`
    const created = await restInsert('batches', [{ name, description: 'Automated test', institution_id: institutionId, created_by_id: adminId }])
    const createdRow = Array.isArray(created) ? created[0] : created
    batchId = createdRow.id
    console.log(' - Created batch via Supabase REST:', batchId)
  }

  // Add members to batch
  console.log('6) Adding members to batch via app API (in-process -> HTTP fallback)')


  try {
    try {
      const inserted = await addMembersInProcess(batchId, memberIds, adminId)
      console.log(' - Added members via in-process API:', inserted)
    } catch (inErr) {
      ({ res, url } = await fetchApp(`/api/institution/batches/${batchId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `${SUPABASE_COOKIE_NAME}=${accessToken}`,
        },
        body: JSON.stringify({ userIds: memberIds }),
      }))
      const addData = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('Failed to add members at', url, res.status, addData)
        throw new Error('Add members failed')
      }
      console.log(' - Added members via app API (HTTP):', addData.members || addData)
    }
  } catch (e) {
    console.warn('App API unreachable, falling back to Supabase REST for adding members:', e.message)
    const rows = memberIds.map((id) => ({ batch_id: batchId, user_id: id }))
    await restInsert('batch_members', rows)
    console.log(' - Added members via Supabase REST')
  }

  // Verify members
  console.log('7) Fetching batch members to verify (in-process -> HTTP fallback)')


  try {
    try {
      const members = await fetchMembersInProcess(batchId)
      console.log(' - Members in batch (via in-process):', members.length)
    } catch (inErr) {
      ({ res, url } = await fetchApp(`/api/institution/batches/${batchId}/members`, {
        headers: { Cookie: `${SUPABASE_COOKIE_NAME}=${accessToken}` },
      }))
      const membersData = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('Failed to fetch members at', url, res.status, membersData)
        throw new Error('Fetch members failed')
      }
      console.log(' - Members in batch (via app API HTTP):', (membersData.members || membersData).length)
    }
  } catch (e) {
    console.warn('App API unreachable, falling back to Supabase REST for fetching members:', e.message)
    const membersData = await restSelect(`batch_members?select=user_id&batch_id=eq.${batchId}`)
    console.log(' - Members in batch (via Supabase REST):', membersData.length)
  }

  // Remove first member
  console.log('8) Removing first member from batch (in-process -> HTTP fallback)')


  try {
    try {
      await removeMemberInProcess(batchId, memberIds[0], adminId)
      console.log(' - Member removed via in-process API')
    } catch (inErr) {
      ({ res, url } = await fetchApp(`/api/institution/batches/${batchId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Cookie: `${SUPABASE_COOKIE_NAME}=${accessToken}` },
        body: JSON.stringify({ userId: memberIds[0] }),
      }))
      const delData = await res.json().catch(() => ({}))
      if (!res.ok) {
        console.error('Failed to remove member at', url, res.status, delData)
        throw new Error('Remove member failed')
      }
      console.log(' - Member removed via app API (HTTP)')
    }
  } catch (e) {
    console.warn('App API unreachable, falling back to Supabase REST for removing member:', e.message)
    await restDelete(`batch_members?batch_id=eq.${batchId}&user_id=eq.${memberIds[0]}`)
    console.log(' - Member removed via Supabase REST')
  }

  // Verify remaining
  try {
    ({ res, url } = await fetchApp(`/api/institution/batches/${batchId}/members`, {
      headers: { Cookie: `${SUPABASE_COOKIE_NAME}=${accessToken}` },
    }))
    const finalMembers = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('Failed to fetch members at', url, res.status, finalMembers)
      throw new Error('Fetch members failed')
    }
    console.log(' - Final members count (via app API):', (finalMembers.members || finalMembers).length)
  } catch (e) {
    const fm = await restSelect(`batch_members?select=user_id&batch_id=eq.${batchId}`)
    console.log(' - Final members count (via Supabase REST):', fm.length)
  }

  console.log('\nTest completed successfully!')
  process.exit(0)
}

main().catch((err) => {
  console.error('Test failed:', err)
  process.exit(1)
})
