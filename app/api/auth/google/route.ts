import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

const STATE_COOKIE = "google_oauth_state"

/**
 * Initiates Google OAuth flow.
 * Redirects to Google - callback goes to OUR domain (not supabase.co), avoiding ISP blocks in India.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !redirectUri) {
    console.error("[auth/google] Missing GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI")
    return NextResponse.redirect(new URL("/auth?error=Google+auth+not+configured", request.url))
  }

  const state = crypto.randomUUID()
  const cookieStore = await cookies()
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 min
    path: "/",
  })

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  })

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  return NextResponse.redirect(googleAuthUrl)
}
