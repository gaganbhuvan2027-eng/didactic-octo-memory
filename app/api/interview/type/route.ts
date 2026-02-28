import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get("interviewId")

    if (!interviewId) {
      return NextResponse.json({ error: "Interview ID is required" }, { status: 400 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from("interviews")
      .select("interview_type")
      .eq("id", interviewId)
      .single()

    if (error) {
      console.error("Error fetching interview type:", error)
      return NextResponse.json({ error: "Failed to fetch interview type" }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })
    }

    return NextResponse.json({ interviewType: data.interview_type })
  } catch (error: any) {
    console.error("Error in GET /api/interview/type:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

