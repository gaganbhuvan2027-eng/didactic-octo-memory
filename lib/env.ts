/**
 * Environment variable validation
 * This module validates that all required environment variables are set.
 * Import and call validateEnv() early in your application lifecycle.
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GROQ_API_KEY',
] as const

const optionalEnvVars = [
  'SUPERADMIN_CREDENTIALS',
  'SUPERADMIN_EMAIL',
  'SUPERADMIN_PASSWORD',
  'SUPERADMIN_SECRET_KEY',
  'ADMIN_HONEYPOT_ENABLED',
  'ADMIN_ALERT_WEBHOOK',
  'REAL_ADMIN_PATH',
] as const

type RequiredEnvVar = typeof requiredEnvVars[number]
type OptionalEnvVar = typeof optionalEnvVars[number]

interface EnvValidationResult {
  valid: boolean
  missing: RequiredEnvVar[]
  warnings: string[]
}

/**
 * Validates that all required environment variables are set.
 * @throws Error if any required environment variables are missing
 */
export function validateEnv(): EnvValidationResult {
  const missing: RequiredEnvVar[] = []
  const warnings: string[] = []

  // Check required vars
  for (const key of requiredEnvVars) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  // Check for common misconfigurations
  if (process.env.SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    warnings.push('SUPABASE_URL is set but NEXT_PUBLIC_SUPABASE_URL is not. Did you mean to use NEXT_PUBLIC_SUPABASE_URL?')
  }

  // Warn about super admin configuration
  const hasSuperAdminCreds = process.env.SUPERADMIN_CREDENTIALS || 
    (process.env.SUPERADMIN_EMAIL && process.env.SUPERADMIN_PASSWORD)
  
  if (!hasSuperAdminCreds) {
    warnings.push('No super admin credentials configured. Super admin features will use defaults.')
  }

  const result: EnvValidationResult = {
    valid: missing.length === 0,
    missing,
    warnings,
  }

  return result
}

/**
 * Validates environment variables and throws if any required ones are missing.
 * Call this at application startup.
 */
export function validateEnvOrThrow(): void {
  const result = validateEnv()
  
  if (result.warnings.length > 0) {
    console.warn('[env] Configuration warnings:')
    result.warnings.forEach(w => console.warn(`  - ${w}`))
  }

  if (!result.valid) {
    const errorMsg = `Missing required environment variables: ${result.missing.join(', ')}`
    console.error(`[env] ${errorMsg}`)
    throw new Error(errorMsg)
  }

  console.log('[env] Environment validation passed')
}

/**
 * Get a required environment variable, throwing if not set.
 * Useful for runtime checks.
 */
export function getRequiredEnv(key: RequiredEnvVar): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

/**
 * Get an optional environment variable with a default value.
 */
export function getOptionalEnv(key: OptionalEnvVar | string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue
}

