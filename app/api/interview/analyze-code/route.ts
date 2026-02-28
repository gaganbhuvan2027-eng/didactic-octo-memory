import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/api/rate-limit"

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const requestSchema = z.object({
  code: z.string().min(1, "Code is required").max(10000),
  problem: z.string().min(1, "Problem is required").max(4000),
  interviewType: z.string().min(1, "Interview type is required"),
})

export async function POST(request: Request) {
  try {
    const parsed = await request.json().then((body) => requestSchema.safeParse(body))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { code, problem, interviewType } = parsed.data

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateKey = rateLimitKeyFromRequest(request, user.id)
    if (isRateLimited(rateKey, 100, 60_000)) {
      return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 })
    }

    console.log("[v0] Analyzing code submission for DSA problem")

    const analysisPrompt = `You are an expert coding interviewer analyzing a candidate's solution.

PROBLEM:
${problem}

CANDIDATE'S CODE:
${code}

Respond with a JSON object (no markdown, no code blocks) with exactly two fields:

1. "feedback": Detailed analysis covering:
   - Correctness (bugs, edge cases)
   - Time and space complexity
   - Code quality and structure
   - Optimization suggestions
   Keep it concise (3-5 sentences per point).

2. "spokenFollowUp": ONE short conversational question (1 sentence) the interviewer would ask aloud, e.g.:
   - "Why did you choose that approach?"
   - "Can you explain your time complexity?"
   - "What would you change if we needed to handle larger inputs?"
   - "Why did you use that variable there?"
   Make it natural, like a real interviewer probing the candidate's thinking.`

    const result = await generateText({
      model: groqClient("llama-3.1-8b-instant"),
      prompt: analysisPrompt,
      temperature: 0.7,
      maxTokens: 600,
    })

    let feedback = result.text
    let spokenFollowUp = "Good. Let's move to the next problem."

    try {
      const parsed = JSON.parse(result.text.trim().replace(/^```json\s*|\s*```$/g, ""))
      if (typeof parsed.feedback === "string") feedback = parsed.feedback
      if (typeof parsed.spokenFollowUp === "string" && parsed.spokenFollowUp.trim()) {
        spokenFollowUp = parsed.spokenFollowUp.trim()
      }
    } catch {
      // Fallback: use full text as feedback
    }

    console.log("[v0] Code analysis completed")

    return NextResponse.json({ feedback, spokenFollowUp })
  } catch (error) {
    console.error("[v0] Error analyzing code:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze code" },
      { status: 500 },
    )
  }
}
