import { NextResponse } from "next/server"
import crypto from "crypto"
import { createSession } from "@/lib/super-admin-auth"

// Rate limiting store for login attempts
// In production with multiple instances, use Redis/Upstash instead
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>()

const MAX_ATTEMPTS = 3
const LOCKOUT_DURATION = 24 * 60 * 60 * 1000 // 24 hours

function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }
  return request.headers.get("x-real-ip") || "unknown"
}

function isLockedOut(ip: string): { locked: boolean; remainingTime?: string } {
  const record = loginAttempts.get(ip)
  if (!record) return { locked: false }
  
  const now = Date.now()
  if (record.lockedUntil > now) {
    const remainingMs = record.lockedUntil - now
    const hours = Math.floor(remainingMs / (1000 * 60 * 60))
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
    return { 
      locked: true, 
      remainingTime: hours > 0 ? `${hours} hours ${minutes} minutes` : `${minutes} minutes`
    }
  }
  
  // Reset if lockout expired
  if (record.lockedUntil <= now && record.count >= MAX_ATTEMPTS) {
    loginAttempts.delete(ip)
  }
  
  return { locked: false }
}

function recordFailedAttempt(ip: string): { locked: boolean; attemptsLeft: number } {
  const now = Date.now()
  const record = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 }
  
  record.count += 1
  
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION
    loginAttempts.set(ip, record)
    console.warn(`[super-admin] IP ${ip} locked out for 24 hours after ${MAX_ATTEMPTS} failed attempts`)
    return { locked: true, attemptsLeft: 0 }
  }
  
  loginAttempts.set(ip, record)
  return { locked: false, attemptsLeft: MAX_ATTEMPTS - record.count }
}

function clearAttempts(ip: string): void {
  loginAttempts.delete(ip)
}

// Parse credentials from env - NO DEFAULT CREDENTIALS FOR SECURITY
function getSuperAdminCredentials() {
  const credentials: Record<string, string> = {}
  
  // Only use credentials from environment variables
  if (process.env.SUPERADMIN_CREDENTIALS) {
    const pairs = process.env.SUPERADMIN_CREDENTIALS.split(",")
    for (const pair of pairs) {
      const [email, password] = pair.split(":")
      if (email && password) {
        credentials[email.trim().toLowerCase()] = password.trim()
      }
    }
  }
  
  if (process.env.SUPERADMIN_EMAIL && process.env.SUPERADMIN_PASSWORD) {
    credentials[process.env.SUPERADMIN_EMAIL.toLowerCase()] = process.env.SUPERADMIN_PASSWORD
  }
  
  // If no credentials configured, log warning (but don't provide defaults!)
  if (Object.keys(credentials).length === 0) {
    console.warn("[super-admin] No credentials configured. Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD env vars.")
  }
  
  return credentials
}

function generateToken(email: string): string {
  const secret = process.env.SUPERADMIN_SECRET_KEY || "change-this-secret-key-in-production"
  const timestamp = Date.now()
  const data = `${email}:${timestamp}:${secret}`
  return crypto.createHash("sha256").update(data).digest("hex")
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request)
    
    // Check if IP is locked out
    const lockStatus = isLockedOut(ip)
    if (lockStatus.locked) {
      return NextResponse.json(
        { error: `Too many failed attempts. Try again in ${lockStatus.remainingTime}.` },
        { status: 429 }
      )
    }

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const credentials = getSuperAdminCredentials()
    const normalizedEmail = email.toLowerCase().trim()

    // Check if credentials match
    if (!credentials[normalizedEmail] || credentials[normalizedEmail] !== password) {
      const result = recordFailedAttempt(ip)
      
      if (result.locked) {
        return NextResponse.json(
          { error: "Too many failed attempts. Account locked for 24 hours." },
          { status: 429 }
        )
      }
      
      return NextResponse.json(
        { error: `Invalid credentials. ${result.attemptsLeft} attempt${result.attemptsLeft === 1 ? '' : 's'} remaining.` },
        { status: 401 }
      )
    }

    // Success - clear failed attempts
    clearAttempts(ip)

    // Create a new session
    const token = createSession(normalizedEmail)

    const response = NextResponse.json({
      success: true,
      token,
      email: normalizedEmail,
    })

    response.cookies.set("super_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return response
  } catch (error: any) {
    console.error("Error in super admin login:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
