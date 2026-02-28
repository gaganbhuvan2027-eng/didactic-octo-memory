"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      const errorParam = searchParams.get("error")
      const errorDescription = searchParams.get("error_description")

      if (errorParam) {
        const msg = errorDescription || errorParam
        router.replace(`/auth?error=${encodeURIComponent(msg)}`)
        return
      }

      try {
        const supabase = createClient()
        // Implicit flow: detectSessionInUrl extracts tokens from URL fragment (#access_token=...) automatically.
        // No code_verifier needed - avoids "both auth code and code verifier should be non-empty" error.
        let { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          await new Promise((r) => setTimeout(r, 600))
          ;({ data: { session } } = await supabase.auth.getSession())
        }
        if (!session) {
          router.replace("/auth")
          return
        }

        // Setup profile/credits
        const setupRes = await fetch("/api/auth/setup-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          credentials: "include",
        })

        if (!setupRes.ok) {
          console.warn("[auth/callback] Profile setup failed, user still logged in")
        }

        window.location.href = "/dashboard"
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Sign in failed"
        setError(msg)
        router.replace(`/auth?error=${encodeURIComponent(msg)}`)
      }
    }

    run()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Signing you in...</p>
        <p className="text-gray-500 text-sm mt-1">This may take a moment on some devices</p>
        {error && (
          <p className="text-red-500 text-sm mt-2">Redirecting due to error...</p>
        )}
      </div>
    </div>
  )
}

function CallbackFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600 font-medium">Signing you in...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<CallbackFallback />}>
      <CallbackContent />
    </Suspense>
  )
}
