import { NextRequest, NextResponse } from "next/server"

// Must be the real Supabase URL (https://xxx.supabase.co), NOT the proxy URL
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Proxies Supabase requests through Vercel.
 * Use when ISP blocks supabase.co (e.g. India).
 * Set NEXT_PUBLIC_SUPABASE_URL to https://your-app.vercel.app/api/supabase-proxy
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, params)
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, params)
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, params)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, params)
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, params)
}

export async function OPTIONS(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  return proxy(request, params)
}

async function proxy(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
  const { path = [] } = await params

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
    res.headers.forEach((v, k) => {
      if (
        !k.startsWith("content-encoding") &&
        !k.startsWith("transfer-encoding") &&
        k.toLowerCase() !== "connection"
      ) {
        resHeaders.set(k, v)
      }
    })
    resHeaders.set("Access-Control-Allow-Origin", request.headers.get("origin") || "*")

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
