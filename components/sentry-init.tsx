"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect, useRef } from "react"

/**
 * Explicitly initializes Sentry on the client.
 * Required for Next.js 16 + Turbopack — sentry.client.config.ts may not load.
 */
export function SentryInit({ children }: { children: React.ReactNode }) {
  const initialized = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined" || initialized.current) return
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
    if (!dsn) return

    initialized.current = true
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      enabled: process.env.NODE_ENV === "production",
      tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
      debug: false,
    })
  }, [])

  return <>{children}</>
}
