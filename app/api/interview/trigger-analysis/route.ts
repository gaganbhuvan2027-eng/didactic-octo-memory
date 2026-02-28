import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { z } from "zod"
import { createServerClient } from "@supabase/ssr"
import { createAdminClient } from "@/lib/supabase/server"

// Basic in-memory rate limiter (per process). 
// NOTE: In serverless environments (Vercel), each request may hit a different instance,
// making this rate limiting less effective. For production, consider using Redis/Upstash.
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 100
const rateLimitStore = new Map<string, { count: number; expiresAt: number }>()

function rateLimit(key: string) {
  const now = Date.now()
  const current = rateLimitStore.get(key)
  if (!current || current.expiresAt < now) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  if (current.count >= RATE_LIMIT_MAX) return true
  current.count += 1
  rateLimitStore.set(key, current)
  return false
}

const requestSchema = z.object({
  interviewId: z.string().min(1, "Interview ID is required"),
  interviewType: z.string().min(1, "Interview type is required"),
  questionsSkipped: z.number().int().min(0).optional().default(0),
})

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown"

    if (rateLimit(ip)) {
      return NextResponse.json({ error: "Too many requests. Please slow down." }, { status: 429 })
    }

    const parsed = await request.json().then((body) => requestSchema.safeParse(body))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { interviewId, interviewType, questionsSkipped } = parsed.data

    console.log("[trigger-analysis] Triggering analysis for interview:", interviewId)

    // Require authenticated user
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use the centralized admin client (service role)
    const supabaseAdmin = await createAdminClient()

    const { data: interview, error: interviewError } = await supabaseAdmin
      .from("interviews")
      .select("id,user_id")
      .eq("id", interviewId)
      .maybeSingle()

    if (interviewError) {
      console.error("[v0] Error fetching interview:", interviewError)
      return NextResponse.json({ error: "Failed to fetch interview" }, { status: 500 })
    }

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 })
    }

    if (interview.user_id && interview.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: responses, error: responsesError } = await supabaseAdmin
      .from("interview_responses")
      .select("*")
      .eq("interview_id", interviewId)
      .order("question_number", { ascending: true })

    if (responsesError) {
      console.error("[v0] Error fetching responses:", responsesError)
      return NextResponse.json({ error: "Failed to fetch responses" }, { status: 500 })
    }

    if (!responses || responses.length === 0) {
      console.log("[v0] No responses found for interview:", interviewId)
      return NextResponse.json({ error: "No responses found" }, { status: 404 })
    }

    const conversationText = responses
      .map(
        (r: any) =>
          `Q${r.question_number}: ${r.question}\nA: ${r.answer || "[Skipped]"}`
      )
      .join("\n\n")

    const prompt = `You are an expert interview coach. Analyze this ${interviewType} interview performance and provide detailed feedback.

Interview Transcript:
${conversationText}

Questions Skipped: ${questionsSkipped}

Provide a comprehensive analysis with:
1. Overall score (0-100)
2. Communication score (0-100)
3. Technical/domain knowledge score (0-100)
4. Problem-solving score (0-100)
5. Confidence score (0-100)
6. 3-5 key strengths
7. 3-5 areas for improvement
8. Detailed written feedback (2-3 paragraphs)

Return ONLY valid JSON in this exact format:
{
  "overall_score": number,
  "communication_score": number,
  "technical_score": number,
  "problem_solving_score": number,
  "confidence_score": number,
  "strengths": ["strength 1", "strength 2", ...],
  "improvements": ["improvement 1", "improvement 2", ...],
  "detailed_feedback": "detailed paragraph feedback"
}`

    const { text } = await generateText({
      model: groqClient("llama-3.1-8b-instant"),
      prompt,
    })

    let analysis
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text)
    } catch (parseError) {
      console.error("[v0] Error parsing AI response:", text)
      throw new Error("Failed to parse AI analysis")
    }

    const { error: updateError } = await supabaseAdmin
      .from("interviews")
      .update({
        analysis: analysis,
        completed_at: new Date().toISOString(),
      })
      .eq("id", interviewId)

    if (updateError) {
      console.error("[v0] Error storing analysis:", updateError)
      return NextResponse.json({ error: "Failed to store analysis" }, { status: 500 })
    }

    console.log("[v0] Analysis completed and stored successfully")
    
    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error("[v0] Error generating analysis:", error)
    const errorMsg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
