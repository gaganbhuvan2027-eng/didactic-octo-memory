import { NextResponse } from "next/server"
import { verifyOTP, validateCredentials } from "@/lib/super-admin-otp"
import { createSession } from "@/lib/super-admin-auth"

// Rate limiting for OTP verification
const verifyAttempts = new Map<string, { count: number; lockedUntil: number }>()
const MAX_VERIFY_ATTEMPTS = 5
const LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes

function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }
  return request.headers.get("x-real-ip") || "unknown"
}

function checkVerifyRateLimit(ip: string): { allowed: boolean; error?: string } {
  const now = Date.now()
  const record = verifyAttempts.get(ip)

  if (!record) {
    return { allowed: true }
  }

  if (record.lockedUntil > now) {
    const remainingMs = record.lockedUntil - now
    const minutes = Math.ceil(remainingMs / (1000 * 60))
    return {
      allowed: false,
      error: `Too many failed attempts. Try again in ${minutes} minutes.`,
    }
  }

  // Reset if lockout expired
  if (record.lockedUntil <= now && record.count >= MAX_VERIFY_ATTEMPTS) {
    verifyAttempts.delete(ip)
  }

  return { allowed: true }
}

function recordFailedVerify(ip: string): void {
  const now = Date.now()
  const record = verifyAttempts.get(ip) || { count: 0, lockedUntil: 0 }

  record.count += 1

  if (record.count >= MAX_VERIFY_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION
    console.warn(`[super-admin-otp] IP ${ip} locked out for 30 minutes after ${MAX_VERIFY_ATTEMPTS} failed OTP attempts`)
  }

  verifyAttempts.set(ip, record)
}

function clearVerifyAttempts(ip: string): void {
  verifyAttempts.delete(ip)
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request)

    // Check rate limit
    const rateLimit = checkVerifyRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: rateLimit.error }, { status: 429 })
    }

    const { email, password, otp } = await request.json()

    if (!email || !password || !otp) {
      return NextResponse.json(
        { error: "Email, password, and OTP are required" },
        { status: 400 }
      )
    }

    // Step 1: Re-validate credentials
    if (!validateCredentials(email, password)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Step 2: Verify OTP
    const otpResult = verifyOTP(email, otp)

    if (!otpResult.valid) {
      recordFailedVerify(ip)
      return NextResponse.json({ error: otpResult.error }, { status: 401 })
    }

    // Step 3: Create session
    clearVerifyAttempts(ip)
    const normalizedEmail = email.toLowerCase().trim()
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

    console.log(`[super-admin-otp] Super admin ${normalizedEmail} logged in successfully with OTP`)

    return response
  } catch (error: any) {
    console.error("[super-admin-otp] Error in verify-otp:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

