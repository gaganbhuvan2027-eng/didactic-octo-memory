import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("institution_id, user_type")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.user_type !== "institution_admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const institutionId = profile.institution_id

    const { data: instCredits, error: instError } = await supabase
      .from("institution_credits")
      .select("balance")
      .eq("institution_id", institutionId)
      .maybeSingle()

    if (instError) return NextResponse.json({ error: instError.message }, { status: 500 })

    const { data: transactions, error: txError } = await supabase
      .from("institution_credit_transactions")
      .select("id, delta, reason, metadata, created_at")
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: false })
      .limit(100)

    if (txError) return NextResponse.json({ error: txError.message }, { status: 500 })

    return NextResponse.json({ balance: instCredits?.balance || 0, transactions })
  } catch (error: any) {
    console.error("Error fetching institution credits:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}
