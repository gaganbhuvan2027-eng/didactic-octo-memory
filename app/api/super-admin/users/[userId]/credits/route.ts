import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { verifySuperAdminRequest } from "@/lib/super-admin-middleware"

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  // Verify super admin authentication and rate limit
  const auth = await verifySuperAdminRequest(request)
  if (!auth.authorized) {
    return auth.error
  }

  const { userId } = await params

  try {
    const supabaseAdmin = await createAdminClient()

    const { data: userCredits, error: creditError } = await supabaseAdmin
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    if (creditError || !userCredits) {
      return NextResponse.json({ balance: 0, transactions: [] }, { status: 200 })
    }

    const { data: transactions, error: transactionError } = await supabaseAdmin
      .from("credit_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (transactionError) {
      return NextResponse.json({ error: transactionError.message }, { status: 500 })
    }

    return NextResponse.json({ balance: userCredits.balance, transactions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { userId: string } }) {
  // Verify super admin authentication and rate limit
  const auth = await verifySuperAdminRequest(request)
  if (!auth.authorized) {
    return auth.error
  }

  const { userId } = await params
  console.log('[super-admin/users/credits] POST for userId:', userId)

  try {
    const body = await request.json()
    const { amount, reason } = body
    console.log('[super-admin/users/credits] Request body:', { amount, reason })

    if (!amount || typeof amount !== "number" || amount === 0) {
      return NextResponse.json({ error: "Invalid amount provided" }, { status: 400 })
    }

    const supabaseAdmin = await createAdminClient()

    const { data: currentCredits, error: fetchError } = await supabaseAdmin
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    console.log('[super-admin/users/credits] Current credits:', currentCredits, 'Error:', fetchError)

    if (fetchError) {
      console.error('[super-admin/users/credits] Fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const newBalance = (currentCredits?.balance || 0) + amount
    console.log('[super-admin/users/credits] Computed new balance:', newBalance)

    const { data: upsertData, error: updateError } = await supabaseAdmin
      .from("user_credits")
      .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      .select()

    console.log('[super-admin/users/credits] Upsert result:', upsertData, 'Error:', updateError)

    if (updateError) {
      console.error('[super-admin/users/credits] Update error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Log transaction
    const { error: txError } = await supabaseAdmin.from("credit_transactions").insert({
      user_id: userId,
      delta: amount,
      reason: reason || "admin_adjustment",
      metadata: { admin_id: "super_admin" },
    })

    if (txError) {
      console.error('[super-admin/users/credits] Transaction log error:', txError)
    }

    return NextResponse.json({ message: "Credits updated successfully", newBalance })
  } catch (error: any) {
    console.error('[super-admin/users/credits] Unexpected error:', error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
