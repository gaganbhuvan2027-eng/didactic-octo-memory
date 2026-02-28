import { type NextRequest, NextResponse } from "next/server"
import { createGroq } from "@ai-sdk/groq"
import { generateText } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/api/rate-limit"

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const requestSchema = z.object({
  transcript: z.string().min(1, "Transcript is required").max(4000),
  context: z
    .object({
      question: z.string().optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  try {
    const parsed = await request.json().then((body) => requestSchema.safeParse(body))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { transcript, context } = parsed.data

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateKey = rateLimitKeyFromRequest(request, user.id)
    if (isRateLimited(rateKey, 300, 60_000)) {
      return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 })
    }

    const { text } = await generateText({
      model: groqClient("llama-3.1-8b-instant"),
      prompt: `You are an expert at detecting when someone has finished speaking in an interview conversation.

Context: This is an interview. The user is answering a question: "${context?.question || "a question"}"

Current transcript of what the user has said so far:
"${transcript}"

IMPORTANT: In interviews, people give answers with natural pauses. Balance between allowing complete thoughts and moving forward efficiently. Mark as complete when the answer is substantive and shows clear completion signals.

Analyze this transcript and determine if the user has completed their answer:

CRITERIA FOR COMPLETION (mark as complete if MOST apply):
- Clear completion phrases: "that's all", "that's it", "I think that's everything", "hope that helps", "so yeah", "that's my answer"
- Natural ending with no indication of continuation (no trailing "and", "but", "so", "because")
- The answer addresses the question with a complete thought
- No active filler words at the very end
- Ends with proper punctuation or natural sentence completion
- Answer is substantive (10+ words) and coherent

CRITERIA FOR CONTINUATION (mark as incomplete if ANY apply):
- Active filler words at the very end: "um...", "uh...", "and um..."
- Mid-sentence cutoff: "I think that because...", "and then I..."
- Trailing conjunctions at the end: "and", "but", "so", "because"
- Very short responses (less than 5 words) that don't answer the question
- Clearly building up to more detail

EXAMPLES OF COMPLETE ANSWERS:
- "I worked on a React project where I implemented hooks and managed state effectively. It was a great learning experience." ✓ COMPLETE
- "I have 3 years of experience in frontend development, primarily with React and TypeScript. I've built several production applications." ✓ COMPLETE  
- "I think I handled it well by communicating with the team and finding a solution that worked for everyone. That's how I approach conflicts." ✓ COMPLETE

EXAMPLES OF INCOMPLETE ANSWERS:
- "I worked on a React project where I implemented hooks and..." ✗ INCOMPLETE (trailing "and")
- "I think that because um..." ✗ INCOMPLETE (filler word)
- "Well, I have experience in..." ✗ INCOMPLETE (seems to be continuing)
- "I handled it by communicating with the team and" ✗ INCOMPLETE (incomplete sentence)

Respond in JSON format:
{
  "isComplete": boolean (true if user is done, false if still speaking),
  "confidence": number (0.0 to 1.0 confidence score),
  "reasoning": "brief explanation of your decision"
}

Use balanced judgment - if the answer is substantive and complete, mark it as complete. If clearly incomplete or mid-sentence, mark as incomplete.`,
      temperature: 0.3,
    })

    // Parse the JSON response
    const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim()
    const analysis = JSON.parse(cleanedText)

    console.log("[v0] LLM Turn Detection:", {
      transcript: transcript.substring(0, 50) + "...",
      isComplete: analysis.isComplete,
      confidence: analysis.confidence,
      reasoning: analysis.reasoning,
    })

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("[v0] Turn detection error:", error)
    return NextResponse.json(
      {
        isComplete: false,
        confidence: 0,
        reasoning: "Error analyzing transcript",
      },
      { status: 500 },
    )
  }
}
