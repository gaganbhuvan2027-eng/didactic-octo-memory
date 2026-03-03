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

export function createClient() {
  if (client) {
    return client
  }

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // When using proxy, always use current origin for same-origin requests (avoids CORS)
  if (typeof window !== "undefined" && url?.includes("/api/supabase-proxy")) {
    url = `${window.location.origin}/api/supabase-proxy`
  }
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

  console.log("[v0] Initializing Supabase client with URL:", url.substring(0, 20) + "...")

  client = createBrowserClient(url, key, {
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
