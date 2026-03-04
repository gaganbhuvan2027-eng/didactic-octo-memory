import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

/**
 * Bypasses Chrome Web Locks API to prevent deadlocks on Chrome Mobile.
 * The default navigator.locks can hang indefinitely on Chromium browsers.
 */
const noOpLock = async (_name: unknown, _acquireTimeout: unknown, fn: () => Promise<unknown>) => {
  return await fn()
}

/** Extract project ref from anon key JWT payload (ref field). Supabase sets cookies as sb-{ref}-auth-token. */
function getProjectRefFromAnonKey(anonKey: string): string | null {
  try {
    const parts = anonKey.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))) as { ref?: string }
    return payload.ref ?? null
  } catch {
    return null
  }
}

export function createClient() {
  if (client) {
    return client
  }

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error("[v0] Missing Supabase environment variables:", {
      hasUrl: !!url,
      hasKey: !!key,
    })
    throw new Error(
      "Supabase is not configured. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
    )
  }

  // When using proxy, use current origin for same-origin requests (avoids CORS)
  // AND use Supabase's cookie name (sb-{projectRef}-auth-token) so we read the cookie Supabase sets
  const useProxy = typeof window !== "undefined" && url.includes("/api/supabase-proxy")
  if (useProxy) {
    url = `${window.location.origin}/api/supabase-proxy`
  }

  const projectRef = getProjectRefFromAnonKey(key)
  const cookieOptions =
    useProxy && projectRef ? { name: `sb-${projectRef}-auth-token` } : undefined

  console.log("[v0] Initializing Supabase client with URL:", url.substring(0, 20) + "...")

  client = createBrowserClient(url, key, {
    cookieOptions,
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      // PKCE flow: uses ?code= query params instead of # fragments (Chrome Mobile strips fragments)
      flowType: "pkce",
      lock: noOpLock,
    },
  })

  return client
}
