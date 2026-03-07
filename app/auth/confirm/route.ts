import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

type EmailOtpType = "signup" | "recovery" | "invite" | "magiclink" | "email_change" | "email"

/**
 * When Supabase uses default {{ .ConfirmationURL }}, it redirects with session in hash fragments.
 * The server cannot read hash - serve a client page that parses the hash and completes auth.
 */
function createHashFallbackPage(request: NextRequest): NextResponse {
  const origin = request.nextUrl.origin

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Confirming...</title></head>
<body>
<div style="font-family:sans-serif;text-align:center;padding:2rem;">Confirming your sign in...</div>
<script>
(function() {
  var hash = window.location.hash;
  if (!hash) {
    window.location.replace("/auth?error=Missing+token+or+type");
    return;
  }
  var params = new URLSearchParams(hash.substring(1));
  var access_token = params.get("access_token");
  var refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) {
    window.location.replace("/auth?error=Missing+token+or+type");
    return;
  }
  fetch("${origin}/api/auth/confirm-hash", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ access_token: access_token, refresh_token: refresh_token })
  })
  .then(function(r) { return r.json(); })
  .then(function(data) {
    if (data.redirect) {
      window.location.replace(data.redirect);
    } else {
      throw new Error(data.error || "auth failed");
    }
  })
  .catch(function(err) {
    console.error(err);
    window.location.replace("/auth?error=auth-failed");
  });
})();
</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}

/**
 * Server-side email confirmation handler.
 * Supabase redirects here with token_hash and type after user clicks the confirmation link.
 * Supports both token_hash and token params (Supabase default uses "token" in some flows).
 * Uses server-side Supabase client (direct to Supabase) - avoids ISP blocks.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get("token_hash") ?? searchParams.get("token")
  const type = searchParams.get("type") as EmailOtpType | null

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

  // No query params: Supabase may have already set the session (e.g. via its redirect).
  // If session exists, redirect to verified page. Otherwise try hash fallback.
  if (!token_hash || !type) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      return NextResponse.redirect(new URL("/auth/verified", request.url))
    }
    return createHashFallbackPage(request)
  }

  const validTypes: EmailOtpType[] = ["signup", "recovery", "invite", "magiclink", "email_change", "email"]
  if (!validTypes.includes(type)) {
    return NextResponse.redirect(new URL("/auth?error=Invalid+type", request.url))
  }

  const { data, error } = await supabase.auth.verifyOtp({ token_hash, type })

  if (error) {
    console.error("[auth/confirm] verifyOtp error:", error.message)
    return NextResponse.redirect(new URL("/auth?error=auth-failed", request.url))
  }

  if (!data.session) {
    return NextResponse.redirect(new URL("/auth?error=auth-failed", request.url))
  }

  // Recovery (password reset) → redirect to update-password page
  if (type === "recovery") {
    return NextResponse.redirect(new URL("/auth/update-password", request.url))
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

  return NextResponse.redirect(new URL("/auth/verified", request.url))
}
