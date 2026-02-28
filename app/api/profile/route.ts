import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile with all fields
    const { data: profile, error } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (error) {
      console.error("Error fetching profile:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get interview stats
    const { data: interviews } = await supabase.from("interviews").select("id, status").eq("user_id", user.id)

    const { data: results } = await supabase
      .from("interview_results")
      .select("overall_score")
      .in("interview_id", interviews?.map((i) => i.id) || [])

    const totalInterviews = interviews?.length || 0
    const averageScore =
      results && results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + (r.overall_score || 0), 0) / results.length)
        : 0

    return NextResponse.json({
      ...profile,
      stats: {
        totalInterviews,
        averageScore,
      },
    })
  } catch (error) {
    console.error("Error in profile fetch:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
