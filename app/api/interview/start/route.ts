import { createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getInterviewCost } from "@/utils/credits"

export async function POST(request: Request) {
  try {
    const { interviewType: rawInterviewType, userId, userEmail, userName, duration, difficulty, customScenario, round } = await request.json()

    // Infer interview type from referer if needed
    let interviewType = rawInterviewType || 'technical'
    try {
      const referer = request.headers.get('referer') || ''
      if (referer && !interviewType.includes('-')) {
        const match = referer.match(/\/interview\/course\/([^\/]+)\/([^\/?#]+)/i)
        if (match) {
          interviewType = `${match[1]}-${match[2]}`
        }
      }
    } catch {
      // Ignore referer parsing errors
    }

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Question count: coding round = 1 code + 5 Qs (5min), 2 codes + 10 Qs (15min), 3 codes + 15 Qs (30min)
    const codingQuestionCount: Record<number, number> = { 5: 6, 15: 12, 30: 18 }
    const defaultQuestionCount: Record<number, number> = { 5: 10, 15: 15, 30: 20 }
    const questionCount = round === "coding"
      ? (codingQuestionCount[duration] ?? 12)
      : (defaultQuestionCount[duration] ?? Math.ceil((duration / 30) * 25))

    const cost = getInterviewCost(duration || 15, interviewType)
    const supabase = await createAdminClient()

    // OPTIMIZATION: Run user upsert and credit check in PARALLEL
    const [userResult, creditResult] = await Promise.all([
      // User upsert (fire and forget style - we don't block on errors)
      supabase.from("users").upsert(
        { id: userId, email: userEmail || `user_${userId}@mockzen.app`, name: userName || "User" },
        { onConflict: "id", ignoreDuplicates: false }
      ).then(res => res).catch(() => ({ error: null })),
      
      // Credit check
      supabase.from("user_credits").select("balance").eq("user_id", userId).maybeSingle()
    ])

    // Handle credit check result
    if (creditResult.error) {
      return NextResponse.json({ error: "Could not verify credits" }, { status: 500 })
    }

    const balance = creditResult.data?.balance ?? 0
    if (balance < cost) {
      return NextResponse.json({ error: "Not enough credits" }, { status: 402 })
    }

    // IMPORTANT: Create interview FIRST, then deduct credits
    // This prevents losing credits if interview creation fails
    const insertPayload: Record<string, unknown> = {
      user_id: userId,
      interview_type: interviewType,
      status: "in_progress",
      started_at: new Date().toISOString(),
      difficulty: difficulty || "intermediate",
      question_count: questionCount,
    }
    if (round && typeof round === "string") {
      insertPayload.round = round
    }
    const interviewResult = await supabase.from("interviews").insert(insertPayload).select().single()

    if (interviewResult.error) {
      console.error("[interview/start] Failed to create interview:", interviewResult.error)
      return NextResponse.json({ error: interviewResult.error.message }, { status: 500 })
    }

    if (interviewResult.error) {
      console.error("[interview/start] Failed to create interview:", interviewResult.error)
      return NextResponse.json({ error: interviewResult.error.message }, { status: 500 })
    }

    // Now deduct credits (interview was created successfully)
    const deductResult = await supabase
      .from("user_credits")
      .update({ balance: balance - cost, updated_at: new Date().toISOString() })
      .eq("user_id", userId)

    if (deductResult.error) {
      // Interview was created but credits couldn't be deducted
      // Log this as a critical issue - manual intervention may be needed
      console.error("[interview/start] CRITICAL: Interview created but credits not deducted!", {
        interviewId: interviewResult.data.id,
        userId,
        cost,
        error: deductResult.error,
      })
      // Still return success - the interview was created
      // Better to let user proceed than block them
    }

    // Log transaction (don't block on this, but log errors)
    supabase.from("credit_transactions").insert({
      user_id: userId,
      delta: -cost,
      reason: "interview_start",
      metadata: { 
        interviewType, 
        duration, 
        difficulty, 
        customScenario,
        interviewId: interviewResult.data.id,
      },
    }).then(() => {}).catch((err) => {
      console.error("[interview/start] Failed to log credit transaction:", err)
    })

    return NextResponse.json({ 
      interview: { ...interviewResult.data, question_count: questionCount } 
    })
  } catch (error) {
    console.error("[interview/start] Error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
