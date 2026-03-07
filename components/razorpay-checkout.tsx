"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PlanId } from "@/lib/payment-plans"

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance
  }
}

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  order_id: string
  name: string
  description?: string
  handler: (response: RazorpayResponse) => void
  prefill?: { email?: string; name?: string }
  theme?: { color: string }
  modal?: { ondismiss?: () => void }
}

interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

interface RazorpayInstance {
  open: () => void
  on: (event: string, handler: () => void) => void
}

interface RazorpayCheckoutProps {
  planId: PlanId
  planName: string
  amount: number
  currency: "INR" | "USD"
  isIndia: boolean
  children: React.ReactNode
  className?: string
  disabled?: boolean
}

export function RazorpayCheckout({
  planId,
  planName,
  amount,
  currency,
  isIndia,
  children,
  className = "",
  disabled = false,
}: RazorpayCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scriptLoaded = useRef(false)

  const loadRazorpayScript = useCallback(() => {
    if (typeof window === "undefined" || scriptLoaded.current) return
    if (window.Razorpay) {
      scriptLoaded.current = true
      return
    }
    const script = document.createElement("script")
    script.src = "https://checkout.razorpay.com/v1/checkout.js"
    script.async = true
    document.body.appendChild(script)
    script.onload = () => {
      scriptLoaded.current = true
    }
  }, [])

  useEffect(() => {
    loadRazorpayScript()
  }, [loadRazorpayScript])

  const handleClick = useCallback(async () => {
    if (!isIndia) {
      setError("Razorpay is available for India. For other countries, please contact us.")
      return
    }
    if (disabled || loading) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId, currency }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create order")

      const { orderId, keyId } = data
      if (!window.Razorpay || !keyId) {
        throw new Error("Payment gateway not ready")
      }

      const options: RazorpayOptions = {
        key: keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: orderId,
        name: "MockZen",
        description: `${planName} - Interview Credits`,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId,
              }),
            })
            const verifyData = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(verifyData.error || "Verification failed")
            window.location.href = "/dashboard?payment=success"
          } catch (err) {
            setError(err instanceof Error ? err.message : "Payment verification failed")
          } finally {
            setLoading(false)
          }
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: () => setLoading(false),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on("payment.failed", () => {
        setError("Payment failed. Please try again.")
        setLoading(false)
      })
      rzp.on("payment.cancel", () => {
        setLoading(false)
      })
      rzp.open()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start payment"
      setError(msg)
      if (msg.includes("Unauthorized") || msg.includes("401")) {
        setTimeout(() => {
          window.location.href = "/auth?mode=signup&redirect=" + encodeURIComponent(window.location.pathname || "/pricing")
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }, [planId, planName, currency, isIndia, disabled, loading])

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={className}
      >
        {loading ? "Processing..." : children}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
