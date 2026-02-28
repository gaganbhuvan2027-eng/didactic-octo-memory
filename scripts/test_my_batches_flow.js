require('dotenv').config({ path: '.env.local' })
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY
const fetch = require('node-fetch')

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE env vars')
  process.exit(1)
}

async function run() {
  // create institution if needed
  const instRes = await fetch(`${SUPABASE_URL}/rest/v1/institutions?select=id&limit=1`, { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } })
  const instJson = await instRes.json()
  let institutionId
  if (instJson && instJson.length > 0) {
    institutionId = instJson[0].id
  } else {
    const created = await fetch(`${SUPABASE_URL}/rest/v1/institutions`, { method: 'POST', headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type':'application/json', Prefer: 'return=representation' }, body: JSON.stringify([{ name: 'Test Institution (my-batches)', email_domain: 'example.test' }]) })
    const cjson = await created.json()
    institutionId = cjson[0].id
  }

  // create a test user
  const adminEmail = `mb-test+${Date.now()}@example.test`
  const adminPassword = 'Test1234!'
  const createdUserResp = await (await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, { method:'POST', headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: adminEmail, password: adminPassword, email_confirm: true }) })).json().catch(()=>({}))
  const createdUser = createdUserResp.data || createdUserResp
  const adminId = createdUser?.id || createdUser?.user?.id

  // upsert user row
  await fetch(`${SUPABASE_URL}/rest/v1/users`, { method:'POST', headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type':'application/json', Prefer: 'return=representation' }, body: JSON.stringify([{ id: adminId, email: adminEmail.toLowerCase(), name: 'mbtest', user_type: 'student', institution_id: institutionId }]) })

  // create batch
  const now = Date.now()
  const batchName = `MB Batch ${now}`
  const createdBatch = await (await fetch(`${SUPABASE_URL}/rest/v1/batches`, { method:'POST', headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type':'application/json', Prefer: 'return=representation' }, body: JSON.stringify([{ name: batchName, description: 'for my batches test', institution_id: institutionId, created_by_id: adminId }]) })).json()
  const batchId = createdBatch[0].id
  console.log('Created batch', batchId)

  // add member
  await fetch(`${SUPABASE_URL}/rest/v1/batch_members`, { method:'POST', headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type':'application/json', Prefer: 'return=representation' }, body: JSON.stringify([{ batch_id: batchId, user_id: adminId }]) })

  // schedule interview for that batch and user
  const futureDate = new Date(Date.now() + 1000*60*60).toISOString()
  const createInterview = await (await fetch(`${SUPABASE_URL}/rest/v1/scheduled_interviews`, { method:'POST', headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`, 'Content-Type':'application/json', Prefer: 'return=representation' }, body: JSON.stringify([{ course: 'MB Test Interview', difficulty: 'medium', scheduled_date: futureDate, member_id: adminId, scheduled_by_id: adminId, institution_id: institutionId, batch_id: batchId, status: 'pending' }]) })).json()
  console.log('Created interview', createInterview[0].id)

  // fetch interviews for the batch via REST
  const interviews = await (await fetch(`${SUPABASE_URL}/rest/v1/scheduled_interviews?batch_id=eq.${batchId}&select=*`, { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } })).json()
  console.log('Interviews for batch:', interviews.length)

  process.exit(0)
}

run().catch((e)=>{console.error(e); process.exit(1)})