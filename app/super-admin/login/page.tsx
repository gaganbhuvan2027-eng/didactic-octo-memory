"use client"

import { FormEvent, useState } from "react"

type LoginStep = "credentials" | "otp"

export default function SuperAdminLoginPage() {
  const [step, setStep] = useState<LoginStep>("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [maskedEmail, setMaskedEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleCredentialsSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      console.log("[super-admin-login] Sending credentials...")
      const res = await fetch("/api/super-admin/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await res.json()
      console.log("[super-admin-login] Response:", res.status, data)

      if (res.ok && data.success) {
        setMaskedEmail(data.maskedEmail || "your secure email")
        setSuccess(data.message || "OTP sent successfully!")
        setStep("otp")
      } else {
        setError(data.error || "Failed to send OTP")
      }
    } catch (err: any) {
      console.error("[super-admin-login] Error:", err)
      setError(err?.message || "Failed to send OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleOTPSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const res = await fetch("/api/super-admin/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, otp }),
        credentials: "include",
      })

      const data = await res.json()

      if (res.ok) {
        // Success - redirect to dashboard
        window.location.href = "/super-admin"
      } else {
        setError(data.error || "Invalid OTP")
      }
    } catch (err) {
      setError("Verification failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleResendOTP() {
    setError("")
    setSuccess("")
    setLoading(true)

    try {
      const res = await fetch("/api/super-admin/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess("New OTP sent successfully!")
        setOtp("")
      } else {
        setError(data.error || "Failed to resend OTP")
      }
    } catch (err) {
      setError("Failed to resend OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function handleBackToCredentials() {
    setStep("credentials")
    setOtp("")
    setError("")
    setSuccess("")
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          width: "100%",
          maxWidth: "420px",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              width: "60px",
              height: "60px",
              background: "linear-gradient(135deg, #0070f3 0%, #00c6ff 100%)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 15px",
            }}
          >
            <span style={{ fontSize: "28px" }}>🔐</span>
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#1a1a1a",
              marginBottom: "8px",
            }}
          >
            Super Admin Login
          </h1>
          <p style={{ color: "#666", fontSize: "14px" }}>
            {step === "credentials"
              ? "Enter your credentials to receive OTP"
              : `Enter the OTP sent to ${maskedEmail}`}
          </p>
        </div>

        {step === "credentials" ? (
          <form onSubmit={handleCredentialsSubmit} autoComplete="off">
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#333",
                }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter your admin email"
                autoComplete="off"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  transition: "border-color 0.2s",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
                onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#333",
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="Enter your password"
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  transition: "border-color 0.2s",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
                onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "12px",
                  marginBottom: "20px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  borderRadius: "8px",
                  fontSize: "14px",
                  border: "1px solid #fecaca",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "14px",
                background: loading
                  ? "#ccc"
                  : "linear-gradient(135deg, #0070f3 0%, #00c6ff 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,112,243,0.4)"
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleOTPSubmit} autoComplete="off">
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#333",
                }}
              >
                One-Time Password
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                disabled={loading}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                autoComplete="one-time-code"
                style={{
                  width: "100%",
                  padding: "16px 14px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "24px",
                  fontWeight: "bold",
                  letterSpacing: "8px",
                  textAlign: "center",
                  transition: "border-color 0.2s",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#0070f3")}
                onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
              />
              <p style={{ fontSize: "12px", color: "#666", marginTop: "8px", textAlign: "center" }}>
                OTP expires in 10 minutes
              </p>
            </div>

            {error && (
              <div
                style={{
                  padding: "12px",
                  marginBottom: "20px",
                  background: "#fef2f2",
                  color: "#dc2626",
                  borderRadius: "8px",
                  fontSize: "14px",
                  border: "1px solid #fecaca",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  padding: "12px",
                  marginBottom: "20px",
                  background: "#f0fdf4",
                  color: "#16a34a",
                  borderRadius: "8px",
                  fontSize: "14px",
                  border: "1px solid #bbf7d0",
                }}
              >
                ✅ {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              style={{
                width: "100%",
                padding: "14px",
                background:
                  loading || otp.length !== 6
                    ? "#ccc"
                    : "linear-gradient(135deg, #0070f3 0%, #00c6ff 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: loading || otp.length !== 6 ? "not-allowed" : "pointer",
                marginBottom: "12px",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseOver={(e) => {
                if (!loading && otp.length === 6) {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,112,243,0.4)"
                }
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="button"
                onClick={handleBackToCredentials}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "transparent",
                  color: "#666",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "transparent",
                  color: "#0070f3",
                  border: "2px solid #0070f3",
                  borderRadius: "8px",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <div
          style={{
            marginTop: "24px",
            padding: "16px",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
          }}
        >
          <p style={{ fontSize: "12px", color: "#64748b", textAlign: "center", margin: 0 }}>
            🔒 Secure two-factor authentication is required for super admin access. OTP will be
            sent to the registered secure email.
          </p>
        </div>
      </div>
    </div>
  )
}
