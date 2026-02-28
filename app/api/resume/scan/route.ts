import { createAdminClient, createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { companies, roles } from "@/lib/companies"

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("resume") as File

    if (!file) {
      return NextResponse.json({ error: "No resume file provided" }, { status: 400 })
    }

    // Check if raw text was provided (from paste mode) - validate early
    const rawResumeTextCheck = formData.get("resumeText") as string | null
    
    // For text mode, validate content before charging
    if (rawResumeTextCheck !== null && rawResumeTextCheck.trim().length < 50) {
      return NextResponse.json({ error: "Resume content is too short. Please paste at least 50 characters." }, { status: 400 })
    }
    
    // For file mode: validate file size (PDFs need more bytes; txt needs content)
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    const isTxt = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt")
    if (isTxt && file.size < 50) {
      return NextResponse.json({ error: "Resume file is empty or too short. Please upload a file with actual content." }, { status: 400 })
    }
    if (isPdf && file.size < 100) {
      return NextResponse.json({ error: "PDF file appears corrupted or empty. Please upload a valid resume PDF." }, { status: 400 })
    }

    // Cost for resume scan is 1 credit
    const cost = 1
    const adminSupabase = await createAdminClient()

    // Check credits
    const { data: creditData, error: creditError } = await adminSupabase
      .from("user_credits")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()

    if (creditError) {
      return NextResponse.json({ error: "Could not verify credits" }, { status: 500 })
    }

    const balance = creditData?.balance ?? 0
    if (balance < cost) {
      return NextResponse.json({ error: "Not enough credits" }, { status: 402 })
    }

    // Deduct credits first
    const { error: deductError } = await adminSupabase
      .from("user_credits")
      .update({ balance: balance - cost, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)

    if (deductError) {
      return NextResponse.json({ error: "Failed to deduct credits" }, { status: 500 })
    }

    // Log transaction
    await adminSupabase.from("credit_transactions").insert({
      user_id: user.id,
      delta: -cost,
      reason: "resume_scan",
      metadata: { 
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      },
    })

    // Extract text from the resume file
    let resumeText = ""
    
    console.log("[resume-scan] Processing file:", file.name, "Type:", file.type, "Size:", file.size)
    
    // If raw text was provided directly, use it (best quality)
    if (rawResumeTextCheck && rawResumeTextCheck.trim().length > 50) {
      resumeText = rawResumeTextCheck.trim()
      console.log("[resume-scan] Using directly pasted text, length:", resumeText.length)
    }
    // For .txt files, read directly
    else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      resumeText = await file.text()
      console.log("[resume-scan] TXT file extracted, text length:", resumeText.length)
    }
    // For PDF files, try to use pdf-parse
    else if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        console.log("[resume-scan] Attempting PDF extraction, buffer size:", buffer.length)
        
        // Dynamic import - try both default and named export for compatibility
        try {
          const pdfParseModule = await import("pdf-parse")
          const pdfParse = pdfParseModule.default || pdfParseModule
          
          console.log("[resume-scan] pdf-parse module loaded, type:", typeof pdfParse)
          
          // pdf-parse v2.x may have different API
          if (typeof pdfParse === 'function') {
            const pdfData = await pdfParse(buffer)
            resumeText = pdfData.text || ""
            console.log("[resume-scan] PDF extraction success, text length:", resumeText.length)
            if (resumeText.length > 0) {
              console.log("[resume-scan] First 500 chars:", resumeText.substring(0, 500))
            }
          } else if (pdfParse.default && typeof pdfParse.default === 'function') {
            const pdfData = await pdfParse.default(buffer)
            resumeText = pdfData.text || ""
            console.log("[resume-scan] PDF extraction via .default success, text length:", resumeText.length)
          } else {
            console.error("[resume-scan] pdf-parse is not a function, type:", typeof pdfParse, "keys:", Object.keys(pdfParse))
            throw new Error("pdf-parse module not properly loaded")
          }
        } catch (pdfError: any) {
          console.error("[resume-scan] pdf-parse failed:", pdfError.message, pdfError.stack)
          
          // Fallback: Try to extract text from PDF binary
          const textDecoder = new TextDecoder("utf-8", { fatal: false })
          const rawText = textDecoder.decode(buffer)
          
          // Look for text content between parentheses (PDF text operators)
          const textParts: string[] = []
          const textRegex = /\(([^)]+)\)/g
          let match
          while ((match = textRegex.exec(rawText)) !== null) {
            const text = match[1]
            // Filter out binary/control characters
            if (/^[\x20-\x7E]+$/.test(text) && text.length > 2) {
              textParts.push(text)
            }
          }
          
          if (textParts.length > 10) {
            resumeText = textParts.join(" ")
            console.log("[resume-scan] Fallback extraction got text, length:", resumeText.length)
          } else {
            // Last resort: extract any readable strings
            const readableStrings = rawText.match(/[A-Za-z][A-Za-z0-9\s,.\-@()]+[A-Za-z0-9]/g) || []
            const meaningfulStrings = readableStrings.filter(s => s.length > 5 && s.length < 200)
            if (meaningfulStrings.length > 5) {
              resumeText = meaningfulStrings.join(" ")
              console.log("[resume-scan] Last resort extraction, length:", resumeText.length)
            } else {
              resumeText = `[PDF file: ${file.name}. Unable to extract text. This may be a scanned image PDF. Please use "Paste Text" option or TXT file for best results.]`
            }
          }
        }
      } catch (pdfOuterError: any) {
        console.error("[resume-scan] PDF processing error:", pdfOuterError.message)
        resumeText = `[PDF processing failed. Please use "Paste Text" option for best results.]`
      }
    }
    // For Word documents
    else if (file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
             file.type === "application/msword" ||
             file.name.endsWith(".docx") || file.name.endsWith(".doc")) {
      console.log("[resume-scan] Processing Word document")
      try {
        const arrayBuffer = await file.arrayBuffer()
        const textDecoder = new TextDecoder("utf-8", { fatal: false })
        const rawContent = textDecoder.decode(arrayBuffer)
        
        // Try to extract text from DOCX XML structure
        const textMatches = rawContent.match(/<w:t[^>]*>([^<]+)<\/w:t>/g)
        if (textMatches && textMatches.length > 0) {
          resumeText = textMatches
            .map(m => m.replace(/<[^>]+>/g, ''))
            .join(' ')
          console.log("[resume-scan] DOCX XML extraction, length:", resumeText.length)
        } else {
          resumeText = await file.text()
        }
      } catch {
        resumeText = await file.text()
      }
      console.log("[resume-scan] Word text length:", resumeText.length)
    }
    // For other file types, try to read as text
    else {
      console.log("[resume-scan] Processing as plain text")
      try {
        resumeText = await file.text()
        console.log("[resume-scan] Plain text length:", resumeText.length)
      } catch (parseError: any) {
        console.error("[resume-scan] Error parsing resume file:", parseError.message)
        resumeText = `[Resume file: ${file.name}, Size: ${file.size} bytes. Unable to extract text content. Error: ${parseError.message}]`
      }
    }
    
    // Clean up the extracted text
    resumeText = resumeText
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .replace(/[^\x20-\x7E\n]/g, ' ')  // Remove non-printable chars
      .trim()
    
    console.log("[resume-scan] Final text length after cleanup:", resumeText.length)
    
    // If we still have very little text, note this
    if (resumeText.length < 100) {
      console.log("[resume-scan] WARNING: Very little text extracted from resume")
    }

    // Analyze resume with AI
    console.log("[resume-scan] Sending to AI for analysis, text length:", resumeText.length)
    
    const roleList = roles.map((r) => `${r.id} (${r.name})`).join(", ")
    const companyList = companies.map((c) => `${c.id} (${c.name})`).join(", ")

    const analysisPrompt = `You are an expert resume reviewer and career coach. Carefully analyze the following resume content and provide personalized, specific feedback.

CRITICAL SCORING INSTRUCTIONS:
- Score MUST vary based on resume quality - do NOT give every resume the same score
- Poor/incomplete resumes: 50-60
- Average resumes with room for improvement: 61-75
- Good resumes with minor issues: 76-85  
- Excellent resumes: 86-95
- Base your scores on the ACTUAL CONTENT provided below

RESUME TEXT (${resumeText.length} characters extracted):
---
${resumeText.substring(0, 10000)}
---

IMPORTANT: Analyze the above text carefully. Look for:
- Name, email, phone, location (Contact Info)
- Career summary or objective statement
- Job titles, company names, dates, accomplishments (Work Experience)
- Technical and soft skills listed
- Degrees, certifications, institutions (Education)

Even if the text seems messy or has formatting issues from extraction, identify and evaluate what IS there.

IDEAL JOBS: Based on the resume's skills, experience, and background, suggest 3-5 ideal job roles and 3-5 ideal companies from our list. Use ONLY these exact IDs:
Roles (use id): ${roleList}
Companies (use id): ${companyList}
Pick roles and companies that best match the candidate's profile. Order by best fit first.

Respond with ONLY this JSON structure (no markdown, no extra text):
{
  "overall_score": <number based on actual quality>,
  "ats_score": <number - ATS compatibility based on keywords>,
  "summary": "<2-3 sentences describing THIS specific resume's quality and main impression>",
  "sections": [
    {"name": "Contact Information", "score": <number>, "feedback": "<specific feedback based on what you found>"},
    {"name": "Professional Summary", "score": <number>, "feedback": "<specific feedback>"},
    {"name": "Work Experience", "score": <number>, "feedback": "<specific feedback based on actual experience listed>"},
    {"name": "Skills", "score": <number>, "feedback": "<specific feedback on skills found>"},
    {"name": "Education", "score": <number>, "feedback": "<specific feedback>"}
  ],
  "strengths": ["<actual strength from this resume>", "<another strength>", "<third strength>"],
  "improvements": ["<specific improvement for this resume>", "<another>", "<third>", "<fourth>", "<fifth>"],
  "detailed_feedback": "<3-4 paragraphs of personalized analysis for THIS resume>",
  "keyword_analysis": {
    "found_keywords": ["<actual keywords from the resume>"],
    "missing_keywords": ["<keywords they should add based on their field>"],
    "keyword_density_score": <number>
  },
  "ideal_jobs": {
    "roles": ["<role_id>", "<role_id>", "<role_id>"],
    "companies": ["<company_id>", "<company_id>", "<company_id>"]
  }
}`

    let analysis
    try {
      const result = await generateText({
        model: groqClient("llama-3.1-8b-instant"),
        prompt: analysisPrompt,
        temperature: 0.7,
      })

      console.log("[resume-scan] AI response received, parsing JSON...")
      const jsonMatch = result.text.match(/\{[\s\S]*\}/)
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(result.text)
      
      // Ensure all scores are valid numbers and within range
      analysis.overall_score = Math.max(50, Math.min(95, Number(analysis.overall_score) || 65))
      analysis.ats_score = Math.max(50, Math.min(95, Number(analysis.ats_score) || 60))
      
      // Ensure sections have valid scores
      if (analysis.sections && Array.isArray(analysis.sections)) {
        analysis.sections = analysis.sections.map((s: any) => ({
          ...s,
          score: Math.max(50, Math.min(95, Number(s.score) || 60))
        }))
      }
      
      console.log("[resume-scan] Analysis parsed successfully, overall_score:", analysis.overall_score)
    } catch (aiError) {
      console.error("Error with AI analysis:", aiError)
      // Provide a fallback analysis if AI fails
      analysis = {
        overall_score: 65,
        ats_score: 60,
        summary: "Resume received but detailed AI analysis encountered an issue. The resume appears to have standard structure.",
        sections: [
          { name: "Overall Structure", score: 65, feedback: "Resume structure appears standard. Consider adding more specific details." }
        ],
        strengths: ["Resume submitted successfully", "Document format is readable"],
        improvements: ["Consider reformatting for better parsing", "Ensure file is text-readable", "Add more quantifiable achievements"],
        detailed_feedback: "We were unable to fully analyze your resume at this time. Please ensure your resume is in a standard PDF or DOCX format with selectable text. Scanned images may not be properly analyzed. Consider using a text-based resume template.",
        keyword_analysis: {
          found_keywords: [],
          missing_keywords: ["Add relevant industry keywords"],
          keyword_density_score: 50
        },
        ideal_jobs: { roles: ["software-engineer"], companies: ["google", "microsoft"] }
      }
    }

    // Store the scan in history with error handling
    console.log("[resume-scan] Storing scan in history...")
    const keywordAnalysis = {
      ...(analysis.keyword_analysis || {}),
      ideal_jobs: analysis.ideal_jobs || { roles: [], companies: [] },
    }

    const { data: insertData, error: insertError } = await adminSupabase.from("resume_scans").insert({
      user_id: user.id,
      file_name: file.name,
      file_size: file.size,
      overall_score: analysis.overall_score,
      summary: analysis.summary || "",
      sections: analysis.sections || [],
      improvements: analysis.improvements || [],
      strengths: analysis.strengths || [],
      detailed_feedback: analysis.detailed_feedback || "",
      ats_score: analysis.ats_score || 60,
      keyword_analysis: keywordAnalysis,
    }).select()
    
    if (insertError) {
      console.error("[resume-scan] Error storing resume scan in history:", insertError)
      // Log but don't block the user
    } else {
      console.log("[resume-scan] Scan stored successfully:", insertData)
    }

    // Return with consistent field names (include ideal_jobs at top level for frontend)
    return NextResponse.json({ 
      success: true, 
      data: {
        ...analysis,
        score: analysis.overall_score, // Add 'score' alias for frontend compatibility
        ideal_jobs: analysis.ideal_jobs || keywordAnalysis.ideal_jobs,
      },
      remainingCredits: balance - cost
    })

  } catch (error: any) {
    console.error("Error scanning resume:", error)
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 })
  }
}

