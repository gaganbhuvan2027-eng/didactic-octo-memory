"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

export async function ensureUserCredits(userId: string) {
  try {
    const supabase = await createAdminClient()

    // Check if user already has credits
    const { data: existingCredits } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle()

    // If user doesn't have credits record, give them 10 free credits
    if (!existingCredits) {
      // Insert credit balance
      const { error: insertError } = await supabase.from("user_credits").insert({
        user_id: userId,
        balance: 10,
        updated_at: new Date().toISOString(),
      })

      if (insertError) {
        console.error("Error inserting credits:", insertError)
        return { success: false, error: insertError.message }
      }

      // Log the transaction
      const { error: txnError } = await supabase.from("credit_transactions").insert({
        user_id: userId,
        delta: 10,
        reason: "welcome_bonus",
        metadata: { source: "new_user_signup" },
      })

      if (txnError) {
        console.error("Error logging credit transaction:", txnError)
        // Don't fail if transaction logging fails
      }

      return { success: true, creditsAdded: 10 }
    }

    return { success: true, creditsAdded: 0 }
  } catch (error: any) {
    console.error("Error ensuring credits:", error)
    return { success: false, error: error.message }
  }
}

