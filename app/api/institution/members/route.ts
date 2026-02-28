import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
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

    // Get all members of the institution
    const { data: institutionMembers, error: membersError } = await supabase
      .from("institution_members")
      .select(
        `
        user_id,
        role,
        joined_at,
        users!inner (
          id,
          email,
          name,
          created_at
        )
      `,
      )
      .eq("institution_id", adminProfile.institution_id)

    if (membersError) {
      console.error("Error fetching members:", membersError)
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 })
    }

    // Get interview stats for each member
    const membersWithStats = await Promise.all(
      (institutionMembers || []).map(async (member: any) => {
        // Get completed interviews count
        const { data: interviews } = await supabase
          .from("interviews")
          .select("id")
          .eq("user_id", member.user_id)
          .eq("status", "completed")

        const interviewIds = interviews?.map((i) => i.id) || []

        // Get average score
        let avgScore = 0
        if (interviewIds.length > 0) {
          const { data: results } = await supabase
            .from("interview_results")
            .select("overall_score")
            .in("interview_id", interviewIds)

          if (results && results.length > 0) {
            avgScore = Math.round(results.reduce((sum, r) => sum + r.overall_score, 0) / results.length)
          }
        }

        return {
          id: member.user_id,
          memberRowId: member.id, // institution_members row id
          name: member.users.name || "No name",
          email: member.users.email,
          role: member.role || "member",
          total_interviews: interviews?.length || 0,
          avg_score: avgScore,
          last_active: member.users.created_at,
        }
      }),
    )

    return NextResponse.json({ members: membersWithStats })
  } catch (error: any) {
    console.error("Error in members API:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch members" }, { status: 500 })
  }
}
