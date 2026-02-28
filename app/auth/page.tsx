"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function AuthPage() {
  const router = useRouter()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [clientReady, setClientReady] = useState(false)

  // Email confirmation / resend state
  const [emailConfirmationPending, setEmailConfirmationPending] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [resendMessage, setResendMessage] = useState("")

  console.log("[v0] Render - isLogin:", isLogin, "Email:", email, "Name:", name, "Error:", error)

  // Read error from URL (e.g. from OAuth callback redirect)
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const urlError = params.get("error")
    if (urlError) {
      setError(decodeURIComponent(urlError))
      // Clear error from URL without full reload
      window.history.replaceState({}, "", "/auth")
    }
  }, [])

  useEffect(() => {
    const initClient = async () => {
      try {
        const supabase = createClient()
        let sessionStatus = "";
        try {
          const { data: { session } } = await supabase.auth.getSession();
          sessionStatus = session ? "active" : "no_session";
        } catch (e) {
          console.log("Initial session check skipped");
          sessionStatus = "error";
        }
        console.error("[v0] AuthPage - useEffect: Client ready, session status:", sessionStatus);
        setClientReady(true);
      } catch (e) {
        console.error("[v0] AuthPage - useEffect: Error during client initialization:", e);
        setClientReady(true);
      }
    }
    initClient();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] handleSubmit called")
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()
      console.log("[v0] Supabase client created:", supabase)

      if (!email || !password) {
        setError("Please fill in all fields")
        setLoading(false)
        return
      }

      if (!isLogin && !name) {
        setError("Please enter your name")
        setLoading(false)
        return
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters")
        setLoading(false)
        return
      }

      if (isLogin) {
        console.error("[v0] Attempting to sign in with email:", email, "(Login flow)");
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        console.error("[v0] Sign in response - Error:", error?.message, "Data:", data);

        if (error) {
          if (error.message?.includes("Email not confirmed") || error.message?.includes("email_not_confirmed")) {
            throw new Error("Please check your email and confirm your account before logging in.")
          }
          throw error
        }

        console.log("[v0] Sign in successful, waiting for session to be established")
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Double-check that we have a valid session
        const { data: sessionData } = await supabase.auth.getSession()
        console.log("[v0] Session after login:", sessionData.session ? "exists" : "missing")

        if (sessionData.session) {
          console.log("[v0] Session confirmed, redirecting to dashboard")
          window.location.href = "/dashboard"
        } else {
          throw new Error("Session not established. Please try again.")
        }
      } else {
        console.log("[v0] Attempting to sign up with email:", email)
        const redirectUrl =
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              email: email,
              name: name,
            },
          },
        })

        if (error) {
          console.error('[v0] Sign up error from Supabase:', error)

          // If the error indicates a provider/delivery issue, attempt a server-side admin resend
          // to surface provider diagnostics in development and give the user actionable feedback.
          const errMsg = (error?.message || String(error || '')).toString()
          if (/send|smtp|provider|delivery|confirmation/i.test(errMsg)) {
            let msg = 'Error sending confirmation email. Please verify your Supabase email provider settings (see /help/supabase-email).'
            if (process.env.NODE_ENV !== 'production') {
              try {
                const devResp = await fetch('/api/supabase-email/dev-resend', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
                })
                const devJson = await devResp.json()

                if (!devJson.success && devJson.error) {
                  msg += ` Provider test: ${devJson.error}${devJson.cause ? ' — ' + devJson.cause : ''}`
                } else if (devJson.message) {
                  msg += ` ${devJson.message}`
                }
              } catch (devErr) {
                console.error('[v0] Dev-resend request failed during signup:', devErr)
                msg += ' (Dev-resend failed)'
              }
            }

            throw new Error(msg)
          }

          throw error
        }

        if (data.user) {
          console.error("[v0] Sign up successful, attempting to upsert user profile.", data.user.id);
          const { error: profileError } = await supabase.from("users").upsert({
            id: data.user.id,
            email: email,
            name: name,
            user_type: "user",
            preferences: {
              onboarding_completed: false,
            },
          });

          if (profileError) {
            console.error("Error saving user profile:", profileError);
          }

          // Ensure credits are granted (trigger should handle this, but this is a fallback)
          if (data.session) {
            try {
              console.error("[v0] Calling /api/user/ensure-credits after signup.");
              await fetch("/api/user/ensure-credits", { method: "POST" });
              console.error("[v0] /api/user/ensure-credits call completed.");
            } catch (err) {
              console.error("Error ensuring credits:", err);
            }
          }
        }

        if (data.user && data.session) {
          console.error("[v0] User and session established after signup, redirecting to /onboarding.");
          await new Promise((resolve) => setTimeout(resolve, 500));
          window.location.href = "/onboarding";
        } else {
          console.error("[v0] User created but no session, prompting email confirmation.");
          // Mark that we are waiting for email confirmation and show resend option
          setEmailConfirmationPending(true)
          setIsLogin(true)
          setResendMessage("")

          // Try an automatic resend as a convenience fallback so users see immediate feedback
          try {
            // In development prefer the server-side admin resend to surface provider diagnostics
            if (process.env.NODE_ENV !== 'production') {
              try {
                const devResp = await fetch('/api/supabase-email/dev-resend', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
                })
                const devJson = await devResp.json()

                if (!devJson.success && devJson.error) {
                  setResendMessage(`Provider test: ${devJson.error}${devJson.cause ? ' — ' + devJson.cause : ''}`)
                } else if (devJson.message) {
                  setResendMessage(devJson.message)
                } else {
                  setResendMessage('Provider test: resend attempted. Check provider logs and inbox.')
                }

                // Do not attempt client-side resend if admin resend ran successfully in dev
                return
              } catch (devErr) {
                console.error('[v0] Dev-resend test failed:', devErr)
                setResendMessage((prev) => `${prev || ''} (Dev-resend failed: ${devErr?.message || String(devErr)})`)
                // Fall through to client-side resend as a fallback
              }
            }

            // Fallback: attempt client-side resend (production or if dev resend failed)
            const resendMod = await import('../../lib/supabase/resend')
            const result = await resendMod.resendConfirmation({ supabase, email, redirectUrl })
            console.error('[v0] Automatic resend result:', result)
            setResendMessage(result.message)

            // If resend failed according to the library, make sure the UI shows it
            if (!result.success) {
              // keep the message already set above
            }
          } catch (resendErr) {
            console.error('[v0] Automatic resend failed:', resendErr)
            setResendMessage('Unable to send confirmation email automatically. Please use "Resend confirmation" or check /help/supabase-email')

            // In development, attempt the server-side dev-resend for diagnostics
            try {
              if (process.env.NODE_ENV !== 'production') {
                const devResp = await fetch('/api/supabase-email/dev-resend', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email }),
                })
                const devJson = await devResp.json()
                if (!devJson.success && devJson.error) {
                  setResendMessage((prev) => `${prev} — Provider test: ${devJson.error}`)
                } else if (devJson.message) {
                  setResendMessage((prev) => `${prev} — ${devJson.message}`)
                }
              }
            } catch (devErr) {
              console.error('[v0] Dev-resend test failed (automatic flow):', devErr)
            }
          }
        }
      }
    } catch (err: any) {
      console.error("[v0] Auth error occurred:", err)
      if (err.message?.includes("NetworkError") || err.message?.includes("fetch")) {
        setError("Unable to connect to authentication service. Please check your internet connection and try again.")
      } else if (err.message?.includes("Invalid login")) {
        setError("Invalid email or password. Please try again.")
      } else if (err.message?.includes("Email not confirmed")) {
        setError("Please check your email and confirm your account before logging in.")
      } else {
        setError(err.message || "An error occurred. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setGoogleLoading(true)

    try {
      const supabase = createClient()

      const redirectUrl =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
        },
      })

      if (error) throw error
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google. Please try again.")
      setGoogleLoading(false)
    }
  }

  // Resend confirmation email handler
  const handleResendConfirmation = async () => {
    try {
      setResendLoading(true)
      setResendMessage("")

      // Validate email before attempting resend to avoid confusing provider errors
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setResendMessage("Please enter a valid email address to resend confirmation.")
        setResendLoading(false)
        return
      }

      const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`

      console.log("[v0] Attempting to resend confirmation email to:", email)

      // In development prefer the server-side admin resend to surface provider diagnostics
      let msg = ''
      if (process.env.NODE_ENV !== 'production') {
        try {
          const devResp = await fetch('/api/supabase-email/dev-resend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          })
          const devJson = await devResp.json()

          if (!devJson.success && devJson.error) {
            msg = `Provider test: ${devJson.error}`
            // include dev details if available
            if (devJson.cause) msg += ` — ${devJson.cause}`
          } else if (devJson.message) {
            msg = devJson.message
          }

          setResendMessage(msg || 'Provider test: resend attempted. Check provider logs and inbox.')
          setResendLoading(false)
          return
        } catch (err) {
          console.error('[v0] Dev-resend test failed (manual resend):', err)
          // Fall back to client-side resend below
        }
      }

      // Use helper for testability (client-side resend used in production or if dev-resend failed)
      const supabase = createClient()
      const result = await import('../../lib/supabase/resend').then((m) => m.resendConfirmation({ supabase, email, redirectUrl }))

      // Build the base message from the library result (success or failure)
      msg = result.message || ''

      // If the original resend failed, make that clear in the message and include dev hints
      if (!result.success) {
        console.error('[v0] resend error:', result)
        if (process.env.NODE_ENV !== 'production') {
          msg += ' (dev: see console for details)'
        }
        setResendMessage(msg)
      } else {
        setResendMessage(msg || result.message)
      }
    } catch (err: any) {
      console.error("[v0] Unexpected resend error:", err)
      setResendMessage("Failed to resend confirmation email. Please try again later.")
    } finally {
      setResendLoading(false)
    }
  }

  if (!clientReady) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-blue-50 pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">MockZen</h1>
            <p className="text-gray-600 text-sm">Master Every Interview with AI</p>
          </div>
          <div className="flex gap-2 mb-8 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => {
                    setIsLogin(true)
                    setError("")
                  }}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                    isLogin ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setIsLogin(false)
                    setError("")
                    setEmail("") // Clear email when switching to signup
                    setPassword("") // Clear password when switching to signup
                    setName("") // Clear name when switching to signup
                  }}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                    !isLogin ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Signup
                </button>
              </div>
              {error && (
                <div
                  className={`mb-4 p-3 border rounded-lg text-sm ${
                    error.includes("check your email") || error.includes("Account created")
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-red-50 border-red-200 text-red-700"
                  }`}
                >
                  {error}
                </div>
              )}

              {emailConfirmationPending && (
                <div className="mb-4 p-3 border rounded-lg text-sm bg-green-50 border-green-200 text-green-700">
                  <div className="mb-2">Account created! Please check your email to confirm your account, then login.</div>
                  <div className="flex gap-2">
                    <button
                      className="py-1 px-3 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-50"
                      onClick={handleResendConfirmation}
                      disabled={resendLoading}
                    >
                      {resendLoading ? "Resending..." : "Resend confirmation email"}
                    </button>
                    <button
                      className="py-1 px-3 bg-white border border-gray-200 rounded-md text-sm hover:bg-gray-50"
                      onClick={() => {
                        setEmailConfirmationPending(false)
                        setResendMessage("")
                      }}
                    >
                      Dismiss
                    </button>
                  </div>
                  {resendMessage && <div className="mt-2 text-sm text-gray-700">{resendMessage}</div>}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); console.log("[v0] Email changed:", e.target.value) }}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Loading..." : isLogin ? "Login" : "Create Account"}
                </button>
              </form>
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full py-2 px-4 mb-3 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
              >
                {googleLoading ? (
                  "Loading..."
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 8.55 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 2.78-3.5 5.11-3.5z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
              {isLogin && (
                <div className="text-center mt-6">
                  <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Forgot Password?
                  </Link>
                </div>
              )}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full mt-4 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
