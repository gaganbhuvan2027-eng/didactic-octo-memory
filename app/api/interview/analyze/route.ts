import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/api/rate-limit"
import { generateAnalysis } from "@/app/actions/generate-analysis"

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const requestSchema = z.object({
  interviewId: z.string().min(1, "Interview ID is required"),
  faceMetrics: z
    .object({
      eyeContact: z.number().optional(),
      smile: z.number().optional(),
      stillness: z.number().optional(),
      confidenceScore: z.number().optional(),
    })
    .optional(),
  questionsSkipped: z.number().int().min(0).optional().default(0),
  scheduleId: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const parsed = await request.json().then((body) => requestSchema.safeParse(body))
    if (!parsed.success) {
      console.error("[v0] analyze: Request parsing failed:", parsed.error.flatten().fieldErrors);
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { interviewId, faceMetrics, questionsSkipped, scheduleId } = parsed.data
    console.log("[v0] analyze: Parsed request data:", { interviewId, faceMetrics, questionsSkipped, scheduleId });

    console.log("[v0] Starting analysis for interview:", interviewId)

    const supabaseAuth = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      console.error('[v0] analyze: unauthorized - no user found in supabase auth')
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log('[v0] analyze: requesting user id=', user.id, 'interviewId=', interviewId)

    const rateKey = rateLimitKeyFromRequest(request, user.id)
    if (isRateLimited(rateKey, 100, 60_000)) {
      console.warn("[v0] analyze: Rate limit exceeded for user:", user.id);
      return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 })
    }

    const supabase = await createAdminClient()

    // Try to fetch interview including the scheduled_interview_id column if it exists.
    // If the column is absent in the DB, fall back to selecting only the core columns.
    let interview: any = null
    let scheduledInterviewColumnExists = true

    try {
      const { data, error } = await supabase
        .from("interviews")
        .select("id,user_id,started_at,scheduled_interview_id,interview_type,question_count")
        .eq("id", interviewId)
        .maybeSingle()

      if (error) {
        const msg = error?.message || String(error)
        if (/scheduled_interview_id|question_count|column .*does not exist/i.test(msg)) {
          console.warn('[v0] analyze: retrying without optional columns:', msg)
          scheduledInterviewColumnExists = false

          const { data: fallbackData, error: fallbackError } = await supabase
            .from("interviews")
            .select("id,user_id,started_at,interview_type")
            .eq("id", interviewId)
            .maybeSingle()

          if (fallbackError) {
            console.error('[v0] analyze: failed to fetch interview:', { interviewId, fallbackError })
            return NextResponse.json({ error: `Failed to fetch interview: ${fallbackError.message || fallbackError}` }, { status: 500 })
          }

          interview = fallbackData
        } else {
          console.error('[v0] analyze: error fetching interview:', { interviewId, error })
          return NextResponse.json({ error: `Failed to fetch interview: ${error.message || error}` }, { status: 500 })
        }
      } else {
        interview = data
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (/scheduled_interview_id|question_count|column .*does not exist/i.test(msg)) {
        console.warn('[v0] analyze: retrying without optional columns:', msg)
        scheduledInterviewColumnExists = false

        const { data: fallbackData, error: fallbackError } = await supabase
          .from("interviews")
          .select("id,user_id,started_at,interview_type")
          .eq("id", interviewId)
          .maybeSingle()

        if (fallbackError) {
          console.error('[v0] analyze: failed to fetch interview on fallback:', { interviewId, fallbackError })
          return NextResponse.json({ error: `Failed to fetch interview: ${fallbackError.message || fallbackError}` }, { status: 500 })
        }

        interview = fallbackData
      } else {
        console.error('[v0] analyze: unexpected error fetching interview:', { interviewId, err })
        return NextResponse.json({ error: `Failed to fetch interview: ${msg}` }, { status: 500 })
      }
    }

    console.log("[v0] analyze: Fetched interview data:", interview);

    if (!interview) {
      console.warn("[v0] analyze: interview not found", { interviewId })
      return NextResponse.json({ error: `Interview not found: ${interviewId}` }, { status: 404 })
    }
   
    if (!interview.interview_type) {
      console.error("[v0] analyze: interview_type is missing for interview", interviewId);
      return NextResponse.json({ error: "Interview type not found" }, { status: 500 });
    }

    if (!scheduledInterviewColumnExists) {
      // Helpful log for debugging and for the dev to know the migration is needed
      console.warn('[v0] analyze: continuing without scheduled_interview_id column. To fully enable schedule linking, apply scripts/011_add_scheduled_interview_id_to_interviews.sql and restart the server.')
    }

    if (interview.user_id && interview.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Detect missing schedule linkage and attempt to find candidate schedule
    let effectiveScheduleId: string | undefined = parsed.data.scheduleId || (interview as any).scheduled_interview_id || undefined
    console.log("[v0] analyze: Effective Schedule ID (before candidate search):", effectiveScheduleId);

    if (!effectiveScheduleId) {
      console.warn('[v0] analyze: interview has no scheduled_interview_id and no scheduleId provided:', { interviewId })

      // Attempt to find a candidate scheduled_interviews row matching the user and near the interview start time
      try {
        const startedAt = interview.started_at || null
        if (startedAt) {
          const startedDate = new Date(startedAt)
          const windowMs = 2 * 60 * 60 * 1000 // 2 hours either side
          const from = new Date(startedDate.getTime() - windowMs).toISOString()
          const to = new Date(startedDate.getTime() + windowMs).toISOString()

          const { data: candidate, error: candidateError } = await supabase
            .from('scheduled_interviews')
            .select('id, scheduled_date, member_id')
            .eq('member_id', interview.user_id)
            .gte('scheduled_date', from)
            .lte('scheduled_date', to)
            .order('scheduled_date', { ascending: true })
            .limit(1)
            .maybeSingle()

          if (candidateError) {
            console.error('[v0] analyze: error searching for candidate scheduled_interviews:', candidateError)
          } else if (candidate) {
            console.log('[v0] analyze: found candidate schedule for interview (auto-link suggestion):', { interviewId, candidateId: candidate.id, scheduled_date: candidate.scheduled_date })
            effectiveScheduleId = candidate.id

            // Try to backfill interviews.scheduled_interview_id when possible (silently fail if column missing)
            try {
              const { error: updateErr } = await supabase
                .from('interviews')
                .update({ scheduled_interview_id: candidate.id })
                .eq('id', interviewId)

              if (updateErr) {
                console.warn('[v0] analyze: could not update interviews.scheduled_interview_id (maybe column missing):', updateErr.message || updateErr)
              } else {
                console.log('[v0] analyze: backfilled interviews.scheduled_interview_id =', candidate.id, 'for interview', interviewId)
              }
            } catch (upErr) {
              console.warn('[v0] analyze: failed to backfill scheduled_interview_id:', upErr)
            }
          } else {
            console.log('[v0] analyze: no candidate schedule found near interview start time')
          }
        }
      } catch (err) {
        console.error('[v0] analyze: unexpected error while searching for candidate schedule:', err)
      }
    }
    console.log("[v0] analyze: Final Effective Schedule ID:", effectiveScheduleId);

    // Get all responses for this interview
    const { data: responses, error: responsesError } = await supabase
      .from("interview_responses")
      .select("*")
      .eq("interview_id", interviewId)
      .order("question_number")

    if (responsesError) {
      console.error("[v0] analyze: Error fetching responses:", responsesError)
      return NextResponse.json({ error: responsesError.message }, { status: 500 })
    }
    console.log("[v0] analyze: Fetched interview responses:", responses);


    // Exclude placeholder/non-answers: skipped, empty, or "transcription pending" (no real answer)
    const PLACEHOLDER_ANSWERS = [
      "user's recorded response - transcription pending",
      "user's recorded response - transcription pending.",
      "transcription pending",
      "no speech detected",
    ]
    const isPlaceholderAnswer = (a: string) =>
      PLACEHOLDER_ANSWERS.some((p) => a?.toLowerCase().trim().includes(p))
    const validResponses = responses.filter(
      (r) =>
        r.answer &&
        r.answer.trim() !== "" &&
        !r.answer.toUpperCase().includes("[SKIPPED]") &&
        !isPlaceholderAnswer(r.answer),
    )
    const hasNoParticipation = validResponses.length === 0

    console.log(`[v0] Valid responses: ${validResponses.length}, Total responses: ${responses.length}`)

    let analysis

    if (hasNoParticipation) {
      console.log("[v0] No participation detected - setting all scores to 0")
      const totalQuestions = Math.max(
        responses?.length ?? 0,
        (interview as { question_count?: number })?.question_count ?? 0
      )
      analysis = {
        overall_score: 0,
        communication_score: 0,
        technical_score: 0,
        problem_solving_score: 0,
        confidence_score: 0,
        strengths: [],
        improvements: ["No participation detected. Please attempt to answer the questions in your next interview."],
        detailed_feedback:
          "You did not provide any meaningful responses during this interview. To get accurate feedback and improve your interview skills, please ensure you answer the interview questions thoroughly in your next session.",
        total_questions: totalQuestions,
        answered_questions: 0,
        correct_answers_count: totalQuestions > 0 ? `0/${totalQuestions}` : "0/0",
        wrong_answers_count: 0,
        not_answered_questions_count: totalQuestions,
      }
    } else {
      // Generate AI analysis for responses with content
      // Call generateAnalysis server action
      console.log("[v0] analyze: Calling generateAnalysis action...");
      const generateAnalysisResult = await generateAnalysis(interviewId, interview.interview_type, questionsSkipped);
      console.log("[v0] analyze: generateAnalysis action returned:", generateAnalysisResult);


      if (!generateAnalysisResult.success) {
        throw new Error(generateAnalysisResult.error || "Failed to generate analysis");
      }
      analysis = generateAnalysisResult.analysis;
    }

    console.log("[v0] analyze: Analysis object generated (or default set):", analysis);

    const skipPenalty = questionsSkipped * 10
    const adjustedOverallScore = Math.max(0, analysis.overall_score - skipPenalty)

    console.log("[v0] Questions skipped:", questionsSkipped, "Penalty:", skipPenalty)

    const { data: existingResult } = await supabase
      .from("interview_results")
      .select("id")
      .eq("interview_id", interviewId)
      .maybeSingle()
    console.log("[v0] analyze: Existing result check:", existingResult);

    const baseResultData = {
      overall_score: adjustedOverallScore,
      communication_score: analysis.communication_score,
      technical_score: analysis.technical_score,
      problem_solving_score: analysis.problem_solving_score,
      confidence_score: analysis.confidence_score,
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      detailed_feedback: analysis.detailed_feedback,
      eye_contact_score: faceMetrics?.eyeContact || null,
      smile_score: faceMetrics?.smile || null,
      stillness_score: faceMetrics?.stillness || null,
      face_confidence_score: faceMetrics?.confidenceScore || null,
      correct_answers_count: analysis.correct_answers_count,
    }
    const optionalResultData = {
      total_questions: analysis.total_questions,
      answered_questions: analysis.answered_questions,
      wrong_answers_count: analysis.wrong_answers_count,
      not_answered_questions_count: analysis.not_answered_questions_count ?? (analysis.total_questions ?? 0) - (analysis.answered_questions ?? 0),
    }

    let resultsError
    if (existingResult) {
      console.log("[v0] analyze: Updating existing interview result...");
      const fullData = { ...baseResultData, ...optionalResultData }
      const { error: updateError } = await supabase
        .from("interview_results")
        .update(fullData)
        .eq("interview_id", interviewId)
      resultsError = updateError
      if (resultsError && /column .*does not exist/i.test(String(resultsError?.message || ""))) {
        const { error: retryError } = await supabase
          .from("interview_results")
          .update(baseResultData)
          .eq("interview_id", interviewId)
        resultsError = retryError
      }
    } else {
      console.log("[v0] analyze: Inserting new interview result...");
      const fullData = { interview_id: interviewId, ...baseResultData, ...optionalResultData }
      const { error: insertError } = await supabase.from("interview_results").insert(fullData)
      resultsError = insertError
      if (resultsError && /column .*does not exist/i.test(String(resultsError?.message || ""))) {
        const { error: retryError } = await supabase.from("interview_results").insert({
          interview_id: interviewId,
          ...baseResultData,
        })
        resultsError = retryError
      }
    }
   
    if (resultsError) {
      console.error("[v0] analyze: Error saving results:", resultsError)
      return NextResponse.json({ error: resultsError.message }, { status: 500 })
    }
    console.log("[v0] analyze: Interview results saved successfully.");


    console.log("[v0] analyze: Updating interview status to completed...");
    await supabase
      .from("interviews")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", interviewId)
    console.log("[v0] analyze: Interview status updated.");


    // Prefer the explicitly provided scheduleId, otherwise use effectiveScheduleId found above
    const scheduleToUpdate = parsed.data.scheduleId || effectiveScheduleId
    console.log("[v0] analyze: Schedule to update (final):", scheduleToUpdate);


    if (scheduleToUpdate) {
      try {
        console.log("[v0] analyze: Updating scheduled interview status to completed for scheduleId:", scheduleToUpdate);
        await supabase
          .from("scheduled_interviews")
          .update({ status: "completed" })
          .eq("id", scheduleToUpdate)
        console.log("[v0] analyze: Scheduled interview status updated.");

      } catch (err) {
        console.error('[v0] analyze: Failed to update scheduled_interviews status for scheduleId=', scheduleToUpdate, err)
      }
    } else {
      console.warn('[v0] analyze: no scheduleId available to mark scheduled_interviews.completed for interview', interviewId)
    }

    console.log("[v0] Analysis completed successfully")
    return NextResponse.json({ analysis, scheduleLinked: Boolean(scheduleToUpdate), linkedScheduleId: scheduleToUpdate || null });
  } catch (error) {
    console.error("[v0] Error analyzing interview:", error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error("[v0] Full error:", errorMsg)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
