import { NextResponse } from "next/server"
import { cookies } from "next/headers"

/**
 * In-memory rate limiting for super admin API actions.
 * 
 * NOTE: This uses an in-memory Map which works for single-instance deployments.
 * In serverless environments (Vercel, AWS Lambda), each request may hit a different
 * instance, making this rate limiting less effective. For production serverless
 * deployments, consider using Redis/Upstash for distributed rate limiting.
 */
const actionAttempts = new Map<string, { count: number; resetAt: number }>()

const MAX_ACTIONS_PER_MINUTE = 30
const WINDOW_MS = 60 * 1000 // 1 minute

function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }
  return request.headers.get("x-real-ip") || "unknown"
}

export function rateLimitSuperAdminAction(request: Request): { allowed: boolean; error?: NextResponse } {
  const ip = getClientIP(request)
  const now = Date.now()
  const record = actionAttempts.get(ip)

  if (!record || record.resetAt < now) {
    actionAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true }
  }

  if (record.count >= MAX_ACTIONS_PER_MINUTE) {
    return {
      allowed: false,
      error: NextResponse.json(
        { error: "Too many requests. Please wait a minute." },
        { status: 429 }
      )
    }
  }

  record.count += 1
  actionAttempts.set(ip, record)
  return { allowed: true }
}

export async function verifySuperAdminRequest(request: Request): Promise<{ 
  authorized: boolean
  error?: NextResponse 
}> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get("super_admin_session")?.value

    if (!sessionToken) {
      return {
        authorized: false,
        error: NextResponse.json({ error: "Unauthorized - Please login as super admin" }, { status: 401 })
      }
    }

    // Verify the signed token
    const secret = process.env.SUPERADMIN_SECRET_KEY || process.env.SUPERADMIN_PASSWORD || "fallback-secret"
    try {
      const decoded = Buffer.from(sessionToken, "base64").toString("utf-8")
      const parts = decoded.split(":")
      
      if (parts.length !== 3) {
        return {
          authorized: false,
          error: NextResponse.json({ error: "Invalid session token" }, { status: 401 })
        }
      }
      
      const [email, expiresAtStr, signature] = parts
      const expiresAt = parseInt(expiresAtStr, 10)
      
      // Check expiry
      if (Date.now() > expiresAt) {
        return {
          authorized: false,
          error: NextResponse.json({ error: "Session expired - Please login again" }, { status: 401 })
        }
      }
      
      // Verify signature
      const crypto = await import("crypto")
      const data = `${email}:${expiresAtStr}`
      const expectedSignature = crypto.createHmac("sha256", secret).update(data).digest("hex")
      
      if (signature !== expectedSignature) {
        return {
          authorized: false,
          error: NextResponse.json({ error: "Invalid session" }, { status: 401 })
        }
      }
    } catch (tokenError) {
      console.error("[super-admin-middleware] Token verification error:", tokenError)
      return {
        authorized: false,
        error: NextResponse.json({ error: "Invalid session token format" }, { status: 401 })
      }
    }

    // Check rate limit
    const rateLimit = rateLimitSuperAdminAction(request)
    if (!rateLimit.allowed) {
      return { authorized: false, error: rateLimit.error }
    }

    return { authorized: true }
  } catch (error) {
    console.error("Error verifying super admin request:", error)
    return {
      authorized: false,
      error: NextResponse.json({ error: "Authentication error" }, { status: 500 })
    }
  }
}
