import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

export function createClient() {
  if (client) {
    return client
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
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
      // Implicit flow: tokens in URL fragment, no code_verifier needed (avoids "both auth code and code verifier should be non-empty" error)
      flowType: "implicit",
    },
  })

  return client
}
