/*
  Run a distribution end-to-end using SUPABASE_SERVICE_ROLE_KEY.
  Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/run_distribute_test.js
*/

require('dotenv').config({ path: '.env.local' })
const { randomUUID } = require('crypto')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment')
  process.exit(1)
}

const API_HEADERS = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
}

async function restInsert(table, rows) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url, { method: 'POST', headers: { ...API_HEADERS, Prefer: 'return=representation' }, body: JSON.stringify(rows) })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${text}`)
  return JSON.parse(text)
}

async function restUpsert(table, rows, onConflict) {
  const url = `${SUPABASE_URL}/rest/v1/${table}`
  const res = await fetch(url + `?on_conflict=${onConflict}`, { method: 'POST', headers: { ...API_HEADERS, Prefer: 'return=representation, resolution=merge-duplicates' }, body: JSON.stringify(rows) })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${text}`)
  return JSON.parse(text)
}

async function restSelect(table, query = '') {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`
  const res = await fetch(url, { method: 'GET', headers: API_HEADERS })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${text}`)
  return JSON.parse(text)
}

async function rpc(name, body) {
  // Use the REST RPC endpoint path
  const url = `${SUPABASE_URL}/rest/v1/rpc/${name}`
  const res = await fetch(url, { method: 'POST', headers: API_HEADERS, body: JSON.stringify(body) })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} - ${text}`)
  return JSON.parse(text)
}

async function main() {
  try {
    console.log('Creating test institution...')
    const instName = `Dist Test Inst ${Date.now()}`
    const instRows = await restInsert('institutions', [{ name: instName, email_domain: `dist${Date.now()}.test` }])
    const institutionId = instRows[0].id

    console.log('Looking for existing institution admin and members to reuse...')
    // Attempt to find an institution_admin for this institution; if none, try to find any institution_admin and use their institution
    let adminCandidates = await restSelect("users?select=id,user_type,institution_id&user_type=eq.institution_admin&institution_id=not.is.null&limit=1")
    let adminId = null
    let usedInstitutionId = institutionId

    if (adminCandidates.length > 0) {
      adminId = adminCandidates[0].id
      usedInstitutionId = adminCandidates[0].institution_id || institutionId
      console.log('Found existing institution admin:', adminId)
    } else {
      // Try to find any student users in this institution to act as members and find an admin later
      console.log('No existing institution admin found; will look for student users to reuse as members')
    }

    // Find members (students) in the institution
    const memberRows = await restSelect(`users?select=id,user_type,institution_id&institution_id=eq.${usedInstitutionId}&user_type=eq.student&limit=10`)
    const memberIds = memberRows.map((r) => r.id)

    if (memberIds.length === 0) {
      console.error('No existing student members found in the institution to run an automated distribution test. Please create at least one student user in the institution or run the script manually with proper auth users.')
      process.exit(2)
    }

    // Take up to 3 members
    const membersToUse = memberIds.slice(0, 3)
    console.log('Using members:', membersToUse)

    // If we didn't find an admin, try to reuse the SUPERADMIN from env (not ideal) or abort
    if (!adminId) {
      if (process.env.SUPERADMIN_EMAIL) {
        const su = await restSelect(`users?select=id,email,user_type,institution_id&email=eq.${process.env.SUPERADMIN_EMAIL}&limit=1`)
        if (su.length > 0) {
          adminId = su[0].id
          usedInstitutionId = su[0].institution_id || usedInstitutionId
          console.log('Reusing SUPERADMIN as admin for test:', adminId)
        }
      }

      if (!adminId) {
        console.error('No admin user found to perform the RPC. Please ensure there is an institution_admin in the institution or provide SUPERADMIN_EMAIL in .env.local.')
        process.exit(2)
      }
    }

    // Use membersToUse as members of the new batch
    console.log('Creating batch and adding members...')
    const { id: batchId } = (await restInsert('batches', [{ name: `Dist Batch ${Date.now()}`, institution_id: usedInstitutionId, created_by_id: adminId }]))[0]
    const bmRows = membersToUse.map((mid) => ({ batch_id: batchId, user_id: mid }))
    await restInsert('batch_members', bmRows)

    // Use member count from selected members
    const memberCount = membersToUse.length

    console.log('Seeding institution credits...')
    const initialBalance = 1000
    await restUpsert('institution_credits', [{ institution_id: usedInstitutionId, balance: initialBalance }], 'institution_id')

    console.log('Calling RPC distribute_credits_to_batch...')
    const perMember = 10
    const rpcData = await rpc('distribute_credits_to_batch', { p_batch_id: batchId, p_amount_per_member: perMember, p_performed_by: adminId })

    console.log('RPC result:', rpcData)

    // Verify institution balance
    const instAfterArr = await restSelect('institution_credits?select=balance&institution_id=eq.' + usedInstitutionId)
    const instAfter = instAfterArr[0]
    const expectedBalance = initialBalance - perMember * memberCount
    if (Number(instAfter.balance) !== expectedBalance) {
      console.error('Unexpected institution balance:', instAfter.balance, 'expected', expectedBalance)
      process.exit(3)
    }

    // Verify each member has user_credits updated
    const userCredits = await restSelect('user_credits?select=user_id,balance')
    const filtered = userCredits.filter((r) => membersToUse.includes(r.user_id) && Number(r.balance) >= perMember)
    const missing = membersToUse.filter((id) => !filtered.find((r) => r.user_id === id))
    if (missing.length > 0) {
      console.error('Some members did not receive credits:', missing)
      process.exit(4)
    }

    console.log('Distribution verified successfully ✅')
    console.log('Cleanup: leaving test data intact for inspection (you can delete later)')
    process.exit(0)
  } catch (err) {
    console.error('Test failed:', err)
    process.exit(1)
  }
}

main()
