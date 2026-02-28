/**
 * Next.js Instrumentation
 * This file runs once when the Next.js server starts.
 * Used for environment validation and startup checks.
 * 
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run validation on the server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { validateEnvOrThrow } = await import('./lib/env')
    
    try {
      validateEnvOrThrow()
    } catch (error) {
      // In development, log the error but don't crash
      // In production, this should fail fast
      if (process.env.NODE_ENV === 'production') {
        console.error('[instrumentation] Critical: Environment validation failed')
        throw error
      } else {
        console.warn('[instrumentation] Environment validation failed (dev mode - continuing anyway)')
        console.warn(error)
      }
    }
  }
}

