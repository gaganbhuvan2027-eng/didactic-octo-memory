import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/api/rate-limit"
import { fetchWithTimeout } from "@/lib/api/http"
import { z } from "zod"

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

const requestSchema = z.object({
  resumeUrl: z.string().url().optional(),
  resumeText: z.string().optional(),
}).refine(data => data.resumeUrl || data.resumeText, {
  message: "Either resumeUrl or resumeText is required"
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const parsed = await request.json().then((body) => requestSchema.safeParse(body))
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }
    const { resumeUrl, resumeText: directText } = parsed.data

    const rateKey = rateLimitKeyFromRequest(request, user.id)
    if (isRateLimited(rateKey, 5, 60_000)) {
      return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 })
    }

    let text = ""
    
    // If direct text is provided, use it (best quality)
    if (directText && directText.trim().length > 50) {
      text = directText.trim()
      console.log("[v0] Using directly provided resume text, length:", text.length)
    }
    // Otherwise fetch from URL
    else if (resumeUrl) {
    console.log("[v0] Fetching resume from:", resumeUrl)

    // Fetch the resume file
    const response = await fetchWithTimeout(resumeUrl, { timeoutMs: 10_000 })
    if (!response.ok) {
      throw new Error("Failed to fetch resume")
    }

    const blob = await response.blob()
      text = await blob.text()
    }
    
    if (!text || text.trim().length < 50) {
      return NextResponse.json({ error: "Resume content is too short. Please provide more details." }, { status: 400 })
    }

    // Safety cap to avoid huge payloads
    if (text.length > 200_000) {
      return NextResponse.json({ error: "Resume file too large" }, { status: 413 })
    }

    console.log("[v0] Resume text length:", text.length)

    // Use AI to parse the resume and extract structured data
    const { text: parsedData } = await generateText({
      model: groqClient("llama-3.1-8b-instant"),
      prompt: `You are a resume parser. Extract structured information from the following resume text and return it as JSON.

Extract:
- skills: array of technical skills
- experience: array of work experiences with {company, role, duration, description}
- education: array of education with {institution, degree, field, year}
- projects: array of projects with {name, description, technologies}
- summary: brief professional summary (2-3 sentences)

Resume text:
${text}

Return ONLY valid JSON, no markdown formatting.`,
    })

    console.log("[v0] AI parsed resume data")

    // Clean and parse the JSON response
    let cleanedData = parsedData.trim()
    if (cleanedData.startsWith("```json")) {
      cleanedData = cleanedData.replace(/```json\n?/g, "").replace(/```\n?/g, "")
    } else if (cleanedData.startsWith("```")) {
      cleanedData = cleanedData.replace(/```\n?/g, "")
    }

    const resumeData = JSON.parse(cleanedData)

    console.log("[v0] Parsed resume data:", resumeData)

    // Update user profile with parsed resume data
    const { error: updateError } = await supabase
      .from("users")
      .update({
        resume_data: resumeData,
        skills: resumeData.skills || [],
        experience: resumeData.experience || [],
        education: resumeData.education || [],
        bio: resumeData.summary || null,
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("[v0] Error updating user profile:", updateError)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: resumeData,
    })
  } catch (error) {
    console.error("[v0] Resume parsing error:", error)
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 })
  }
}
