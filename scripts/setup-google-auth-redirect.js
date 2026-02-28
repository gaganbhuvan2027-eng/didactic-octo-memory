/**
 * Adds /auth/callback to Supabase auth redirect URLs for Google OAuth.
 * Requires: SUPABASE_ACCESS_TOKEN (get from https://supabase.com/dashboard/account/tokens)
 *
 * Run: node scripts/setup-google-auth-redirect.js
 * Or:  SUPABASE_ACCESS_TOKEN=sbp_xxx node scripts/setup-google-auth-redirect.js
 */

const PROJECT_REF = 'nrjgfxxjrbmxcsscedbr' // from NEXT_PUBLIC_SUPABASE_URL
const REDIRECT_URLS = [
  'http://localhost:3000/auth/callback',
  'http://127.0.0.1:3000/auth/callback',
  // Add production URL via env: NEXT_PUBLIC_VERCEL_URL or SITE_URL
  ...(process.env.NEXT_PUBLIC_VERCEL_URL
    ? [`https://${process.env.NEXT_PUBLIC_VERCEL_URL}/auth/callback`]
    : []),
  ...(process.env.SITE_URL
    ? [`${process.env.SITE_URL.replace(/\/$/, '')}/auth/callback`]
    : []),
]

async function main() {
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT
  if (!token) {
    console.error('Error: SUPABASE_ACCESS_TOKEN or SUPABASE_PAT is required.')
    console.error('Get a token from: https://supabase.com/dashboard/account/tokens')
    process.exit(1)
  }

  const base = 'https://api.supabase.com/v1/projects'
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  // 1. Get current auth config
  const getRes = await fetch(`${base}/${PROJECT_REF}/config/auth`, { headers })
  if (!getRes.ok) {
    console.error('Failed to get auth config:', getRes.status, await getRes.text())
    process.exit(1)
  }
  const config = await getRes.json()

  // 2. Merge redirect URLs (uri_allow_list is comma-separated or array)
  let existing = config.uri_allow_list || ''
  if (Array.isArray(existing)) {
    existing = existing.join(',')
  }
  const existingList = existing ? existing.split(',').map((s) => s.trim()).filter(Boolean) : []
  const merged = [...new Set([...existingList, ...REDIRECT_URLS])]
  const uriAllowList = merged.join(',')

  // 3. PATCH auth config
  const patchRes = await fetch(`${base}/${PROJECT_REF}/config/auth`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ uri_allow_list: uriAllowList }),
  })

  if (!patchRes.ok) {
    console.error('Failed to update auth config:', patchRes.status, await patchRes.text())
    process.exit(1)
  }

  console.log('Success! Auth redirect URLs updated.')
  console.log('Redirect URLs now include:', merged.join(', '))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
