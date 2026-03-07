import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

/**
 * Handles auth confirmation when tokens are in hash fragments (Supabase default ConfirmationURL).
 * Client parses the hash and POSTs tokens here; we set the session cookie and run setup-profile.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const access_token = body.access_token as string | undefined
  const refresh_token = body.refresh_token as string | undefined

  if (!access_token || !refresh_token) {
    return NextResponse.json({ error: "Missing tokens" }, { status: 400 })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 500 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, {
            ...options,
            path: "/",
            maxAge: options?.maxAge ?? 60 * 60 * 24 * 7,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
          })
        })
      },
    },
  })

  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })

  if (error) {
    console.error("[auth/confirm-hash] setSession error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  if (!data.session) {
    return NextResponse.json({ error: "Session not established" }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  try {
    await fetch(`${origin}/api/auth/setup-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`,
      },
    })
  } catch {
    // Non-fatal
  }

  return NextResponse.json({ redirect: "/auth/verified" })
}
