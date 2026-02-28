import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { checkSuperAdminAccess } from "@/lib/super-admin"

export async function GET() {
  try {
    const { authorized, user } = await checkSuperAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createAdminClient()

    // Get total credits issued (sum of all positive transactions)
    const { data: positiveTransactions, error: txnError } = await supabase
      .from("credit_transactions")
      .select("delta")
      .gt("delta", 0)

    if (txnError) {
      console.error("Error fetching transactions:", txnError)
    }

    const totalCreditsIssued =
      positiveTransactions?.reduce((sum, t) => sum + t.delta, 0) || 0

    // Get total credits remaining (sum of all balances)
    const { data: creditBalances, error: creditsError } = await supabase
      .from("user_credits")
      .select("balance")

    if (creditsError) {
      console.error("Error fetching credit balances:", creditsError)
    }

    const totalCreditsRemaining = creditBalances?.reduce((sum, c) => sum + c.balance, 0) || 0

    // Get total Groq calls
    const { data: usageData, error: usageError } = await supabase
      .from("institution_usage")
      .select("groq_calls")

    if (usageError) {
      console.error("Error fetching usage data:", usageError)
    }

    const totalGroqCalls = usageData?.reduce((sum, u) => sum + u.groq_calls, 0) || 0

    // Get per-institution usage
    const { data: institutions, error: instError } = await supabase
      .from("institutions")
      .select("id, name")

    if (instError) {
      console.error("Error fetching institutions:", instError)
    }

    const institutionUsage =
      institutions && institutions.length > 0
        ? await Promise.all(
            institutions.map(async (inst) => {
              const { data: usage } = await supabase
                .from("institution_usage")
                .select("credits_used, groq_calls")
                .eq("institution_id", inst.id)

              const creditsUsed = usage?.reduce((sum, u) => sum + u.credits_used, 0) || 0
              const groqCalls = usage?.reduce((sum, u) => sum + u.groq_calls, 0) || 0

              return {
                institution_id: inst.id,
                institution_name: inst.name,
                credits_used: creditsUsed,
                groq_calls: groqCalls,
              }
            }),
          )
        : []

    return NextResponse.json({
      total_credits_issued: totalCreditsIssued,
      total_credits_remaining: totalCreditsRemaining,
      total_groq_calls: totalGroqCalls,
      institution_usage: institutionUsage,
    })
  } catch (error: any) {
    console.error("Error fetching overview:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch overview" }, { status: 500 })
  }
}

