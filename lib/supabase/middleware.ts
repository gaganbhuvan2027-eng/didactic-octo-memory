import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export function createClient(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  // When proxy is enabled, use direct Supabase URL so we read sb-{projectRef}-auth-token (cookie Supabase sets).
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const directUrl = process.env.SUPABASE_URL || ""
  const supabaseUrl =
    baseUrl.includes("/api/supabase-proxy") && directUrl ? directUrl : baseUrl

  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
            }),
          )
        },
      },
    },
  )

  return { supabase, response }
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // When proxy is enabled, use direct Supabase URL so we read sb-{projectRef}-auth-token (cookie Supabase sets).
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const directUrl = process.env.SUPABASE_URL || ""
  const supabaseUrl =
    baseUrl.includes("/api/supabase-proxy") && directUrl ? directUrl : baseUrl

  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
            }),
          )
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const user = session?.user

  // Redirect unauthenticated users trying to access protected routes
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/auth") &&
    !request.nextUrl.pathname.startsWith("/_next") &&
    !request.nextUrl.pathname.startsWith("/api") &&
    request.nextUrl.pathname !== "/" &&
    request.nextUrl.pathname !== "/about" &&
    request.nextUrl.pathname !== "/contact" &&
    request.nextUrl.pathname !== "/subscription" &&
    request.nextUrl.pathname !== "/pricing" &&
    request.nextUrl.pathname !== "/privacy" &&
    request.nextUrl.pathname !== "/terms"
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
