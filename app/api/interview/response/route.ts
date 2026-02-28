import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { interviewId, question, answer, questionNumber, skipped = false } = await request.json()

    console.log("[v0] === SAVING RESPONSE ===")
    console.log("[v0] Interview ID:", interviewId)
    console.log("[v0] Question Number:", questionNumber)
    console.log("[v0] Question:", question?.substring(0, 50) + "...")
    console.log("[v0] Answer:", answer?.substring(0, 50) + "...")
    console.log("[v0] Skipped:", skipped)

    if (!interviewId || !question || !answer) {
      console.error("[v0] Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Authentication error:", authError)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("[v0] Authenticated user:", user.id)

    // Verify the interview exists and belongs to this user
    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .select("id, user_id")
      .eq("id", interviewId)
      .single()

    if (interviewError || !interview) {
      console.error("[v0] Interview not found:", interviewError)
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })
    }

    if (interview.user_id !== user.id) {
      console.error("[v0] User does not own this interview")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Check for existing response (prevent duplicates)
    const { data: existing } = await supabase
      .from("interview_responses")
      .select("id")
      .eq("interview_id", interviewId)
      .eq("question_number", questionNumber)
      .maybeSingle()

    let data: { id: string }[] | null = null
    let error = null

    if (existing) {
      console.log("[v0] Updating existing response for Q" + questionNumber)
      const result = await supabase
        .from("interview_responses")
        .update({ question, answer, skipped })
        .eq("id", existing.id)
        .select()
      data = result.data
      error = result.error
    } else {
      console.log("[v0] Interview verified, inserting response...")
      const result = await supabase
        .from("interview_responses")
        .insert({
          interview_id: interviewId,
          question,
          answer,
          question_number: questionNumber,
          skipped,
        })
        .select()
      data = result.data
      error = result.error
    }

    if (error) {
      console.error("[v0] Database error saving response:", error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    if (!data || data.length === 0) {
      console.error("[v0] Response saved but no data returned")
      return NextResponse.json({ error: "Response saved but no data returned" }, { status: 500 })
    }

    console.log("[v0] Response saved successfully! ID:", data[0].id)
    console.log("[v0] === RESPONSE SAVE COMPLETE ===")

    return NextResponse.json({ success: true, data: data[0] })
  } catch (error) {
    console.error("[v0] Unexpected error in save response:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
