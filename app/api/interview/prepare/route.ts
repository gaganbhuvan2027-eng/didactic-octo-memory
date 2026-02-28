import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getInterviewCost } from "@/utils/credits"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      interviewType: rawInterviewType,
      userId,
      userEmail,
      userName,
      duration,
      difficulty,
      customScenario,
      round,
      topics,
      interviewer,
      subcourse,
      isCodingRound,
    } = body

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (userId && userId !== user.id) {
      return NextResponse.json({ error: "User mismatch" }, { status: 403 })
    }

    const effectiveUserId = userId || user.id
    const effectiveUserEmail = userEmail || user.email || ""
    const effectiveUserName = userName || user.user_metadata?.name || user.email?.split("@")[0] || "User"

    let interviewType = rawInterviewType || "technical"

    if (!interviewType.includes("-") && body.interviewTypeFromPath) {
      interviewType = body.interviewTypeFromPath
    }

    const codingQuestionCount: Record<number, number> = { 5: 6, 15: 12, 30: 18 }
    const defaultQuestionCount: Record<number, number> = { 5: 10, 15: 15, 30: 20 }
    const questionCount = round === "coding"
      ? (codingQuestionCount[duration ?? 15] ?? 12)
      : (defaultQuestionCount[duration ?? 15] ?? Math.ceil(((duration ?? 15) / 30) * 25))

    const cost = getInterviewCost(duration || 15, interviewType)
    const adminSupabase = await createAdminClient()

    const [userResult, creditResult] = await Promise.all([
      adminSupabase
        .from("users")
        .upsert(
          { id: effectiveUserId, email: effectiveUserEmail || `user_${effectiveUserId}@mockzen.app`, name: effectiveUserName },
          { onConflict: "id", ignoreDuplicates: false }
        )
        .then((res) => res)
        .catch(() => ({ error: null })),
      adminSupabase.from("user_credits").select("balance").eq("user_id", effectiveUserId).maybeSingle(),
    ])

    if (creditResult.error) {
      return NextResponse.json({ error: "Could not verify credits" }, { status: 500 })
    }

    const balance = creditResult.data?.balance ?? 0
    if (balance < cost) {
      return NextResponse.json({ error: "Not enough credits" }, { status: 402 })
    }

    const insertPayload: Record<string, unknown> = {
      user_id: effectiveUserId,
      interview_type: interviewType,
      status: "in_progress",
      started_at: new Date().toISOString(),
      difficulty: difficulty || "intermediate",
      question_count: questionCount,
    }
    if (round && typeof round === "string") {
      insertPayload.round = round
    }

    const interviewResult = await adminSupabase.from("interviews").insert(insertPayload).select().single()

    if (interviewResult.error) {
      console.error("[interview/prepare] Failed to create interview:", interviewResult.error)
      return NextResponse.json({ error: interviewResult.error.message }, { status: 500 })
    }

    const deductResult = await adminSupabase
      .from("user_credits")
      .update({ balance: balance - cost, updated_at: new Date().toISOString() })
      .eq("user_id", effectiveUserId)

    if (deductResult.error) {
      console.error("[interview/prepare] CRITICAL: Interview created but credits not deducted!")
    }

    adminSupabase
      .from("credit_transactions")
      .insert({
        user_id: effectiveUserId,
        delta: -cost,
        reason: "interview_start",
        metadata: { interviewType, duration, difficulty, customScenario, interviewId: interviewResult.data.id },
      })
      .then(() => {})
      .catch((err) => console.error("[interview/prepare] Failed to log transaction:", err))

    const interviewId = interviewResult.data.id

    const questionBody: Record<string, unknown> = {
      interviewId,
      interviewType,
      questionNumber: 1,
      previousAnswers: [],
      userId: effectiveUserId,
      ...(customScenario && { customScenario }),
      ...(topics?.length > 0 && { topics }),
      ...(interviewer && { interviewer }),
      ...(subcourse && { subcourse }),
      ...(isCodingRound === true && {
        isCodingRound: true,
        codingProblemIndex: 1,
        ...(questionCount === 6 && { useFixBuggyVariant: Math.random() < 0.5 }),
      }),
    }

    const origin = new URL(request.url).origin
    const cookieHeader = request.headers.get("cookie") || ""
    const questionRes = await fetch(`${origin}/api/interview/question`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(cookieHeader && { cookie: cookieHeader }),
      },
      body: JSON.stringify(questionBody),
    })

    let firstQuestion: string | { question: string; options: Array<{ key: string; text: string }>; correctAnswer?: string } | null = null
    if (questionRes.ok) {
      const qData = await questionRes.json()
      if (qData?.question) {
        if (Array.isArray(qData.options) && qData.options.length >= 2) {
          firstQuestion = {
            question: qData.question,
            options: qData.options,
            correctAnswer: qData.correctAnswer,
          }
        } else {
          firstQuestion = qData.question
        }
      }
    }

    return NextResponse.json({
      interview: { ...interviewResult.data, question_count: questionCount },
      firstQuestion,
    })
  } catch (error) {
    console.error("[interview/prepare] Error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
