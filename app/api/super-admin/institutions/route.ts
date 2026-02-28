import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { checkSuperAdminAccess } from "@/lib/super-admin"

export async function GET() {
  try {
    const { authorized } = await checkSuperAdminAccess()
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createAdminClient()

    // Get all institutions
    const { data: institutions, error } = await supabase
      .from("institutions")
      .select("id, name, email_domain, created_at")
      .order("created_at", { ascending: false })

    if (error) throw error

    // Get member counts and usage for each institution
    const institutionsWithStats = await Promise.all(
      (institutions || []).map(async (inst) => {
        const { count: memberCount } = await supabase
          .from("institution_members")
          .select("*", { count: "exact", head: true })
          .eq("institution_id", inst.id)

        const { data: usage } = await supabase
          .from("institution_usage")
          .select("credits_used, groq_calls")
          .eq("institution_id", inst.id)

        const creditsUsed = usage?.reduce((sum, u) => sum + u.credits_used, 0) || 0
        const groqCalls = usage?.reduce((sum, u) => sum + u.groq_calls, 0) || 0

        // Fetch current balance for the institution (if any)
        const { data: instCredit } = await supabase
          .from("institution_credits")
          .select("balance")
          .eq("institution_id", inst.id)
          .maybeSingle()

        return {
          ...inst,
          member_count: memberCount || 0,
          credits_used: creditsUsed,
          groq_calls: groqCalls,
          balance: instCredit?.balance || 0,
        }
      }),
    )

    return NextResponse.json({ institutions: institutionsWithStats })
  } catch (error: any) {
    console.error("Error fetching institutions:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch institutions" }, { status: 500 })
  }
}

