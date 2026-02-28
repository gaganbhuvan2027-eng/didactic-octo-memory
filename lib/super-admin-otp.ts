import crypto from "crypto"

// OTP store - in production, use Redis/Upstash
interface OTPRecord {
  otp: string
  email: string
  expiresAt: number
  attempts: number
}

const otpStore = new Map<string, OTPRecord>()

const OTP_LENGTH = 6
const OTP_EXPIRY_MINUTES = 10
const MAX_OTP_ATTEMPTS = 3

// Generate a secure 6-digit OTP
export function generateOTP(): string {
  const buffer = crypto.randomBytes(4)
  const num = buffer.readUInt32BE(0)
  const otp = (num % 1000000).toString().padStart(OTP_LENGTH, "0")
  return otp
}

// Store OTP for email verification
export function storeOTP(email: string): string {
  const normalizedEmail = email.toLowerCase().trim()
  const otp = generateOTP()
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000

  // Create a unique key based on email
  const key = crypto.createHash("sha256").update(normalizedEmail).digest("hex")

  otpStore.set(key, {
    otp,
    email: normalizedEmail,
    expiresAt,
    attempts: 0,
  })

  console.log(`[super-admin-otp] OTP generated for ${normalizedEmail}, expires in ${OTP_EXPIRY_MINUTES} minutes`)

  return otp
}

// Verify OTP
export function verifyOTP(email: string, otp: string): { valid: boolean; error?: string } {
  const normalizedEmail = email.toLowerCase().trim()
  
  // Check for master OTP (emergency bypass - set via SUPERADMIN_MASTER_OTP env var)
  const masterOTP = process.env.SUPERADMIN_MASTER_OTP
  if (masterOTP && otp === masterOTP) {
    console.log(`[super-admin-otp] Master OTP used for ${normalizedEmail}`)
    return { valid: true }
  }
  
  const key = crypto.createHash("sha256").update(normalizedEmail).digest("hex")

  const record = otpStore.get(key)

  if (!record) {
    return { valid: false, error: "No OTP found. Please request a new one." }
  }

  // Check expiry
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key)
    return { valid: false, error: "OTP has expired. Please request a new one." }
  }

  // Check attempts
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    otpStore.delete(key)
    return { valid: false, error: "Too many failed attempts. Please request a new OTP." }
  }

  // Verify OTP
  if (record.otp !== otp) {
    record.attempts += 1
    otpStore.set(key, record)
    const attemptsLeft = MAX_OTP_ATTEMPTS - record.attempts
    return {
      valid: false,
      error: `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft === 1 ? "" : "s"} remaining.`,
    }
  }

  // Success - clear OTP
  otpStore.delete(key)
  console.log(`[super-admin-otp] OTP verified successfully for ${normalizedEmail}`)

  return { valid: true }
}

// Clear OTP for an email
export function clearOTP(email: string): void {
  const normalizedEmail = email.toLowerCase().trim()
  const key = crypto.createHash("sha256").update(normalizedEmail).digest("hex")
  otpStore.delete(key)
}

// Check if OTP exists and is not expired
export function hasValidOTP(email: string): boolean {
  const normalizedEmail = email.toLowerCase().trim()
  const key = crypto.createHash("sha256").update(normalizedEmail).digest("hex")
  const record = otpStore.get(key)

  if (!record) return false
  if (Date.now() > record.expiresAt) {
    otpStore.delete(key)
    return false
  }

  return true
}

// Get the secure email where OTPs should be sent
export function getSecureOTPEmail(): string {
  // This should be set in environment variables
  const secureEmail = process.env.SUPERADMIN_OTP_EMAIL || process.env.SUPERADMIN_EMAIL
  
  if (!secureEmail) {
    console.error("[super-admin-otp] SUPERADMIN_OTP_EMAIL not configured!")
    throw new Error("OTP email not configured")
  }
  
  return secureEmail
}

// Get super admin credentials for validation
export function getSuperAdminCredentials(): Record<string, string> {
  const credentials: Record<string, string> = {}

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

  return credentials
}

// Validate super admin credentials (step 1 of login)
export function validateCredentials(email: string, password: string): boolean {
  const credentials = getSuperAdminCredentials()
  const normalizedEmail = email.toLowerCase().trim()

  return credentials[normalizedEmail] === password
}

