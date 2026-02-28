import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get admin's institution
    const { data: adminProfile } = await supabase
      .from("users")
      .select("institution_id, user_type")
      .eq("id", user.id)
      .single()

    if (!adminProfile || adminProfile.user_type !== "institution_admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Get all members
    const { data: members } = await supabase
      .from("institution_members")
      .select("user_id")
      .eq("institution_id", adminProfile.institution_id)

    const memberIds = members?.map((m) => m.user_id) || []

    // Get scheduled interviews count
    const { count: scheduledCount } = await supabase
      .from("scheduled_interviews")
      .select("*", { count: "exact", head: true })
      .eq("institution_id", adminProfile.institution_id)
      .eq("status", "pending")

    // Get completed interviews for all members
    const { data: interviews } = await supabase
      .from("interviews")
      .select("id")
      .in("user_id", memberIds)
      .eq("status", "completed")

    const interviewIds = interviews?.map((i) => i.id) || []

    // Get average score
    const { data: results } = await supabase
      .from("interview_results")
      .select("overall_score")
      .in("interview_id", interviewIds)

    const avgScore =
      results && results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.overall_score, 0) / results.length)
        : 0

    return NextResponse.json({
      totalMembers: members?.length || 0,
      scheduledInterviews: scheduledCount || 0,
      averageScore: avgScore,
      totalInterviews: interviews?.length || 0,
    })
  } catch (error: any) {
    console.error("Error fetching stats:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch stats" }, { status: 500 })
  }
}
