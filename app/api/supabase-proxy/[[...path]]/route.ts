import { NextRequest, NextResponse } from "next/server"

// Must be the real Supabase URL (https://xxx.supabase.co), NOT the proxy URL
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Proxies Supabase requests through Vercel.
 * Use when ISP blocks supabase.co (e.g. India).
 * Set NEXT_PUBLIC_SUPABASE_URL to https://your-app.vercel.app/api/supabase-proxy
 */
export async function GET(request: NextRequest, context: { params?: Promise<{ path?: string[] }> }) {
  return proxy(request, context)
}

export async function POST(request: NextRequest, context: { params?: Promise<{ path?: string[] }> }) {
  return proxy(request, context)
}

export async function PATCH(request: NextRequest, context: { params?: Promise<{ path?: string[] }> }) {
  return proxy(request, context)
}

export async function PUT(request: NextRequest, context: { params?: Promise<{ path?: string[] }> }) {
  return proxy(request, context)
}

export async function DELETE(request: NextRequest, context: { params?: Promise<{ path?: string[] }> }) {
  return proxy(request, context)
}

export async function OPTIONS(request: NextRequest, context: { params?: Promise<{ path?: string[] }> }) {
  return proxy(request, context)
}

async function proxy(request: NextRequest, context: { params?: Promise<{ path?: string[] }> }) {
  const resolvedParams = await (context?.params ?? Promise.resolve({}))
  const path = resolvedParams?.path ?? []

  // CORS preflight - respond immediately without forwarding to Supabase
  if (request.method === "OPTIONS") {
    const origin = request.headers.get("origin") || request.nextUrl.origin
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, prefer, range, cookie",
        "Access-Control-Max-Age": "86400",
      },
    })
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Supabase proxy not configured" }, { status: 500 })
  }

  const base = SUPABASE_URL.replace(/\/$/, "")
  const pathStr = path.length ? `/${path.join("/")}` : ""
  const url = `${base}${pathStr}${request.nextUrl.search}`

  const headers = new Headers()
  const forwardHeaders = [
    "authorization",
    "apikey",
    "content-type",
    "x-client-info",
    "prefer",
    "range",
    "cookie", // Essential for auth sessions - browser sends session cookies
  ]
  for (const name of forwardHeaders) {
    const val = request.headers.get(name)
    if (val) headers.set(name, val)
  }
  if (!headers.has("apikey")) headers.set("apikey", SUPABASE_ANON_KEY)

  let body: BodyInit | undefined
  if (["POST", "PATCH", "PUT"].includes(request.method)) {
    try {
      body = await request.text()
    } catch {
      body = undefined
    }
  }

  try {
    const res = await fetch(url, {
      method: request.method,
      headers,
      body: body || undefined,
    })

    const resHeaders = new Headers()
    const setCookieHeaders: string[] = []
    res.headers.forEach((v, k) => {
      const lower = k.toLowerCase()
      if (
        !lower.startsWith("content-encoding") &&
        !lower.startsWith("transfer-encoding") &&
        lower !== "connection"
      ) {
        if (lower === "set-cookie") {
          setCookieHeaders.push(v)
        } else {
          resHeaders.set(k, v)
        }
      }
    })
    // Forward Set-Cookie but strip Domain= so cookies are set for our domain (proxy)
    for (const setCookie of setCookieHeaders) {
      const rewritten = setCookie
        .split(";")
        .map((part) => part.trim())
        .filter((part) => !part.toLowerCase().startsWith("domain="))
        .join("; ")
      resHeaders.append("Set-Cookie", rewritten)
    }
    // Must use actual origin (not *) when using credentials - required for auth
    const origin = request.headers.get("origin") || request.nextUrl.origin
    resHeaders.set("Access-Control-Allow-Origin", origin)
    resHeaders.set("Access-Control-Allow-Credentials", "true")

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
    })
  } catch (err) {
    console.error("[supabase-proxy] Error:", err)
    return NextResponse.json(
      { error: "Proxy request failed", details: err instanceof Error ? err.message : String(err) },
      { status: 502 }
    )
  }
}
