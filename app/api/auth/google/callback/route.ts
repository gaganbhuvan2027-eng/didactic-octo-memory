import * as Sentry from "@sentry/nextjs"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

/**
 * Google OAuth callback - runs entirely on our domain.
 * Exchanges code for Google id_token, then Supabase session (server→Supabase, not blocked in India).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const errorParam = searchParams.get("error")
  const stateParam = searchParams.get("state")

  if (errorParam) {
    const desc = searchParams.get("error_description") || errorParam
    return NextResponse.redirect(new URL(`/auth?error=${encodeURIComponent(desc)}`, request.url))
  }

  if (!code) {
    return NextResponse.redirect(new URL("/auth?error=No+authorization+code", request.url))
  }

  // CSRF: validate state
  const cookieStore = await cookies()
  const stateCookie = cookieStore.get("google_oauth_state")?.value
  cookieStore.delete("google_oauth_state")
  if (!stateParam || stateParam !== stateCookie) {
    return NextResponse.redirect(new URL("/auth?error=Invalid+state", request.url))
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!clientId || !clientSecret || !redirectUri || !supabaseUrl || !supabaseAnonKey) {
    console.error("[auth/google/callback] Missing env vars")
    return NextResponse.redirect(new URL("/auth?error=Auth+not+configured", request.url))
  }

  try {
    // 1. Exchange code for Google tokens (our server → Google, works from anywhere)
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    if (!tokenRes.ok) {
      const errText = await tokenRes.text()
      console.error("[auth/google/callback] Google token error:", errText)
      Sentry.captureMessage(`Google token exchange failed: ${errText}`)
      return NextResponse.redirect(
        new URL("/auth?error=" + encodeURIComponent("Google sign-in failed. Please try again."), request.url)
      )
    }

    const tokens = (await tokenRes.json()) as { id_token?: string; access_token?: string }
    const idToken = tokens.id_token

    if (!idToken) {
      console.error("[auth/google/callback] No id_token in response")
      return NextResponse.redirect(
        new URL("/auth?error=" + encodeURIComponent("Google sign-in failed. Please try again."), request.url)
      )
    }

    // 2. Exchange Google id_token for Supabase session (our server → Supabase, works from Vercel)
    const supabaseTokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=id_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
      },
      body: JSON.stringify({
        provider: "google",
        id_token: idToken,
      }),
    })

    if (!supabaseTokenRes.ok) {
      const errText = await supabaseTokenRes.text()
      console.error("[auth/google/callback] Supabase token error:", errText)
      Sentry.captureMessage(`Supabase id_token exchange failed: ${errText}`)
      return NextResponse.redirect(
        new URL("/auth?error=" + encodeURIComponent("Sign-in failed. Please try again."), request.url)
      )
    }

    const sessionData = (await supabaseTokenRes.json()) as {
      access_token?: string
      refresh_token?: string
      expires_in?: number
    }

    const accessToken = sessionData.access_token
    const refreshToken = sessionData.refresh_token

    if (!accessToken || !refreshToken) {
      console.error("[auth/google/callback] No session in Supabase response")
      return NextResponse.redirect(
        new URL("/auth?error=" + encodeURIComponent("Sign-in failed. Please try again."), request.url)
      )
    }

    // 3. Set Supabase session in cookies (so client picks it up)
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

    await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })

    // 4. Setup profile and credits (same as Supabase callback)
    const origin = request.nextUrl.origin
    const setupRes = await fetch(`${origin}/api/auth/setup-profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    })
    if (!setupRes.ok) {
      console.warn("[auth/google/callback] Profile setup failed, user still logged in")
    }

    return NextResponse.redirect(new URL("/dashboard", request.url))
  } catch (err) {
    Sentry.captureException(err)
    console.error("[auth/google/callback] Error:", err)
    return NextResponse.redirect(
      new URL("/auth?error=" + encodeURIComponent("Sign-in failed. Please try again."), request.url)
    )
  }
}
