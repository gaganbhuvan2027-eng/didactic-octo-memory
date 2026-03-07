import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { razorpay, RAZORPAY_KEY_ID, isRazorpayConfigured } from "@/lib/razorpay"
import { PLANS, type PlanId } from "@/lib/payment-plans"

export async function POST(request: Request) {
  try {
    if (!isRazorpayConfigured() || !razorpay) {
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 503 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { planId, currency = "INR" } = body as { planId: PlanId; currency?: "INR" | "USD" }

    const plan = PLANS[planId]
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const amount = currency === "INR" ? plan.amountINR : plan.amountUSD
    const orderCurrency = currency === "INR" ? "INR" : "USD"

    const order = await razorpay.orders.create({
      amount,
      currency: orderCurrency,
      receipt: `mockzen_${planId}_${user.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        user_id: user.id,
        plan_id: planId,
        credits: String(plan.credits),
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error("[payment/create-order]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create order" },
      { status: 500 }
    )
  }
}
