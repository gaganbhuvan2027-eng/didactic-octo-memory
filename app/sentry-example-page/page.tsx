"use client"

import { useState } from "react"
import * as Sentry from "@sentry/nextjs"

export default function SentryExamplePage() {
  const [message, setMessage] = useState<string | null>(null)

  const triggerError = async () => {
    setMessage(null)
    const err = new Error("Sentry test error - you can delete this page after verifying")
    Sentry.captureException(err)
    await Sentry.flush(2000)
    setMessage("Error sent to Sentry. Check your Issues dashboard.")
  }

  const triggerUndefined = async () => {
    setMessage(null)
    try {
      // @ts-expect-error - intentional test
      myUndefinedFunction()
    } catch (err) {
      Sentry.captureException(err)
      await Sentry.flush(2000)
      setMessage("Error sent to Sentry. Check your Issues dashboard.")
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-2">Sentry Test Page</h1>
        <p className="text-gray-600 mb-6">
          Click a button to trigger an error. If it appears in Sentry Issues, setup is working.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={triggerError}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Trigger Test Error
          </button>
          <button
            onClick={triggerUndefined}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Trigger Undefined Function
          </button>
        </div>
        {message && (
          <p className="text-sm text-green-600 mt-4 font-medium">{message}</p>
        )}
        <p className="text-sm text-gray-500 mt-6">
          Delete this page (app/sentry-example-page/) after verifying.
        </p>
        <p className={`text-xs mt-4 font-mono ${process.env.NEXT_PUBLIC_SENTRY_DSN ? "text-green-600" : "text-red-600"}`}>
          DSN: {process.env.NEXT_PUBLIC_SENTRY_DSN ? "Set ✓" : "NOT SET — add to .env.local and restart dev server"}
        </p>
        <p className="text-xs text-amber-600 mt-2 max-w-sm mx-auto">
          Check Network tab for POST to ingest.sentry.io when clicking. Try incognito if ad blocker blocks it.
        </p>
      </div>
    </div>
  )
}
