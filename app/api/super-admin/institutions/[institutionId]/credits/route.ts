import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { institutionId: string } }) {
  const { institutionId } = await params
  try {
    const supabaseAdmin = await createAdminClient()
    const { data: instCredits, error: instError } = await supabaseAdmin
      .from("institution_credits")
      .select("balance")
      .eq("institution_id", institutionId)
      .maybeSingle()

    if (instError) return NextResponse.json({ error: instError.message }, { status: 500 })

    const { data: transactions, error: txError } = await supabaseAdmin
      .from("institution_credit_transactions")
      .select("*")
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: false })

    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

    return NextResponse.json({ balance: instCredits?.balance || 0, transactions })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { institutionId: string } }) {
  const { institutionId } = await params
  console.log('[super-admin] institutionId:', institutionId)
  try {
    const body = await request.json()
    console.log('[super-admin] incoming POST body:', body)
    const reason = body.reason || "super_admin_topup"
    let amount: number | null = null

    const supabaseAdmin = await createAdminClient()

    // Fetch current balance first
    const { data: current, error: fetchError } = await supabaseAdmin
      .from("institution_credits")
      .select("balance")
      .eq("institution_id", institutionId)
      .maybeSingle()

    if (fetchError) {
      console.error('[super-admin] failed to fetch existing balance', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    const currentBalance = Number(current?.balance || 0)

    // Accept either a delta (amount) or an absolute set_to value
    if (typeof body.set_to === 'number') {
      // set absolute balance
      const desired = Number(body.set_to)
      amount = desired - currentBalance
      console.log(`[super-admin] set_to requested: desired=${desired}, current=${currentBalance}, computed delta=${amount}`)
    } else if (typeof body.amount === 'number') {
      amount = Number(body.amount)
      console.log(`[super-admin] delta amount requested: ${amount}`)
    } else {
      return NextResponse.json({ error: 'Invalid payload: provide amount (delta) or set_to (absolute)' }, { status: 400 })
    }

    if (!amount || Number.isNaN(amount)) {
      return NextResponse.json({ error: 'Invalid amount computed' }, { status: 400 })
    }

    const newBalance = currentBalance + amount

    const { data: upsertData, error: upsertError } = await supabaseAdmin
      .from("institution_credits")
      .upsert({ institution_id: institutionId, balance: newBalance }, { onConflict: "institution_id", returning: "representation" })

    if (upsertError) {
      console.error('[super-admin] failed to upsert institution_credits', upsertError)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    console.log('[super-admin] upsert result:', upsertData)

    const { data: txData, error: txError } = await supabaseAdmin.from("institution_credit_transactions").insert({
      institution_id: institutionId,
      delta: amount,
      reason,
      metadata: { added_by: "super_admin", set_to: body.set_to ?? null },
    })

    if (txError) {
      console.error("Failed to record institution credit transaction:", txError)
    } else {
      console.log('[super-admin] institution_credit_transactions inserted:', txData)
    }

    return NextResponse.json({ message: "Institution credits updated", newBalance })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
