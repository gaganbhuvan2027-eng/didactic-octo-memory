import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { createAdminClient, createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"
import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/api/rate-limit"

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const querySchema = z.object({
  interviewId: z.string().min(1, "Interview ID is required"),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({ interviewId: searchParams.get("interviewId") || "" })
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { interviewId } = parsed.data

    console.log("[v0] Fetching conversation for interview:", interviewId)

    const supabaseAuth = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateKey = rateLimitKeyFromRequest(request, user.id)
    if (isRateLimited(rateKey, 100, 60_000)) {
      return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 })
    }

    const supabase = await createAdminClient()

    const { data: interview, error: interviewError } = await supabase
      .from("interviews")
      .select("id,user_id,interview_type,round")
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

    console.log("[v0] Querying interview_responses table...")

    const { data: responses, error: responsesError } = await supabase
      .from("interview_responses")
      .select("*")
      .eq("interview_id", interviewId)
      .order("question_number")

    console.log("[v0] Query result:", {
      responseCount: responses?.length || 0,
      error: responsesError,
      responses: responses,
    })

    if (responsesError) {
      console.error("[v0] Error fetching responses:", responsesError)
      return NextResponse.json({ error: responsesError.message }, { status: 500 })
    }

    if (!responses || responses.length === 0) {
      console.log("[v0] No responses found for interview:", interviewId)
      return NextResponse.json({ conversation: [], probableAnswers: [] })
    }

    const conversation = responses.map((r) => {
      let questionText = r.question
      let userAnswer = r.answer || "[No response provided]"
      let options: Array<{ key: string; text: string }> | undefined
      // Parse MCQ format (aptitude stores question as JSON)
      if (typeof r.question === "string" && r.question.trim().startsWith("{")) {
        try {
          const parsed = JSON.parse(r.question) as { question?: string; options?: Array<{ key: string; text: string }> }
          if (parsed?.question) {
            questionText = parsed.question
            if (Array.isArray(parsed.options) && parsed.options.length > 0) {
              options = parsed.options
              const selectedOpt = options.find((o) => o.key === r.answer)
              if (selectedOpt) userAnswer = `${r.answer}: ${selectedOpt.text}`
            }
          }
        } catch {
          // use question as-is
        }
      }
      return {
        questionNumber: r.question_number,
        question: questionText,
        userAnswer,
        skipped: r.skipped || false,
        ...(options && { options }),
      }
    })

    const allQuestions = conversation
      .filter((c) => c.question)
      .map((c) => `Q${c.questionNumber}: ${c.question}`)
      .join("\n\n")

    let probableAnswers: any[] = []

    const codingCourses = ["frontend", "backend", "fullstack", "mobile", "datascience", "devops"]
    const coursePart = (interview?.interview_type || "").split("-")[0] || ""
    const isCodingRound =
      (codingCourses.includes(coursePart) && (interview?.interview_type || "").includes("-") && interview?.round === "coding") ||
      ((interview?.interview_type || "").startsWith("role-") && interview?.round === "coding")

    if (allQuestions && responses.length > 0) {
      try {
        console.log("[v0] Generating probable answers for", responses.length, "questions...", isCodingRound ? "(coding round)" : "")

        const codePrompt = isCodingRound
          ? `You are an expert coding interviewer. For each question below, provide an appropriate response.
For CODING PROBLEMS (questions asking to implement, fix, or write code): Return a clean, correct reference solution in the requested language (Python by default). Use proper indentation and syntax. Return ONLY the code, no explanations.
For CONCEPT QUESTIONS (follow-up questions about the code): Return a concise 2-4 sentence answer demonstrating strong understanding.

CRITICAL: Return ONLY a valid JSON array within a single \`\`\`json\` block. Escape newlines in strings as \\n.
`
          : ""

        const basePrompt = `You are an expert in providing model answers for interview questions. For each question below, provide a concise, professional probable answer that demonstrates strong technical knowledge and communication skills.\n\nCRITICAL: Return ONLY a valid JSON array within a single \`\`\`json\` block. DO NOT include any other text, explanations, or formatting outside this JSON block. Ensure all string values within the JSON are properly escaped (e.g., newlines as \\n).\n\nQuestions:\n${allQuestions}\n\nProvide your response as a JSON array with this exact format:\n\`\`\`json\n[\n  {\n    \"questionNumber\": 1,\n    \"probableAnswer\": \"A comprehensive answer that demonstrates expertise...\"\n  },\n  ...\n]\n\`\`\`\n\nBe specific, professional, and demonstrate best practices in the field. Keep each answer concise (2-4 sentences).`

        const prompt = isCodingRound ? codePrompt + `\nQuestions:\n${allQuestions}\n\nReturn JSON array: [{"questionNumber": 1, "probableAnswer": "..."}, ...]` : basePrompt

        const { text } = await generateText({
          model: groqClient("llama-3.1-8b-instant"),
          prompt,
        })

        console.log("[v0] Raw AI text before cleaning:", text);
        console.log("[v0] AI response received, parsing...")

        let cleanedText = "";
        const jsonBlockMatch = text.match(/\n([\s\S]*?)\n```/);

        if (jsonBlockMatch && jsonBlockMatch[1]) {
          cleanedText = jsonBlockMatch[1].trim();
        } else {
          // Fallback to find any JSON array-like object if not found
          const bareJsonArrayMatch = text.match(/(\\[[\\s\\S]*\\])/);
          if (bareJsonArrayMatch && bareJsonArrayMatch[1]) {
            cleanedText = bareJsonArrayMatch[1].trim();
          } else {
            console.warn("[v0] No JSON array block found in AI response, attempting full text parse.");
            cleanedText = text.trim();
          }
        }

        // Sanitize probableAnswer string values: escape literal newlines and control characters so JSON.parse doesn't fail
        // This regex now operates on the extracted JSON string
        cleanedText = cleanedText.replace(/(\"probableAnswer\"\\s*:\\s*)\"(.*?)\"/gs, (_m, p1, inner) => {
          const sanitizedInner = inner.replace(/\\r?\\n/g, "\\\\n").replace(/[\u0000-\u001F]/g, (c) => `\\\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`)
          return `${p1}\"${sanitizedInner}` + '\"'
        })
        console.log("[v0] Cleaned text before JSON parse:", cleanedText.substring(0, 1000));

        try {
          probableAnswers = JSON.parse(cleanedText)
          console.log("[v0] Successfully generated", probableAnswers.length, "probable answers")
        } catch (parseError) {
          console.error('[v0] JSON parse failed for AI output. Cleaned text snippet:', cleanedText.substring(0, 1000))
          // Do not re-throw here, allow conversation to continue without probable answers
        }
      } catch (error) {
        console.error("[v0] Error generating probable answers:", error)
        // Continue without probable answers if generation fails
      }
    }

    return NextResponse.json({ conversation, probableAnswers })
  } catch (error) {
    console.error("[v0] Error in conversation route:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch conversation" },
      { status: 500 },
    )
  }
}