import { cookies } from "next/headers"
import crypto from "crypto"

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days

// Generate a secure session token that includes email and expiry
// Format: base64(email:expiresAt:signature)
function generateSessionToken(email: string): string {
  const secret = process.env.SUPERADMIN_SECRET_KEY || process.env.SUPERADMIN_PASSWORD || "fallback-secret"
  const expiresAt = Date.now() + SESSION_DURATION
  const data = `${email.toLowerCase()}:${expiresAt}`
  const signature = crypto.createHmac("sha256", secret).update(data).digest("hex")
  const token = Buffer.from(`${data}:${signature}`).toString("base64")
  return token
}

// Verify and decode a session token
function verifySessionToken(token: string): { valid: boolean; email?: string; expiresAt?: number } {
  try {
    const secret = process.env.SUPERADMIN_SECRET_KEY || process.env.SUPERADMIN_PASSWORD || "fallback-secret"
    const decoded = Buffer.from(token, "base64").toString("utf-8")
    const parts = decoded.split(":")
    
    if (parts.length !== 3) {
      console.log("[super-admin-auth] Invalid token format")
      return { valid: false }
    }
    
    const [email, expiresAtStr, signature] = parts
    const expiresAt = parseInt(expiresAtStr, 10)
    
    // Check expiry
    if (Date.now() > expiresAt) {
      console.log("[super-admin-auth] Token expired")
      return { valid: false }
    }
    
    // Verify signature
    const data = `${email}:${expiresAtStr}`
    const expectedSignature = crypto.createHmac("sha256", secret).update(data).digest("hex")
    
    if (signature !== expectedSignature) {
      console.log("[super-admin-auth] Invalid token signature")
      return { valid: false }
    }
    
    return { valid: true, email, expiresAt }
  } catch (error) {
    console.error("[super-admin-auth] Error verifying token:", error)
    return { valid: false }
  }
}

export function createSession(email: string): string {
  const token = generateSessionToken(email)
  console.log(`[super-admin-auth] Session created for ${email}`)
  return token
}

export function destroySession(token: string): void {
  // With signed tokens, we don't need to track sessions server-side
  // The cookie will be cleared client-side
  console.log("[super-admin-auth] Session destroyed")
}

export async function verifySuperAdminSession(cookieStoreParam?: any): Promise<{ authenticated: boolean; email?: string }> {
  try {
    // Use provided cookie store or get from headers
    const cookieStore = cookieStoreParam || await cookies()
    const sessionToken = cookieStore.get("super_admin_session")?.value

    if (!sessionToken) {
      console.log("[super-admin-auth] No session token found")
      return { authenticated: false }
    }

    // Verify the signed token
    const result = verifySessionToken(sessionToken)
    
    if (!result.valid) {
      return { authenticated: false }
    }

    console.log(`[super-admin-auth] Session verified for ${result.email}`)
    return { authenticated: true, email: result.email }
  } catch (error) {
    console.error("[super-admin-auth] Error verifying session:", error)
    return { authenticated: false }
  }
}
