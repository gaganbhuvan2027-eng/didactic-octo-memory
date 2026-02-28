import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    console.error("POST /api/user/ensure-credits - User retrieved:", user);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminSupabase = await createAdminClient()

    console.error("POST /api/user/ensure-credits - Admin Supabase Client created.");

    // Check if user already has credits
    const { data: existingCredits } = await adminSupabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()

    console.error("POST /api/user/ensure-credits - Existing credits check result:", existingCredits);

    // If user doesn't have credits record, give them 10 free credits
    if (!existingCredits) {
      console.error("POST /api/user/ensure-credits - No existing credits, attempting to insert 10 credits.");
      // Insert credit balance
      const { error: insertError } = await adminSupabase.from("user_credits").insert({
        user_id: user.id,
        balance: 10,
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error inserting credits:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      // Log the transaction
      const { error: txnError } = await adminSupabase.from("credit_transactions").insert({
        user_id: user.id,
        delta: 10,
        reason: "welcome_bonus",
        metadata: { source: "new_user_signup" },
      })

      if (txnError) {
        console.error("Error logging credit transaction:", txnError)
        // Don't fail if transaction logging fails
      }

      return NextResponse.json({ success: true, creditsAdded: 10 })
    }

    return NextResponse.json({ success: true, creditsAdded: 0 })
  } catch (error: any) {
    console.error("Error ensuring credits:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

