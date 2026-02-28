import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, just pass through the request
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("[v0] Supabase environment variables not found, skipping session update")
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          const opts = {
            ...options,
            path: "/",
            sameSite: "lax" as const,
            secure: process.env.NODE_ENV === "production",
          }
          // Persist across browser sessions (7 days) unless Supabase sets maxAge (e.g. 0 for logout)
          if (opts.maxAge === undefined) opts.maxAge = 60 * 60 * 24 * 7
          supabaseResponse.cookies.set(name, value, opts)
        })
      },
    },
  })

  try {
    await supabase.auth.getUser()
  } catch (error) {
    console.error("[v0] Error refreshing Supabase session:", error)
  }

  return supabaseResponse
}
