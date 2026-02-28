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
  interviewId: z.string().min(1),
  problem: z.string().min(1).max(4000),
  userCode: z.string().min(1).max(10000),
  conceptIndex: z.number().min(1).max(5),
  previousConceptQAndA: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })).optional().default([]),
})

export async function POST(request: Request) {
  try {
    const parsed = await request.json().then((body) => requestSchema.safeParse(body))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { problem, userCode, conceptIndex, previousConceptQAndA } = parsed.data

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateKey = rateLimitKeyFromRequest(request, user.id)
    if (isRateLimited(rateKey, 60, 60_000)) {
      return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 })
    }

    const prevContext = previousConceptQAndA.length > 0
      ? `\nPrevious concept questions asked and answered:\n${previousConceptQAndA.map((q, i) => `Q${i + 1}: ${q.question}\nA: ${q.answer}`).join("\n\n")}`
      : ""

    const prompt = `You are an expert coding interviewer. Generate ONE follow-up CONCEPT question.

ORIGINAL PROBLEM:
${problem}

CANDIDATE'S CODE:
${userCode}
${prevContext}

IMPORTANT - Choose question type based on code quality:
- If the code is MEANINGFUL and addresses the problem: Ask about concepts IN their code (e.g. variable choice, loop logic, edge cases, time/space complexity, design decisions).
- If the code is GIBBERISH, WRONG, or does NOT address the problem: Do NOT ask about their code. Instead ask conceptual questions about the PROBLEM itself, e.g. "What approach would you use to solve this?", "What are the key concepts or data structures needed?", "What edge cases should a correct solution handle?", "What would the time complexity of an optimal solution be?"

Rules:
- Is NOT a repeat of any previous concept question
- Can be answered verbally in 1-3 sentences
- Stay relevant to the problem domain

Return ONLY the question text, nothing else. No markdown, no code blocks.`

    const result = await generateText({
      model: groqClient("llama-3.1-8b-instant"),
      prompt,
      temperature: 0.8,
      maxTokens: 150,
    })

    const question = result.text.trim().replace(/^["']|["']$/g, "")

    return NextResponse.json({ question })
  } catch (error) {
    console.error("[v0] Error generating concept question:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate question" },
      { status: 500 },
    )
  }
}
