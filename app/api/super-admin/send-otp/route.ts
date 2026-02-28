import { NextResponse } from "next/server"
import { storeOTP, validateCredentials, getSecureOTPEmail, hasValidOTP } from "@/lib/super-admin-otp"

// Rate limiting for OTP requests
const otpRequestAttempts = new Map<string, { count: number; lastRequest: number }>()
const MAX_OTP_REQUESTS_PER_HOUR = 5
const OTP_REQUEST_WINDOW = 60 * 60 * 1000 // 1 hour

function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }
  return request.headers.get("x-real-ip") || "unknown"
}

function checkOTPRateLimit(ip: string): { allowed: boolean; error?: string } {
  const now = Date.now()
  const record = otpRequestAttempts.get(ip)

  if (!record) {
    otpRequestAttempts.set(ip, { count: 1, lastRequest: now })
    return { allowed: true }
  }

  // Reset if window has passed
  if (now - record.lastRequest > OTP_REQUEST_WINDOW) {
    otpRequestAttempts.set(ip, { count: 1, lastRequest: now })
    return { allowed: true }
  }

  if (record.count >= MAX_OTP_REQUESTS_PER_HOUR) {
    const remainingMs = OTP_REQUEST_WINDOW - (now - record.lastRequest)
    const minutes = Math.ceil(remainingMs / (1000 * 60))
    return {
      allowed: false,
      error: `Too many OTP requests. Please try again in ${minutes} minutes.`,
    }
  }

  record.count += 1
  record.lastRequest = now
  otpRequestAttempts.set(ip, record)
  return { allowed: true }
}

// Send email using Resend API
async function sendOTPEmailViaResend(otp: string, recipientEmail: string): Promise<{ success: boolean; error?: string }> {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    return { success: false, error: "RESEND_API_KEY not configured" }
  }

  try {
    console.log("[super-admin-otp] Sending OTP via Resend to:", recipientEmail)
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: recipientEmail,
        subject: "🔐 Super Admin Login OTP - MockaAI",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a1a; text-align: center;">Super Admin Login</h1>
            <div style="background: #f5f5f5; border-radius: 8px; padding: 30px; text-align: center; margin: 20px 0;">
              <p style="color: #666; margin-bottom: 10px;">Your One-Time Password is:</p>
              <h2 style="color: #0070f3; font-size: 36px; letter-spacing: 8px; margin: 20px 0;">${otp}</h2>
              <p style="color: #999; font-size: 14px;">This code expires in 10 minutes.</p>
            </div>
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 4px; padding: 15px; margin-top: 20px;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                ⚠️ <strong>Security Notice:</strong> If you didn't request this code, please ignore this email and ensure your credentials are secure.
              </p>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              This is an automated message from MockaAI. Do not reply to this email.
            </p>
          </div>
        `,
      }),
    })

    const responseData = await response.json().catch(() => ({}))
    
    if (!response.ok) {
      console.error("[super-admin-otp] Resend API error:", responseData)
      return { success: false, error: responseData?.message || `Resend API error: ${response.status}` }
    }

    console.log("[super-admin-otp] OTP email sent successfully via Resend")
    return { success: true }
  } catch (error: any) {
    console.error("[super-admin-otp] Resend error:", error)
    return { success: false, error: error?.message || "Failed to send email" }
  }
}

// Send OTP email with fallbacks
async function sendOTPEmail(otp: string, recipientEmail: string): Promise<{ success: boolean; error?: string; method?: string }> {
  // Try Resend first
  const resendResult = await sendOTPEmailViaResend(otp, recipientEmail)
  if (resendResult.success) {
    return { success: true, method: "resend" }
  }

  // If Resend fails or not configured, log to console (for development/debugging)
  console.log("========================================")
  console.log("[SUPER ADMIN OTP] Email sending failed via Resend")
  console.log(`[SUPER ADMIN OTP] Resend error: ${resendResult.error}`)
  console.log(`[SUPER ADMIN OTP] Your OTP is: ${otp}`)
  console.log(`[SUPER ADMIN OTP] Should be sent to: ${recipientEmail}`)
  console.log("========================================")

  // In production, we should fail if email can't be sent
  // In development, we can allow console logging as fallback
  if (process.env.NODE_ENV === "production") {
    return { success: false, error: resendResult.error || "Email service not available" }
  }

  // Development fallback - consider it "sent" (logged to console)
  return { success: true, method: "console" }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIP(request)
    console.log("[super-admin-otp] Send OTP request from IP:", ip)

    // Check rate limit
    const rateLimit = checkOTPRateLimit(ip)
    if (!rateLimit.allowed) {
      console.log("[super-admin-otp] Rate limited:", rateLimit.error)
      return NextResponse.json({ error: rateLimit.error }, { status: 429 })
    }

    const body = await request.json()
    const { email, password } = body
    console.log("[super-admin-otp] Login attempt for email:", email)

    if (!email || !password) {
      console.log("[super-admin-otp] Missing email or password")
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    // Step 1: Validate credentials first
    console.log("[super-admin-otp] Validating credentials...")
    if (!validateCredentials(email, password)) {
      console.log("[super-admin-otp] Invalid credentials for:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }
    console.log("[super-admin-otp] Credentials valid for:", email)

    // Step 2: Check if there's already a valid OTP
    if (hasValidOTP(email)) {
      console.log("[super-admin-otp] OTP already exists for:", email)
      const secureEmail = getSecureOTPEmail()
      const maskedEmail = secureEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")
      return NextResponse.json({
        success: true,
        message: "OTP already sent. Please check your secure email or wait for it to expire.",
        maskedEmail,
      })
    }

    // Step 3: Get secure email first (to fail early if not configured)
    let secureEmail: string
    try {
      secureEmail = getSecureOTPEmail()
      console.log("[super-admin-otp] Secure email configured:", secureEmail)
    } catch (err) {
      console.error("[super-admin-otp] Secure email not configured!")
      return NextResponse.json(
        { error: "OTP email not configured. Please set SUPERADMIN_OTP_EMAIL environment variable." },
        { status: 500 }
      )
    }

    // Step 4: Generate OTP
    const otp = storeOTP(email)
    console.log("[super-admin-otp] OTP generated:", otp)

    // Step 5: Send OTP to secure email
    console.log("[super-admin-otp] Sending OTP to:", secureEmail)
    const emailResult = await sendOTPEmail(otp, secureEmail)

    if (!emailResult.success) {
      console.error("[super-admin-otp] Failed to send OTP email:", emailResult.error)
      return NextResponse.json(
        { error: `Failed to send OTP email: ${emailResult.error}. Please configure RESEND_API_KEY.` },
        { status: 500 }
      )
    }
    
    console.log("[super-admin-otp] Email sent via:", emailResult.method)

    // Mask the secure email for display
    const maskedEmail = secureEmail.replace(/(.{2})(.*)(@.*)/, "$1***$3")
    console.log("[super-admin-otp] OTP sent successfully, masked email:", maskedEmail)

    return NextResponse.json({
      success: true,
      message: `OTP sent to ${maskedEmail}. Please check your email.`,
      maskedEmail,
    })
  } catch (error: any) {
    console.error("[super-admin-otp] Error in send-otp:", error?.message || error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}

