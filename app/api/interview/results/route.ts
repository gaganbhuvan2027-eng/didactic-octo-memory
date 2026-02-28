import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const interviewId = searchParams.get("interviewId")

    console.log("[v0] Fetching results for interview:", interviewId)

    if (!interviewId) {
      return NextResponse.json({ error: "Interview ID is required" }, { status: 400 })
    }

    const supabase = await createAdminClient()

    const { data: analysis, error: analysisError } = await supabase
      .from("interview_results")
      .select("*")
      .eq("interview_id", interviewId)
      .maybeSingle()

    console.log("[v0] Analysis query result:", { analysis, error: analysisError })

    if (analysisError) {
      console.error("[v0] Error fetching analysis:", analysisError)
      return NextResponse.json({ error: analysisError.message }, { status: 500 })
    }

    if (!analysis) {
      console.log("[v0] No analysis found for interview:", interviewId)
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 })
    }

    const { data: responses, error: responsesError } = await supabase
      .from("interview_responses")
      .select("*")
      .eq("interview_id", interviewId)
      .order("question_number")

    if (responsesError) {
      console.error("[v0] Error fetching responses:", responsesError)
    }

    // Try to fetch link to scheduled_interviews and batch info when possible
    let scheduleId: string | null = null
    let batchId: string | null = null
    let interviewType: string = "technical"; // Default value
    let courseName: string | null = null
    let round: string | null = null
    let practicedAt: string | null = null
    try {
      const { data: interviewRow, error: interviewRowError } = await supabase
        .from("interviews")
        .select("scheduled_interview_id, interview_type, round, started_at, completed_at")
        .eq("id", interviewId)
        .maybeSingle()

      if (interviewRowError) {
        const msg = String(interviewRowError?.message || "")
        if (/column.*does not exist/i.test(msg)) {
          const res2 = await supabase.from("interviews").select("scheduled_interview_id, interview_type, started_at, completed_at").eq("id", interviewId).maybeSingle()
          if (res2.data) {
            const r = res2.data as Record<string, unknown>
            scheduleId = (r.scheduled_interview_id as string) || null
            const rawInterviewType = (r.interview_type as string) || "technical"
            interviewType = rawInterviewType
            const completedAt = r.completed_at as string | null
            const startedAt = r.started_at as string | null
            practicedAt = (completedAt || startedAt) ? new Date(completedAt || startedAt).toISOString() : null
            const parts = rawInterviewType.split("-")
            if (parts[0] === "dsa") courseName = "DSA"
            else if (parts[0] === "aptitude") courseName = "Aptitude"
            else if (["frontend", "backend", "fullstack", "mobile", "datascience", "devops"].includes(parts[0])) {
              courseName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
              if (parts[1]) courseName += ` - ${parts[1]}`
            } else courseName = rawInterviewType || "Interview"
          }
        } else {
          console.warn('[v0] results: interview row fetch:', msg)
        }
      } else if (interviewRow) {
        scheduleId = (interviewRow as any).scheduled_interview_id || null
        const rawInterviewType = (interviewRow as any).interview_type || "technical"
        interviewType = rawInterviewType
        round = (interviewRow as any).round || null
        const completedAt = (interviewRow as any).completed_at
        const startedAt = (interviewRow as any).started_at
        practicedAt = (completedAt || startedAt) ? new Date(completedAt || startedAt).toISOString() : null
        const parts = (rawInterviewType || "").split("-")
        if (parts[0] === "dsa") courseName = "DSA"
        else if (parts[0] === "aptitude") courseName = "Aptitude"
        else if (["frontend", "backend", "fullstack", "mobile", "datascience", "devops"].includes(parts[0])) {
          courseName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
          if (parts[1]) courseName += ` - ${parts[1]}`
        } else courseName = rawInterviewType || "Interview"
      }

      if (scheduleId) {
        const { data: scheduleRow, error: scheduleError } = await supabase
          .from("scheduled_interviews")
          .select("id,batch_id")
          .eq("id", scheduleId)
          .maybeSingle()

        if (scheduleError) {
          console.error('[v0] results: error fetching scheduled_interviews row:', scheduleError)
        } else if (scheduleRow) {
          batchId = scheduleRow.batch_id || null
        }
      }
    } catch (err) {
      console.error('[v0] results: unexpected error while looking up schedule/batch:', err)
    }

    const formattedAnalysis = {
      overall_score: analysis.overall_score,
      communication_score: analysis.communication_score,
      technical_score: analysis.technical_score,
      dsa_score: analysis.dsa_score || analysis.technical_score, // Include DSA score
      logical_reasoning_score: analysis.logical_reasoning_score || analysis.technical_score, // Include aptitude score
      problem_solving_score: analysis.problem_solving_score,
      confidence_score: analysis.confidence_score,
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      improvements: Array.isArray(analysis.improvements) ? analysis.improvements : [],
      detailed_feedback: analysis.detailed_feedback || "",
      correct_answers_count: analysis.correct_answers_count, // Include correct answers
      total_questions: analysis.total_questions, // Include total questions
      answered_questions: analysis.answered_questions, // Include answered questions
      wrong_answers_count: analysis.wrong_answers_count, // Include wrong answers
      not_answered_questions_count: analysis.not_answered_questions_count, // Include not answered questions
      evaluations: analysis.evaluations || {}, // Per-question evaluation for coding/DSA/aptitude
      interviewType: interviewType, // Include interviewType in the response
    }

    console.log("[v0] Returning formatted analysis:", formattedAnalysis)
    return NextResponse.json({
      analysis: formattedAnalysis,
      responses: responses || [],
      scheduleId,
      batchId,
      courseName,
      round,
      practicedAt,
    })
  } catch (error) {
    console.error("[v0] Error in results route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch results" },
      { status: 500 },
    )
  }
}
