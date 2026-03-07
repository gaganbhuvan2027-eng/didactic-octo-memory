import { NextResponse } from "next/server"
import crypto from "crypto"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { PLANS, type PlanId } from "@/lib/payment-plans"

const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET

function verifySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!RAZORPAY_KEY_SECRET) return false
  const body = `${orderId}|${paymentId}`
  const expected = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex")
  return expected === signature
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = user.id

    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body as {
      razorpay_order_id: string
      razorpay_payment_id: string
      razorpay_signature: string
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing payment details" }, { status: 400 })
    }

    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 })
    }

    const adminSupabase = await createAdminClient()

    const { data: existingTxns } = await adminSupabase
      .from("credit_transactions")
      .select("id, metadata")
      .eq("user_id", userId)
      .eq("reason", "purchase")

    const alreadyProcessed = (existingTxns || []).some(
      (t: { metadata?: { razorpay_payment_id?: string } }) =>
        t?.metadata?.razorpay_payment_id === razorpay_payment_id
    )
    if (alreadyProcessed) {
      return NextResponse.json({ success: true, message: "Payment already processed" })
    }

    const planId = body.planId as PlanId | undefined
    const plan = planId ? PLANS[planId] : PLANS.credits_pack
    const creditsToAdd = plan.credits

    const { data: currentCredits } = await adminSupabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    const currentBalance = currentCredits?.balance ?? 0
    const newBalance = currentBalance + creditsToAdd

    if (!currentCredits) {
      await adminSupabase.from("user_credits").insert({
        user_id: userId,
        balance: creditsToAdd,
        updated_at: new Date().toISOString(),
      })
    } else {
      await adminSupabase
        .from("user_credits")
        .update({ balance: newBalance, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
    }

    await adminSupabase.from("credit_transactions").insert({
      user_id: userId,
      delta: creditsToAdd,
      reason: "purchase",
      metadata: {
        razorpay_order_id,
        razorpay_payment_id,
        plan_id: planId || "credits_pack",
      },
    })

    return NextResponse.json({ success: true, creditsAdded: creditsToAdd })
  } catch (err) {
    console.error("[payment/verify]", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payment verification failed" },
      { status: 500 }
    )
  }
}
