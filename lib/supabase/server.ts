import { createServerClient } from "@supabase/ssr"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { cookies, headers } from "next/headers"

/**
 * Replaced custom REST client with official @supabase/ssr package
 * This properly handles cookies and session management on the server
 */
export async function createClient() {
  const cookieStore = await cookies()
  const headerStore = await headers()

  // Allow passing a Bearer token via Authorization header for script/CI usage.
  const authHeader = headerStore.get('authorization')
  let accessToken: string | undefined = undefined
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    accessToken = authHeader.split(' ')[1]
  }

  // Use direct Supabase URL on server (bypass proxy) - faster, proxy only needed for browser in India
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  return createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken,
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              const opts = { ...options, path: "/" }
              // Persist across browser restarts (7 days) unless Supabase explicitly sets maxAge (e.g. 0 for logout)
              if (opts.maxAge === undefined) opts.maxAge = 60 * 60 * 24 * 7
              cookieStore.set(name, value, opts)
            })
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have proxy refreshing user sessions.
          }
        },
      },
    }
  )
}

/**
 * Creates an admin client using the service role key.
 * This client bypasses RLS and should only be used for admin operations.
 * Uses the standard supabase-js client (not SSR) to ensure service role privileges.
 */
export async function createAdminClient() {
  // Use direct Supabase URL on server (bypass proxy) - faster for interview/API routes
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!
  return createSupabaseClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
