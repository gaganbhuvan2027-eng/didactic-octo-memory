import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { types = [], comment = "", interviewId } = body

    if (!Array.isArray(types) || (types.length === 0 && !String(comment).trim())) {
      return NextResponse.json(
        { error: "Select at least one issue or provide a comment" },
        { status: 400 }
      )
    }

    const adminSupabase = await createAdminClient()
    const { error } = await adminSupabase.from("interview_reports").insert({
      interview_id: interviewId || null,
      user_id: user.id,
      report_types: types,
      comment: String(comment).trim() || null,
    })

    if (error) {
      console.error("[interview/report] Insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error("[interview/report] Error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    )
  }
}
