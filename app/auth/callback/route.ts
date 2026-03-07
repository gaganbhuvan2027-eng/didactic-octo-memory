import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

/**
 * Server-side OAuth callback handler.
 * Exchanges the auth code for a session using PKCE. The code verifier is read from
 * cookies (set by createBrowserClient when signInWithOAuth was called).
 * This fixes "PKCE code verifier not found in storage" when using client-side exchange.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const errorParam = searchParams.get("error")
  const errorDescription = searchParams.get("error_description")

  if (errorParam) {
    const msg = errorDescription || errorParam
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(msg)}`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth?error=No+code", request.url))
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/auth?error=Auth+not+configured", request.url))
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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error.message)
    return NextResponse.redirect(
      new URL(`/auth?error=${encodeURIComponent(error.message)}`, request.url)
    )
  }

  if (!data.session) {
    return NextResponse.redirect(new URL("/auth?error=Sign-in+failed", request.url))
  }

  // Setup profile and credits (same as auth/confirm)
  const origin = request.nextUrl.origin
  try {
    await fetch(`${origin}/api/auth/setup-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`,
      },
    })
  } catch {
    // Non-fatal - user is still logged in
  }

  return NextResponse.redirect(new URL("/dashboard", request.url))
}
