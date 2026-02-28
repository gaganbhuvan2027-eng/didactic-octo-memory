import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

const WELCOME_CREDITS = 10

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's credit balance
    const { data: creditRow, error } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()

    if (error) {
      console.error("Error fetching credits:", error)
      return NextResponse.json({ error: "Failed to fetch credits" }, { status: 500 })
    }

    // Fallback: if no credits row exists (e.g. setup-profile didn't run), create one with welcome credits
    if (!creditRow) {
      const adminSupabase = await createAdminClient()
      const { error: insertError } = await adminSupabase.from("user_credits").insert({
        user_id: user.id,
        balance: WELCOME_CREDITS,
        updated_at: new Date().toISOString(),
      })
      if (!insertError) {
        await adminSupabase.from("credit_transactions").insert({
          user_id: user.id,
          delta: WELCOME_CREDITS,
          reason: "welcome_bonus",
          metadata: { source: "credits_api_fallback" },
        })
        return NextResponse.json({ balance: WELCOME_CREDITS })
      }
      // Insert failed (e.g. race - another request created row). Re-fetch balance.
      const { data: retryRow } = await adminSupabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle()
      if (retryRow) return NextResponse.json({ balance: retryRow.balance ?? 0 })
    }

    const balance = creditRow?.balance ?? 0

    return NextResponse.json({ balance })
  } catch (error: any) {
    console.error("Error in credits route:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

