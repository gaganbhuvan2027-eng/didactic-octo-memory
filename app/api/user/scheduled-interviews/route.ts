import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: scheduledInterviews, error } = await supabase
      .from("scheduled_interviews")
      .select(
        `
        *,
        institution:institution_id(name),
        scheduled_by:scheduled_by_id(name),
        batch:batch_id(name)
      `,
      )
      .eq("member_id", user.id)
      .eq("status", "pending")
      .gte("scheduled_date", new Date().toISOString())
      .order("scheduled_date", { ascending: true })

    if (error) throw error

    return NextResponse.json({ interviews: scheduledInterviews || [] })
  } catch (error: any) {
    console.error("Error fetching user scheduled interviews:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch interviews" }, { status: 500 })
  }
}
