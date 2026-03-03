import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

type EmailOtpType = "signup" | "recovery" | "invite" | "magiclink" | "email_change" | "email"

/**
 * Server-side email confirmation handler.
 * Supabase redirects here with token_hash and type after user clicks the confirmation link.
 * Uses server-side Supabase client (direct to Supabase) - avoids ISP blocks.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null

  if (!token_hash || !type) {
    return NextResponse.redirect(new URL("/auth?error=Missing+token+or+type", request.url))
  }

  const validTypes: EmailOtpType[] = ["signup", "recovery", "invite", "magiclink", "email_change", "email"]
  if (!validTypes.includes(type)) {
    return NextResponse.redirect(new URL("/auth?error=Invalid+type", request.url))
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

  const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })

  if (error) {
    console.error("[auth/confirm] verifyOtp error:", error.message)
    return NextResponse.redirect(new URL("/auth?error=auth-failed", request.url))
  }

  if (!data.session) {
    return NextResponse.redirect(new URL("/auth?error=auth-failed", request.url))
  }

  // Setup profile and credits (same as OAuth callback)
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
