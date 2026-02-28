import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/api/rate-limit"
import { companyInterviewDetails } from "@/lib/companies"

const groqClient = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

function normalizeQuestion(question: string): string {
  return question
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "") // remove punctuation
    .replace(/\s+/g, " ") // normalize whitespace
    .trim()
}

function generateQuestionHash(question: string): string {
  let hash = 0
  const str = normalizeQuestion(question)
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

function getQuestionWords(text: string): Set<string> {
  return new Set(normalizeQuestion(text).split(/\s+/).filter(Boolean))
}

function wordOverlapRatio(a: string, b: string): number {
  const wordsA = getQuestionWords(a)
  const wordsB = getQuestionWords(b)
  if (wordsA.size === 0 || wordsB.size === 0) return 0
  let overlap = 0
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++
  }
  return overlap / Math.max(wordsA.size, wordsB.size)
}

function isDuplicateQuestion(question: string, previousAnswers: any[], previousQuestionsFromDB: string[] = []): boolean {
  const normalizedCandidate = normalizeQuestion(question)
  const candidateHash = generateQuestionHash(question)
  
  // Check hash against current session
  const previousHashes = new Set(previousAnswers.map((qa: any) => generateQuestionHash(qa.question || "")))
  if (previousHashes.has(candidateHash)) return true
  
  // Check hash against DB questions
  const dbHashes = new Set(previousQuestionsFromDB.map((q) => generateQuestionHash(q)))
  if (dbHashes.has(candidateHash)) return true
  
  // Also check for very similar questions (first 50 chars normalized match)
  const candidateStart = normalizedCandidate.substring(0, 50)
  for (const qa of previousAnswers) {
    const prevStart = normalizeQuestion(qa.question || "").substring(0, 50)
    if (candidateStart === prevStart && candidateStart.length > 20) return true
  }
  for (const q of previousQuestionsFromDB) {
    const prevStart = normalizeQuestion(q).substring(0, 50)
    if (candidateStart === prevStart && candidateStart.length > 20) return true
  }
  
  // Semantic duplicate: same meaning, different wording (e.g. "What do you know about NumPy arrays?" vs "What do you know about NumPy arrays so far?")
  const allPrevious = [
    ...(previousAnswers || []).map((qa: any) => qa.question || "").filter(Boolean),
    ...previousQuestionsFromDB,
  ]
  for (const prev of allPrevious) {
    if (wordOverlapRatio(question, prev) >= 0.85) return true
  }
  
  return false
}

async function generateTextWithRetry(model: any, prompt: string, maxRetries = 5, initialDelayMs = 2000) {
  let lastError: any = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[v0] Groq API attempt ${attempt + 1}/${maxRetries}`)
      const result = await generateText({
        model,
        prompt,
        temperature: 0.6,
      })
      return result
    } catch (error) {
      lastError = error
      const delayMs = initialDelayMs * Math.pow(2, attempt)

      if (error instanceof Error) {
        console.error(`[v0] Groq API error (attempt ${attempt + 1}): ${error.message}`)

        // Don't retry on auth errors or validation errors
        if (error.message.includes("401") || error.message.includes("403") || error.message.includes("validation")) {
          throw error
        }
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw error
      }

      console.log(`[v0] Retrying in ${delayMs}ms (${(delayMs / 1000).toFixed(1)}s)...`)
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  throw lastError
}

export async function POST(request: Request) {
  try {
    const { interviewId, interviewType, questionNumber, previousAnswers, userId, customScenario, questionCount, isCodingRound, topics: topicsParam, interviewer: interviewerParam, codingProblemIndex, useFixBuggyVariant } =
      await request.json()

    console.log("[v0] Generating question for interview:", interviewId)
    console.log("[v0] Interview type:", interviewType, "Question number:", questionNumber)

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[v0] Authentication error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rateKey = rateLimitKeyFromRequest(request, user.id)
    if (isRateLimited(rateKey, 200, 60_000)) {
      return NextResponse.json({ error: "Too many requests, slow down." }, { status: 429 })
    }

    console.log("[v0] Authenticated user:", user.id)

    let courseName = ""
    let courseSubject = ""
    let companyId = ""
    let companyType = ""
    let roleId = ""
    let roleType = ""
    let otherInterviewType = "" // hr-interview, warmup, salary-negotiation

    // Check for other interviews (HR, warmup, salary) - NOT course-based
    const isOtherInterview = interviewType?.startsWith("other-")
    if (isOtherInterview && interviewType) {
      otherInterviewType = interviewType.replace("other-", "")
      console.log("[v0] Other interview type:", otherInterviewType)
    }

    // Check for company-based interview: company-{companyId}-{type} or company-{companyId}-role-{roleId}
    const isCompanyInterview = interviewType?.startsWith("company-")
    // Check for role-based interview: role-{roleId}-{type}
    const isRoleInterview = interviewType?.startsWith("role-") && !isCompanyInterview

    if (isCompanyInterview) {
      const parts = interviewType.split("-")
      // company-{companyId}-role-{roleId} OR company-{companyId}-{type}
      companyId = parts[1]
      if (parts[2] === "role") {
        roleId = parts.slice(3).join("-")
        console.log("[v0] Company-Role interview:", companyId, "/", roleId)
      } else {
        companyType = parts.slice(2).join("-")
        console.log("[v0] Company interview:", companyId, "/", companyType)
      }
    } else if (isRoleInterview) {
      const parts = interviewType.split("-")
      // role-{roleId}-{type} - roleId can have hyphens (e.g. software-engineer, data-scientist)
      // type is always last: coding, technical, behavioral, system-design, warmup, hr, full
      const validRoleTypes = ["coding", "technical", "behavioral", "system-design", "warmup", "hr", "full"]
      const lastPart = parts[parts.length - 1]
      if (parts.length >= 3 && validRoleTypes.includes(lastPart)) {
        roleType = lastPart
        roleId = parts.slice(1, -1).join("-")
      } else {
        roleId = parts.slice(1).join("-")
        roleType = "technical"
      }
      console.log("[v0] Role interview:", roleId, "/", roleType)
    }

    const isAptitudeType = interviewType?.startsWith("aptitude")

    if (isAptitudeType && (!interviewType?.includes("-") || interviewType === "aptitude")) {
      // Handle plain "aptitude" type without sub-course
      courseName = "aptitude"
      courseSubject = "general"
    } else if (!isCompanyInterview && !isRoleInterview && !isOtherInterview && interviewType && interviewType.includes("-")) {
      const parts = interviewType.split("-")
      courseName = parts[0] // e.g., "dsa", "frontend", "backend"
      courseSubject = parts.slice(1).join("-") // e.g., "arrays", "react", "node"
      console.log("[v0] Course detected:", courseName, "/", courseSubject)
    }

    let difficulty = "intermediate"
    let interviewRound: string | null = null
    let interviewQuestionCount = 10
    try {
      const { data: interview } = await supabase.from("interviews").select("difficulty, question_count").eq("id", interviewId).single()
      if (interview?.difficulty) difficulty = interview.difficulty
      if (interview && typeof (interview as { question_count?: number }).question_count === "number") {
        interviewQuestionCount = (interview as { question_count: number }).question_count
      }
    } catch {
      console.log("[v0] Could not fetch interview details, using defaults")
    }
    try {
      const { data: roundRow } = await supabase.from("interviews").select("round").eq("id", interviewId).single()
      if (roundRow && typeof (roundRow as { round?: string }).round === "string") {
        interviewRound = (roundRow as { round: string }).round
      }
    } catch {
      // round column may not exist yet - migration 021 adds it
    }

    console.log("[v0] Interview difficulty:", difficulty, "round:", interviewRound)

    // Map interviewer id to display name (vivek -> Vivek, claire -> Claire)
    const interviewerNames: Record<string, string> = { claire: "Claire" }
    const interviewerName = (interviewerParam && interviewerNames[interviewerParam as string]) || null

    const { data: userProfile } = await supabase
      .from("users")
      .select("name, preferences, experience, education, skills, resume_data")
      .eq("id", user.id)
      .single()

    console.log("[v0] User profile loaded for personalization")

    // Fetch previous questions for this user + interview type (past sessions) for variety
    let previousQuestionsFromDB: string[] = []
    if (interviewType && typeof interviewType === "string") {
      const { data: prevRows, error: prevErr } = await supabase
        .from("interview_questions_asked")
        .select("question_text")
        .eq("user_id", user.id)
        .eq("interview_type", interviewType)
        .order("last_asked_at", { ascending: false })
        .limit(10)
      if (!prevErr) {
        previousQuestionsFromDB = (prevRows || []).map((r: { question_text: string }) => r.question_text).filter(Boolean)
      }
    }
    
    // Also fetch questions already asked in THIS interview session (from interview_responses table)
    if (interviewId) {
      const { data: currentSessionRows } = await supabase
        .from("interview_responses")
        .select("question")
        .eq("interview_id", interviewId)
        .order("question_number", { ascending: true })
      if (currentSessionRows) {
        const currentSessionQuestions = currentSessionRows.map((r: { question: string }) => r.question).filter(Boolean)
        previousQuestionsFromDB = [...previousQuestionsFromDB, ...currentSessionQuestions]
      }
    }

    let userQuestion: string | null = null
    let aptitudeMCQResult: { question: string; options: Array<{ key: string; text: string }>; correctAnswer: string } | null = null
    let attempts = 0
    const maxAttempts = 6
    let lastError: any = null

    // Coding is role-only; DSA test uses coding for algorithm problems
    const isCodingForFallback = courseName === "dsa"
    // Detect company technical interviews: company-{companyId}-technical
    const isCompanyTechnicalInterview = isCompanyInterview && companyType === "technical"
    // Detect company system-design interviews: company-{companyId}-system-design
    const isCompanySystemDesignInterview = isCompanyInterview && companyType === "system-design"
    // Detect role coding interviews: role-{roleId}-coding
    const isRoleCodingInterview = isRoleInterview && roleType === "coding"

    // Combine current session + past sessions for variety prompts (cap to avoid huge prompts)
    const allPreviousQuestionTexts = [
      ...(previousAnswers || []).map((qa: any) => (qa.question || "").trim()).filter(Boolean),
      ...previousQuestionsFromDB,
    ]
      .filter((t, i, arr) => arr.indexOf(t) === i) // dedupe
      .slice(0, 12)

    while (attempts < maxAttempts && !userQuestion) {
      try {
        let interviewContext = ""

        const isAptitude = courseName === "aptitude" || isAptitudeType
        const isDSAInterview = courseName === "dsa"
        const isCodingInterview = isDSAInterview

        // Other interviews: HR, Warmup, Salary - PURE behavioral/HR, NO technical questions
        if (isOtherInterview && otherInterviewType) {
          const otherContexts: Record<string, string> = {
            "hr-interview": `You are conducting an HR INTERVIEW. Use SIMPLE, everyday English.

CRITICAL: This is a BEHAVIORAL/HR interview ONLY. DO NOT ask ANY technical questions (no coding, Node.js, programming, algorithms, system design, or technology-specific questions).

FOCUS EXCLUSIVELY ON:
- Past experiences and achievements (STAR method)
- How they handle challenges and conflict
- Teamwork and collaboration
- Leadership and initiative
- Career goals and motivations
- Cultural fit and work style
- Communication and soft skills
- Why they want this role / company

STYLE: Warm, conversational, like a real HR person. Build on their answers. Ask follow-ups.`,
            warmup: `You are conducting a WARMUP interview - a light, confidence-building practice session. Use SIMPLE, everyday English.

CRITICAL: This is a NON-TECHNICAL warmup. DO NOT ask ANY technical questions (no coding, programming, algorithms, or technology-specific questions).

FOCUS ON:
- Introduction and ice-breakers
- Light behavioral questions (experiences, teamwork)
- Building rapport and confidence
- General communication practice
- Soft, encouraging tone

STYLE: Friendly, supportive, low-pressure. Help them get comfortable.`,
            "salary-negotiation": `You are conducting a SALARY NEGOTIATION practice session. Use SIMPLE, everyday English.

CRITICAL: EVERY question MUST be about compensation, salary, benefits, or negotiation. Do NOT ask:
- Technical questions (no coding, programming, algorithms)
- Generic behavioral questions (tell me about a project, teamwork, conflict)
- Experience deep-dives unrelated to compensation
- Career goals or motivation (unless tied to salary)

FOCUS EXCLUSIVELY ON:
- Salary expectations and rationale
- Benefits and perks discussion
- Negotiation scenarios and responses
- How to articulate value and justify compensation
- Handling offers and counter-offers
- Professional communication around compensation

STYLE: Realistic negotiation practice. Role-play as recruiter/HR discussing compensation.`,
          }
          interviewContext = otherContexts[otherInterviewType] || otherContexts["hr-interview"]
          interviewContext += `

DIFFICULTY: ${difficulty}
Previous questions (avoid repetition):
${previousAnswers.map((qa: any, idx: number) => `${idx + 1}. ${qa.question}`).join("\n")}`
        }
        // Company and role interview context generators
        const companyContextMap: Record<string, { name: string; culture: string; interviewStyle: string; focusAreas: string[] }> = {
          google: {
            name: "Google",
            culture: "Innovation-driven, data-centric, collaborative",
            interviewStyle: "Focus on problem-solving, coding efficiency, system design, and 'Googleyness'",
            focusAreas: ["Data structures & algorithms", "System design", "Behavioral (Googleyness & Leadership)", "Coding best practices", "Scalability"]
          },
          amazon: {
            name: "Amazon",
            culture: "Customer obsession, ownership, bias for action, frugality",
            interviewStyle: "Leadership Principles-based questions, STAR method, working backwards",
            focusAreas: ["Leadership Principles", "Customer obsession scenarios", "System design", "Ownership & accountability", "Dealing with ambiguity"]
          },
          microsoft: {
            name: "Microsoft",
            culture: "Growth mindset, diversity & inclusion, customer success",
            interviewStyle: "Technical depth, problem-solving, collaboration and growth mindset",
            focusAreas: ["Technical problem-solving", "System design", "Growth mindset examples", "Collaboration", "Innovation"]
          },
          meta: {
            name: "Meta",
            culture: "Move fast, be bold, focus on long-term impact",
            interviewStyle: "Heavy coding focus, system design, behavioral with Meta values",
            focusAreas: ["Coding & algorithms", "System design at scale", "Product sense", "Behavioral (Meta values)", "Communication"]
          },
          apple: {
            name: "Apple",
            culture: "Attention to detail, innovation, secrecy, user experience",
            interviewStyle: "Deep technical expertise, passion for products, attention to detail",
            focusAreas: ["Technical depth", "Design thinking", "User experience focus", "Passion for Apple products", "Innovation mindset"]
          },
          netflix: {
            name: "Netflix",
            culture: "Freedom and responsibility, high performance, candid feedback",
            interviewStyle: "Culture fit, autonomy, judgment, and technical excellence",
            focusAreas: ["Culture & values alignment", "Independent judgment", "Technical excellence", "Communication & feedback", "Innovation"]
          },
          openai: {
            name: "OpenAI",
            culture: "Mission-driven, research excellence, safety-first, collaborative",
            interviewStyle: "AI/ML depth, research mindset, large-scale systems, and alignment with AGI mission",
            focusAreas: ["Machine learning & deep learning", "Large language models", "System design at scale", "Research & experimentation", "Safety & alignment"]
          },
          nvidia: {
            name: "NVIDIA",
            culture: "GPU computing, AI/ML excellence, graphics technology",
            interviewStyle: "Domain-specific technical depth, algorithms, system design",
            focusAreas: ["GPU computing", "CUDA", "Parallel computing", "AI/ML", "Computer architecture", "Performance optimization"]
          },
          tcs: {
            name: "TCS",
            culture: "Customer centricity, integrity, teamwork, learning culture",
            interviewStyle: "Technical fundamentals, aptitude, communication skills",
            focusAreas: ["Programming fundamentals", "Aptitude & reasoning", "Communication", "Teamwork", "Learning agility"]
          },
          infosys: {
            name: "Infosys",
            culture: "Learning organization, client value, excellence",
            interviewStyle: "Technical assessment, logical reasoning, communication",
            focusAreas: ["Programming concepts", "Logical reasoning", "Communication skills", "Problem-solving", "Adaptability"]
          },
          wipro: {
            name: "Wipro",
            culture: "Spirit of Wipro - intensity, integrity, imagination",
            interviewStyle: "Technical skills, aptitude, cultural fit",
            focusAreas: ["Technical knowledge", "Aptitude", "Team collaboration", "Communication", "Values alignment"]
          },
          flipkart: {
            name: "Flipkart",
            culture: "Customer first, ownership, speed, innovation",
            interviewStyle: "Machine coding, problem solving, system design",
            focusAreas: ["Coding & algorithms", "System design", "Product thinking", "Scalability", "E-commerce domain"]
          },
          swiggy: {
            name: "Swiggy",
            culture: "Consumer first, ownership, hustler mindset",
            interviewStyle: "DSA, machine coding, system design, culture fit",
            focusAreas: ["Data structures", "System design", "Problem-solving", "Ownership mindset", "Fast-paced environment"]
          },
          zomato: {
            name: "Zomato",
            culture: "Customer obsession, ownership, speed",
            interviewStyle: "Technical assessment, problem-solving, culture fit",
            focusAreas: ["Coding skills", "System design", "Product sense", "Startup mindset", "Adaptability"]
          },
          mckinsey: {
            name: "McKinsey",
            culture: "Client impact, personal development, teamwork",
            interviewStyle: "Case interviews, problem-solving, personal experience",
            focusAreas: ["Case studies", "Structured thinking", "Quantitative analysis", "Communication", "Leadership"]
          },
          bcg: {
            name: "BCG",
            culture: "Client focus, diversity, partnership",
            interviewStyle: "Case interviews, fit interviews, problem-solving",
            focusAreas: ["Case study methodology", "Structured problem-solving", "Data analysis", "Communication", "Teamwork"]
          },
          deloitte: {
            name: "Deloitte",
            culture: "Integrity, commitment, diversity",
            interviewStyle: "Technical, group discussion, partner interview",
            focusAreas: ["Domain expertise", "Communication", "Leadership potential", "Analytical skills", "Cultural fit"]
          },
          jpmorgan: {
            name: "JP Morgan",
            culture: "Integrity, fairness, responsibility, excellence",
            interviewStyle: "Technical, behavioral, superday format",
            focusAreas: ["Technical skills", "Financial acumen", "Leadership", "Problem-solving", "Communication"]
          },
          goldman: {
            name: "Goldman Sachs",
            culture: "Client service, integrity, excellence, partnership",
            interviewStyle: "HireVue, technical assessment, superday",
            focusAreas: ["Technical proficiency", "Financial knowledge", "Leadership & teamwork", "Analytical thinking", "Cultural fit"]
          }
        }

        // Company-specific frameworks and example questions for authentic interviews
        const companySpecificFrameworks: Record<string, {
          behavioralFramework?: string
          exampleBehavioralQuestions?: string[]
          technicalFocus?: string
          systemDesignFocus?: string
          isConsulting?: boolean
        }> = {
          amazon: {
            behavioralFramework: "Amazon's 16 Leadership Principles. Use STAR method. Key principles: Customer Obsession, Ownership, Bias for Action, Earn Trust, Deliver Results, Have Backbone; Disagree and Commit, Are Right A Lot.",
            exampleBehavioralQuestions: [
              "Tell me about a time you had to make a decision with incomplete information.",
              "Describe a situation where you disagreed with a manager's decision. How did you handle it?",
              "Tell me about a time you had to earn the trust of a difficult stakeholder.",
              "Describe a situation where you took ownership of a problem that wasn't your responsibility.",
            ],
            technicalFocus: "Algorithms, data structures, system design, OOD. Bar Raiser round ensures high bar.",
            systemDesignFocus: "E-commerce scale, distributed systems, working backwards from customer.",
          },
          google: {
            behavioralFramework: "Googleyness: ownership, collaboration, dealing with ambiguity, doing the right thing, valuing feedback. Leadership potential.",
            exampleBehavioralQuestions: [
              "Tell me about a time you had to convince a team to adopt a different approach.",
              "Describe a situation where you had to deal with ambiguity.",
              "Tell me about a time you received critical feedback. How did you respond?",
              "Describe a time when you had to make a trade-off between speed and quality.",
            ],
            technicalFocus: "LeetCode medium-hard, approach and methodology, communication while coding. Arrays, trees, graphs, hash maps, heaps, DP.",
            systemDesignFocus: "Scalable systems for L5+, break down problems, justify trade-offs.",
          },
          meta: {
            behavioralFramework: "Meta values: Build social value, move fast, focus on impact, be bold. Less than 1% get offers.",
            exampleBehavioralQuestions: [
              "Tell me about a time you shipped something quickly that had impact.",
              "Describe a situation where you had to be bold or take a risk.",
              "Tell me about a time you had to prioritize between multiple important projects.",
              "Describe a project where you built something that helped people.",
            ],
            technicalFocus: "Coding medium-hard (LeetCode-level), algorithms, system design. Write clean optimized code.",
            systemDesignFocus: "Systems at Meta scale, product sense, scalability.",
          },
          microsoft: {
            behavioralFramework: "Growth mindset, collaboration, diversity. Problem-solving valued over memorization.",
            exampleBehavioralQuestions: [
              "Tell me about a time you learned from failure.",
              "Describe a situation where you collaborated with a difficult teammate.",
              "Tell me about a time you had to adapt to a significant change.",
            ],
            technicalFocus: "Coding, design, problem-solving, testing. C++, Azure, data structures. Virtual interviews.",
            systemDesignFocus: "Technical design, architecture discussions.",
          },
          apple: {
            behavioralFramework: "Attention to detail, passion for products, innovation. Team matching after technical. Culture fit important.",
            exampleBehavioralQuestions: [
              "Tell me about a product you're passionate about and why.",
              "Describe a time when attention to detail made a critical difference.",
              "Tell me about a time you had to simplify a complex problem.",
            ],
            technicalFocus: "Deep technical expertise, system design, architecture. Research Apple products.",
            systemDesignFocus: "Architecture, design thinking, user experience at scale.",
          },
          netflix: {
            behavioralFramework: "Freedom and responsibility. Judgment, communication, impact. Candid discussions. Minimal structure.",
            exampleBehavioralQuestions: [
              "Tell me about a time you had to make a judgment call with limited guidance.",
              "Describe a situation where you gave or received candid feedback.",
              "Tell me about a time you demonstrated ownership with minimal oversight.",
            ],
            technicalFocus: "Technical excellence, culture fit. Candid discussions about past projects.",
            systemDesignFocus: "Systems that support high-performance culture.",
          },
          nvidia: {
            behavioralFramework: "Technical depth, GPU/AI domain passion.",
            technicalFocus: "GPU computing, CUDA, parallel computing, AI/ML, graphics. Computer architecture, performance optimization.",
            systemDesignFocus: "Large-scale ML systems, parallel computing, domain-specific knowledge.",
          },
          openai: {
            behavioralFramework: "Mission-driven, research mindset, safety alignment.",
            technicalFocus: "AI/ML research, LLMs, deep learning, large-scale systems. Research-oriented questions.",
            systemDesignFocus: "Distributed training, ML at scale, cutting-edge systems.",
          },
          mckinsey: {
            behavioralFramework: "Personal Experience Interview: leadership, fit. STAR for leadership stories.",
            isConsulting: true,
            exampleBehavioralQuestions: [
              "Tell me about a time you led a team through a difficult situation.",
              "Describe a situation where you had to influence without authority.",
              "Tell me about your biggest leadership challenge.",
            ],
            technicalFocus: "Case interviews: MECE, hypothesis-driven, structured thinking. Market sizing, profitability.",
            systemDesignFocus: "Case study methodology: break down business problems, quantitative analysis.",
          },
          bcg: {
            behavioralFramework: "Fit interviews, leadership. MECE and hypothesis-driven approach.",
            isConsulting: true,
            exampleBehavioralQuestions: [
              "Tell me about a time you had to persuade a senior stakeholder.",
              "Describe a situation where you had to work with a diverse team.",
              "Tell me about a time you drove impact for a client.",
            ],
            technicalFocus: "Case interviews: structured problem-solving, MECE, data analysis.",
            systemDesignFocus: "Case study methodology, strategy frameworks.",
          },
          deloitte: {
            behavioralFramework: "Group discussion, teamwork, communication. Partner interview for fit.",
            exampleBehavioralQuestions: [
              "Tell me about a time you worked effectively in a team.",
              "Describe a situation where you had to communicate a complex idea simply.",
              "Tell me about a time you demonstrated leadership in a group setting.",
            ],
            technicalFocus: "Domain expertise, analytical skills. Group discussion scenarios.",
          },
          flipkart: {
            technicalFocus: "Machine coding, problem solving, system design. E-commerce scale.",
            systemDesignFocus: "E-commerce scalability, real-world problem solving, Flipkart tech stack.",
          },
          swiggy: {
            technicalFocus: "DSA, machine coding, system design. Food-tech scale.",
            systemDesignFocus: "Real-time system design, food delivery architecture, Swiggy's systems.",
          },
          zomato: {
            technicalFocus: "Real-world problem solving, scalability. Food-tech scenarios.",
            systemDesignFocus: "Food-tech scale, product scenarios.",
          },
          tcs: {
            technicalFocus: "Aptitude, verbal, reasoning. Programming fundamentals, current tech trends.",
          },
          infosys: {
            technicalFocus: "Logical reasoning, pseudo-code, verbal, math. Time management critical.",
          },
          wipro: {
            technicalFocus: "OOP, DSA, DBMS. Aptitude, coding (2 questions, 60 min). Moderate difficulty.",
          },
          jpmorgan: {
            behavioralFramework: "Technical and behavioral mix. Finance knowledge for relevant roles.",
            technicalFocus: "Coding, business/finance scenarios. Super Day format.",
          },
          goldman: {
            behavioralFramework: "HireVue then Super Day. Leadership, teamwork, analytical thinking.",
            technicalFocus: "Technical proficiency, financial knowledge. Research the division.",
          },
        }

        const roleContextMap: Record<string, { name: string; skills: string[]; questionTypes: string[] }> = {
          "software-engineer": {
            name: "Software Engineer",
            skills: ["Data structures & algorithms", "System design", "Coding", "Problem-solving", "Software architecture"],
            questionTypes: ["Coding problems", "System design scenarios", "Debugging", "Code review", "Technical concepts"]
          },
          "frontend-engineer": {
            name: "Frontend Engineer",
            skills: ["JavaScript/TypeScript", "React/Vue/Angular", "CSS/HTML", "Web performance", "Accessibility"],
            questionTypes: ["UI implementation", "State management", "Performance optimization", "Responsive design", "Browser APIs"]
          },
          "backend-engineer": {
            name: "Backend Engineer",
            skills: ["API design", "Database design", "Distributed systems", "Server architecture", "Security"],
            questionTypes: ["API design problems", "Database schema", "Scalability scenarios", "Caching strategies", "Security considerations"]
          },
          "data-engineer": {
            name: "Data Engineer",
            skills: ["ETL pipelines", "Data warehousing", "SQL", "Big data (Spark, Hadoop)", "Data modeling"],
            questionTypes: ["Pipeline design", "Data modeling", "SQL queries", "Performance optimization", "Data quality"]
          },
          "ml-engineer": {
            name: "ML Engineer",
            skills: ["Machine learning", "Deep learning", "Python", "MLOps", "Model deployment"],
            questionTypes: ["ML system design", "Algorithm selection", "Model optimization", "Feature engineering", "Production ML"]
          },
          "devops-engineer": {
            name: "DevOps Engineer",
            skills: ["CI/CD", "Docker/Kubernetes", "Cloud platforms", "Infrastructure as code", "Monitoring"],
            questionTypes: ["Pipeline design", "Infrastructure scenarios", "Incident response", "Automation", "Security"]
          },
          "sre": {
            name: "Site Reliability Engineer",
            skills: ["System design", "Monitoring", "Incident response", "Automation", "Linux/Networking"],
            questionTypes: ["Reliability scenarios", "Incident analysis", "System design", "Capacity planning", "Troubleshooting"]
          },
          "data-scientist": {
            name: "Data Scientist",
            skills: ["Statistics", "Machine learning", "Python/R", "Data visualization", "A/B testing"],
            questionTypes: ["Statistical analysis", "ML modeling", "Experiment design", "Data interpretation", "Business impact"]
          },
          "data-analyst": {
            name: "Data Analyst",
            skills: ["SQL", "Excel", "Data visualization", "Business intelligence", "Statistical analysis"],
            questionTypes: ["SQL problems", "Data interpretation", "Dashboard design", "Metric definition", "Business analysis"]
          },
          "product-manager": {
            name: "Product Manager",
            skills: ["Product strategy", "User research", "Data analysis", "Prioritization", "Communication"],
            questionTypes: ["Product design", "Prioritization frameworks", "Metrics & KPIs", "User problems", "Go-to-market"]
          },
          "business-analyst": {
            name: "Business Analyst",
            skills: ["Requirements gathering", "Process modeling", "Data analysis", "Documentation", "Stakeholder management"],
            questionTypes: ["Requirements scenarios", "Process improvement", "Data analysis", "Documentation", "Communication"]
          },
          "consultant": {
            name: "Management Consultant",
            skills: ["Problem-solving", "Communication", "Data analysis", "Strategy", "Presentation"],
            questionTypes: ["Case studies", "Market sizing", "Profitability analysis", "Strategy frameworks", "Stakeholder management"]
          },
          "quant": {
            name: "Quantitative Analyst",
            skills: ["Mathematics", "Statistics", "Programming", "Financial modeling", "Probability"],
            questionTypes: ["Probability puzzles", "Mathematical problems", "Coding challenges", "Financial scenarios", "Statistical analysis"]
          },
          "investment-banker": {
            name: "Investment Banker",
            skills: ["Financial modeling", "Valuation", "M&A", "Excel", "Accounting"],
            questionTypes: ["Valuation methods", "M&A scenarios", "Financial analysis", "Deal structuring", "Market knowledge"]
          },
          "analyst": {
            name: "Financial Analyst",
            skills: ["Financial analysis", "Excel", "Valuation", "Research", "Presentation"],
            questionTypes: ["Financial modeling", "Company analysis", "Market research", "Presentation", "Excel skills"]
          }
        }

        // Handle company-based interviews
        if (isCompanyInterview) {
          const company = companyContextMap[companyId] || { name: companyId, culture: "Professional", interviewStyle: "Standard interview format", focusAreas: ["Technical skills", "Problem-solving", "Communication"] }
          const specific = companySpecificFrameworks[companyId]
          const interviewDetails = companyInterviewDetails[companyId] || []
          const detailsBlock = interviewDetails.length > 0
            ? `\n\n${company.name} INTERVIEW SPECIFICS (use these):\n${interviewDetails.map((d, i) => `${i + 1}. ${d}`).join("\n")}`
            : ""

          if (questionNumber === 1) {
            const introLine = interviewerName
              ? `Your name is ${interviewerName}. Introduce yourself as ${interviewerName} - an interviewer at ${company.name}. Example: "Hi, I'm ${interviewerName}. I'll be interviewing you today for ${company.name}. Can you tell me about your background and experience?"`
              : `Introduce yourself briefly as an interviewer at ${company.name}. Example: "Hi, I'll be interviewing you today for ${company.name}. Can you tell me about your background and experience?"`
            interviewContext = `You are conducting an interview at ${company.name}.

CRITICAL: ${introLine} Do NOT invent fake names (like Alex, John) or pretend to be a specific role (e.g. "software engineer at ${company.name}").

Use SIMPLE, everyday English - no fancy or formal words. No corny phrases.`
          } else if (roleId) {
            // Company + Role specific interview - combine role with company-specific frameworks
            const role = roleContextMap[roleId] || { name: roleId, skills: ["Technical skills"], questionTypes: ["Technical questions"] }
            const roleSpecificBlock = specific
              ? `\n\n${company.name}-SPECIFIC CONTEXT (apply to this ${role.name} interview):\n${specific.behavioralFramework ? `Behavioral: ${specific.behavioralFramework}\n` : ""}${specific.technicalFocus ? `Technical: ${specific.technicalFocus}\n` : ""}${specific.systemDesignFocus ? `System Design: ${specific.systemDesignFocus}` : ""}`
              : ""
            interviewContext = `Conduct a ${role.name} interview at ${company.name}. Use SIMPLE, everyday English - no fancy or formal words. No corny phrases.

ROLE: ${role.name}
SKILLS: ${role.skills.join(", ")}
QUESTION TYPES: ${role.questionTypes.join(", ")}${roleSpecificBlock}${detailsBlock}

Ask questions that feel AUTHENTIC to ${company.name} - use their frameworks and interview style. Build on previous answers. Keep it casual and natural.

DIFFICULTY: ${difficulty}
Previous questions (avoid repetition):
${previousAnswers.map((qa: any, idx: number) => `${idx + 1}. ${qa.question}`).join("\n")}`
          } else {
            // Company + Type interview - use company-specific frameworks when available
            const behavioralBlock = specific?.behavioralFramework
              ? `CRITICAL - ${company.name} BEHAVIORAL FRAMEWORK:\n${specific.behavioralFramework}\n\nExample question types (adapt, don't copy):\n${(specific.exampleBehavioralQuestions || []).map((q, i) => `${i + 1}. ${q}`).join("\n")}`
              : `Focus on: Past experiences, challenges, teamwork, leadership, alignment with ${company.name}'s values.`
            const technicalBlock = specific?.technicalFocus
              ? `CRITICAL - ${company.name} TECHNICAL FOCUS:\n${specific.technicalFocus}`
              : `Coding, algorithms, technical problem-solving, system design, best practices.`
            const systemDesignBlock = specific?.systemDesignFocus
              ? `CRITICAL - ${company.name} SYSTEM DESIGN FOCUS:\n${specific.systemDesignFocus}`
              : `Large-scale architecture, scalability, trade-offs, distributed systems.`
            const consultingCaseBlock = specific?.isConsulting
              ? `\n\nCONSULTING FORMAT: Use case interview style. Present business problems. Expect MECE, hypothesis-driven thinking, quantitative analysis. For behavioral, use STAR and leadership stories.`
              : ""

            const typeContexts: Record<string, string> = {
              warmup: `You are conducting a WARM UP / INTRO round at ${company.name}.

Focus on:
- Brief introductions
- Ice-breaker questions
- Light conversation about background and interest in ${company.name}
- Keep it casual and friendly - this is NOT a technical round`,
              technical: `You are conducting a TECHNICAL interview at ${company.name}.

${technicalBlock}

Ask ONE clear technical question. Be specific to ${company.name}'s domain and interview style.`,
              behavioral: `You are conducting a BEHAVIORAL interview at ${company.name}.

${behavioralBlock}

Ask ONE behavioral question. Require specific examples (STAR when relevant). Make it feel like a real ${company.name} interview.`,
              "system-design": `You are conducting a SYSTEM DESIGN interview at ${company.name}.

${systemDesignBlock}

Present ONE system design scenario. Make it relevant to ${company.name}'s scale and domain.`,
              hr: `You are conducting an HR interview at ${company.name}.

Focus on:
- Career goals and motivations
- Cultural fit with ${company.name}
- Salary expectations (if appropriate)
- Work style and preferences
- Questions about ${company.name}`
            }

            const fullContext = `You are conducting a COMPREHENSIVE interview at ${company.name}.

Rotate through: Technical (${technicalBlock}), Behavioral (${behavioralBlock}), Culture fit.
Test the candidate across multiple dimensions.${consultingCaseBlock}`

            typeContexts.full = fullContext

            interviewContext = `${typeContexts[companyType] || typeContexts.full}

🏢 COMPANY: ${company.name}
COMPANY CULTURE: ${company.culture}
INTERVIEW STYLE: ${company.interviewStyle}

COMPANY FOCUS AREAS:
${company.focusAreas.map((f, i) => `${i + 1}. ${f}`).join("\n")}${detailsBlock}

YOUR QUESTIONS MUST:
1. Feel AUTHENTIC to ${company.name} - use their frameworks, values, and interview style
2. Be SPECIFIC - not generic interview questions
3. Build naturally on previous answers
4. Ask ONE question at a time

DIFFICULTY: ${difficulty}
Previous questions (avoid repetition):
${previousAnswers.map((qa: any, idx: number) => `${idx + 1}. ${qa.question}`).join("\n")}`
          }
        }
        // Handle role-based interviews
        else if (isRoleInterview) {
          const role = roleContextMap[roleId] || { name: roleId, skills: ["Technical skills"], questionTypes: ["Technical questions"] }
          
          if (questionNumber === 1) {
            const introLine = interviewerName
              ? `Introduce yourself as ${interviewerName}. Example: "Hi, I'm ${interviewerName}. Thanks for joining me today for this ${role.name} interview. Could you please introduce yourself and tell me what draws you to this role?"`
              : `Introduce yourself briefly. Example: "Hi, thanks for joining me today for this ${role.name} interview. Could you please introduce yourself and tell me what draws you to this role?"`
            interviewContext = `You are conducting a ${role.name} interview.

CRITICAL: ${introLine} Do NOT invent fake names or roles.

Keep it warm, professional, and conversational.`
          } else {
            const typeContexts: Record<string, string> = {
              coding: `CODING ROUND for ${role.name}: Generate a programming problem the candidate will implement. Use the Problem/Example/Constraints format.`,
              technical: `Focus on TECHNICAL aspects of ${role.name}:
- Technical skills assessment
- Problem-solving abilities
- Coding/implementation (if relevant)
- Best practices and optimization`,
              behavioral: `Focus on BEHAVIORAL aspects for ${role.name}:
- Past experiences and achievements
- How they handle challenges
- Teamwork and collaboration
- Role-specific scenarios`,
              "case-study": `Present CASE STUDIES relevant to ${role.name}:
- Real-world problem scenarios
- Strategic thinking
- Decision-making process
- Analysis and recommendations`,
              domain: `Test DOMAIN KNOWLEDGE for ${role.name}:
- Industry-specific knowledge
- Role-specific expertise
- Current trends and best practices
- Practical applications`,
              full: `COMPREHENSIVE ${role.name} interview covering all aspects:
- Technical skills and knowledge
- Behavioral and situational questions
- Case studies and problem-solving
- Domain expertise

Rotate through different question types.`
            }

            interviewContext = `You are conducting a ${role.name} interview.
${typeContexts[roleType] || typeContexts.full}

👤 ROLE: ${role.name}

KEY SKILLS BEING ASSESSED:
${role.skills.map((s, i) => `${i + 1}. ${s}`).join('\n')}

QUESTION TYPES TO USE:
${role.questionTypes.map((t, i) => `${i + 1}. ${t}`).join('\n')}

YOUR QUESTIONS MUST:
1. Test skills directly relevant to ${role.name}
2. Be practical and scenario-based
3. Assess both technical and soft skills
4. Build naturally on previous answers

DIFFICULTY: ${difficulty}
Previous questions (avoid repetition):
${previousAnswers.map((qa: any, idx: number) => `${idx + 1}. ${qa.question}`).join("\n")}`
          }
        }
        // First question should be an introduction (skip for aptitude, coding, and other interviews - they have their own context)
        else if (questionNumber === 1 && !isAptitude && !isCodingInterview && !isOtherInterview) {
          const introLine = interviewerName
            ? `Brief intro as ${interviewerName} (e.g., "Hi, I'm ${interviewerName}. I'll be interviewing you today.")`
            : `Brief intro (e.g., "Hi, I'll be interviewing you today.")`
          interviewContext = `You are an interviewer.${interviewerName ? ` Your name is ${interviewerName}.` : ""} Use SIMPLE, everyday English. No fancy words, no formal/corny language.\n\nSTART THE INTERVIEW:\n1. ${introLine}\n2. Ask them to introduce themselves\n\nDo NOT invent fake names or roles. Use normal, simple English.`
        } else {
          let courseContext = ""

          if (isDSAInterview) {
            // DSA Topics - EXACTLY matching lib/courses.ts info descriptions
            const dsaTopics: Record<string, { description: string; examples: string[] }> = {
              arrays: {
                description: "Arrays & Strings - array manipulation, string algorithms, and two-pointer techniques",
                examples: [
                  "Two-pointer problems (finding pairs, removing duplicates)",
                  "Sliding window (max sum subarray, longest substring)",
                  "Prefix sums and cumulative arrays",
                  "String manipulation (reversal, rotation, matching)",
                  "In-place array modifications",
                  "Kadane's algorithm variations"
                ]
              },
              linked: {
                description: "Linked Lists - traversal, reversal, and cycle detection",
                examples: [
                  "Reverse a linked list (iterative/recursive)",
                  "Detect cycle using Floyd's algorithm",
                  "Find middle element using fast-slow pointers",
                  "Merge two sorted linked lists",
                  "Remove nth node from end",
                  "Intersection of two linked lists"
                ]
              },
              linkedlists: {
                description: "Linked Lists - traversal, reversal, and cycle detection",
                examples: [
                  "Reverse a linked list (iterative/recursive)",
                  "Detect cycle using Floyd's algorithm",
                  "Find middle element using fast-slow pointers",
                  "Merge two sorted linked lists",
                  "Remove nth node from end",
                  "Intersection of two linked lists"
                ]
              },
              trees: {
                description: "Trees & Graphs - tree traversals, BST operations, and graph algorithms",
                examples: [
                  "Tree traversals (inorder, preorder, postorder, level-order)",
                  "BST operations (insert, delete, search, validate)",
                  "Graph BFS and DFS traversals",
                  "Lowest common ancestor",
                  "Path sum problems",
                  "Topological sort",
                  "Detect cycle in graph"
                ]
              },
              sorting: {
                description: "Sorting & Searching - quicksort, mergesort, binary search, and variations",
                examples: [
                  "Implement quicksort or mergesort",
                  "Binary search variations (first/last occurrence)",
                  "Search in rotated sorted array",
                  "Kth largest/smallest element",
                  "Merge intervals",
                  "Sort colors (Dutch National Flag)"
                ]
              },
              dynamic: {
                description: "Dynamic Programming - optimization problems with memoization and tabulation",
                examples: [
                  "Fibonacci with memoization/tabulation",
                  "Knapsack problem (0/1, unbounded)",
                  "Longest Common Subsequence (LCS)",
                  "Longest Increasing Subsequence (LIS)",
                  "Coin change problem",
                  "Edit distance",
                  "Maximum subarray (Kadane's)"
                ]
              },
              advanced: {
                description: "Advanced Algorithms - greedy algorithms, backtracking, and complex patterns",
                examples: [
                  "Backtracking (N-Queens, Sudoku solver, permutations)",
                  "Greedy algorithms (activity selection, Huffman coding)",
                  "Bit manipulation (single number, counting bits)",
                  "Trie operations",
                  "Union-Find/Disjoint Set",
                  "Segment trees basics"
                ]
              },
              "stacks-queues": {
                description: "Stacks & Queues - LIFO/FIFO structures, monotonic stacks, and queue variations",
                examples: [
                  "Implement stack using queues (and vice versa)",
                  "Valid parentheses and bracket matching",
                  "Next greater element using monotonic stack",
                  "Min stack (get minimum in O(1))",
                  "Sliding window maximum using deque",
                  "Evaluate reverse polish notation",
                  "Implement circular queue",
                  "LRU Cache implementation"
                ]
              }
            }

            // Handle "full" DSA interview - covers ALL topics
            if (courseSubject === 'full') {
              const allExamples: string[] = []
              const allDescriptions: string[] = []
              
              Object.entries(dsaTopics).forEach(([key, value]) => {
                allDescriptions.push(`• ${value.description}`)
                allExamples.push(...value.examples)
              })

              interviewContext = `🎯 FULL DSA CODING INTERVIEW

YOU ARE GENERATING A CODING PROBLEM, NOT A CONVERSATIONAL QUESTION.

This is a COMPREHENSIVE DSA interview covering ALL data structures and algorithms topics.

COVERED TOPICS:
${allDescriptions.join('\n')}

ALL PROBLEM TYPES (rotate through these):
${allExamples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}

CRITICAL INSTRUCTIONS:
1. ROTATE through DIFFERENT DSA topics (arrays, linked lists, trees, DP, etc.)
2. Don't focus on just one data structure - vary across all topics
3. Generate ONE unique coding problem
4. Return ONLY the problem statement in this format:

**Problem:** [Clear problem statement]
**Input:** [Input format and constraints]
**Output:** [Expected output format]
**Example:**
Input: [example input]
Output: [example output]

DIFFICULTY LEVEL: ${difficulty}
- Beginner: Basic operations, straightforward implementation
- Intermediate: Standard algorithms, one key technique
- Pro/Advanced: Optimization required, multiple techniques combined

Previous problems asked: ${allPreviousQuestionTexts.map((q) => q.substring(0, 100)).join(" | ")}

CRITICAL - DIFFERENT PROBLEM TYPE: Each previous question is a different problem type (e.g. two pointers, sliding window, prefix sum). Your next MUST be a DIFFERENT type from the valid list above. Same type with different inputs = FORBIDDEN. Keep difficulty: ${difficulty}. Generate standard, realistic interview problems.`
            } else {
              const topicData = dsaTopics[courseSubject] || { description: "Data Structures and Algorithms", examples: [] }
              const topicDescription = topicData.description
              const topicExamples = topicData.examples

              // SET interviewContext for DSA
              interviewContext = `🎯 DSA CODING PROBLEM - ${courseSubject.toUpperCase()}

YOU ARE GENERATING A CODING PROBLEM, NOT AN INTERVIEW QUESTION.

TOPIC: ${topicDescription}

VALID PROBLEM TYPES FOR THIS TOPIC:
${topicExamples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}

⚠️ CRITICAL RESTRICTION: The problem MUST be ONLY about ${topicDescription}.
ONLY generate problems from the VALID PROBLEM TYPES listed above.

DO NOT generate problems about:
- Topics from other DSA categories
- Palindromes (unless it's specifically a string algorithm problem in arrays topic)
- Problems that don't use ${courseSubject} concepts
- Generic math or logic puzzles

PROBLEM FORMAT:
**Problem:** [Clear description - MUST be one of the valid problem types above]

**Example:**
Input: [sample input]
Output: [expected output]
Explanation: [why this output is correct]

**Constraints:**
- [Time complexity expectation]
- [Space complexity expectation]
- [Any input constraints]

DIFFICULTY LEVEL: ${difficulty}
- Beginner: Basic ${courseSubject} operations, straightforward implementation
- Intermediate: Standard ${courseSubject} algorithms, one key technique
- Pro: Optimization required, multiple techniques combined
- Advanced: Complex edge cases, optimal solutions required

Previous problems asked: ${allPreviousQuestionTexts.map((q) => q.substring(0, 100)).join(" | ")}

CRITICAL - DIFFERENT PROBLEM TYPE: Each previous question uses a different technique (e.g. two pointers, sliding window). Your next MUST be a DIFFERENT type from the valid list above. Same type with different inputs = FORBIDDEN. Keep difficulty: ${difficulty}. Generate standard, realistic problems.`
            }
          } else if (isAptitude) {
            // Aptitude Topics - EXACTLY matching lib/courses.ts info descriptions
            const aptitudeTopics: Record<string, { description: string; examples: string[] }> = {
              quantitative: {
                description: "Quantitative Aptitude - arithmetic, algebra, geometry, and number problems",
                examples: [
                  "Percentage calculations (discounts, increases, decreases)",
                  "Profit and Loss problems",
                  "Time, Speed, and Distance",
                  "Work and Time (pipes, cisterns)",
                  "Ratios and Proportions",
                  "Simple and Compound Interest",
                  "Averages and Mixtures",
                  "Algebra (equations, inequalities)",
                  "Geometry (areas, volumes, angles)",
                  "Number series and sequences"
                ]
              },
              quant: {
                description: "Quantitative Aptitude - arithmetic, algebra, geometry, and number problems",
                examples: [
                  "Percentage calculations",
                  "Profit and Loss",
                  "Time, Speed, Distance",
                  "Ratios and Proportions",
                  "Algebra and Geometry"
                ]
              },
              logical: {
                description: "Logical Reasoning - puzzles, pattern recognition, and analytical problems",
                examples: [
                  "Number series (find the next number)",
                  "Letter series (find the pattern)",
                  "Syllogisms (All A are B, Some B are C...)",
                  "Blood relations (A is B's mother's son...)",
                  "Direction sense (walked north, turned left...)",
                  "Seating arrangements (circular, linear)",
                  "Coding-decoding (if CAT = XZG, then DOG = ?)",
                  "Ranking and ordering",
                  "Puzzles (who sits where, who does what)"
                ]
              },
              "logical-reasoning": {
                description: "Logical Reasoning - puzzles, pattern recognition, and analytical problems",
                examples: [
                  "Number/letter series",
                  "Syllogisms",
                  "Blood relations",
                  "Direction sense",
                  "Seating arrangements",
                  "Coding-decoding"
                ]
              },
              verbal: {
                description: "Verbal Reasoning - comprehension, vocabulary, and language skills",
                examples: [
                  "Reading comprehension (passage + questions)",
                  "Sentence correction / Error spotting",
                  "Fill in the blanks (grammar/vocabulary)",
                  "Synonyms and Antonyms",
                  "Para jumbles (arrange sentences)",
                  "One word substitution",
                  "Idioms and phrases",
                  "Sentence completion",
                  "Cloze test passages"
                ]
              },
              "verbal-reasoning": {
                description: "Verbal Reasoning - comprehension, vocabulary, and language skills",
                examples: [
                  "Reading comprehension",
                  "Sentence correction",
                  "Synonyms/Antonyms",
                  "Para jumbles",
                  "Fill in the blanks"
                ]
              },
              "data-interpretation": {
                description: "Data Interpretation - analyzing charts, graphs, and tables for data-driven questions",
                examples: [
                  "Bar graph analysis (compare values, find percentages)",
                  "Pie chart problems (calculate sectors, ratios)",
                  "Line graph interpretation (trends, growth rates)",
                  "Table data analysis (find averages, totals)",
                  "Mixed charts (multiple data sources)",
                  "Data sufficiency (is the data enough to answer?)",
                  "Caselet-based questions (text + data)"
                ]
              },
              di: {
                description: "Data Interpretation - analyzing charts, graphs, and tables",
                examples: [
                  "Bar graphs",
                  "Pie charts",
                  "Line graphs",
                  "Tables",
                  "Data sufficiency"
                ]
              },
              analytical: {
                description: "Analytical Reasoning - complex logic problems and critical thinking questions",
                examples: [
                  "Statement and Assumptions",
                  "Statement and Conclusions",
                  "Statement and Arguments",
                  "Cause and Effect",
                  "Course of Action",
                  "Critical reasoning passages",
                  "Strengthening/Weakening arguments",
                  "Inference-based questions",
                  "Assertion and Reason"
                ]
              },
              "analytical-reasoning": {
                description: "Analytical Reasoning - complex logic problems and critical thinking",
                examples: [
                  "Statement-Assumptions",
                  "Statement-Conclusions",
                  "Cause and Effect",
                  "Critical reasoning"
                ]
              },
              "speed-accuracy": {
                description: "Speed & Accuracy - time-bound calculations and quick problem-solving",
                examples: [
                  "Quick mental math (addition, subtraction, multiplication)",
                  "Approximation problems",
                  "Simplification (BODMAS)",
                  "Number comparisons",
                  "Percentage shortcuts",
                  "Square roots and cubes",
                  "Decimal and fraction conversions",
                  "Quick calculations under time pressure"
                ]
              },
              "pseudo-code": {
                description: "Pseudo Code - analyze and trace pseudo code logic, predict outputs, and debug algorithms",
                examples: [
                  "Trace loop execution and predict output",
                  "Find the output of nested loops",
                  "Identify errors in pseudo code logic",
                  "Determine variable values after execution",
                  "Analyze recursive function calls",
                  "Predict array/string manipulation results",
                  "Debug conditional statement logic",
                  "Trace function calls and return values",
                  "Analyze sorting/searching algorithm steps",
                  "Predict output of bitwise operations"
                ]
              }
            }

            // Handle "full" Aptitude interview - covers ALL topics
            if (courseSubject === 'full') {
              const allExamples: string[] = []
              const allDescriptions: string[] = []
              
              Object.entries(aptitudeTopics).forEach(([key, value]) => {
                allDescriptions.push(`• ${value.description}`)
                allExamples.push(...value.examples)
              })

              interviewContext = `🎯 FULL APTITUDE TEST

YOU ARE GENERATING AN APTITUDE QUESTION, NOT A CODING PROBLEM.

This is a COMPREHENSIVE aptitude test covering ALL reasoning and quantitative topics.

COVERED TOPICS:
${allDescriptions.join('\n')}

ALL QUESTION TYPES (rotate through these):
${allExamples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}

⚠️ CRITICAL INSTRUCTIONS:
1. ROTATE through DIFFERENT aptitude topics (quantitative, logical, verbal, etc.)
2. Don't focus on just one category - vary across all topics
3. DO NOT generate coding/programming problems
4. DO NOT generate DSA problems
5. Include all necessary data in the problem itself

REQUIREMENTS:
1. Generate ONE clear aptitude problem from a DIFFERENT category than previous questions
2. Keep it concise (1-4 sentences)
3. Difficulty: ${difficulty.toUpperCase()}

FORMAT:
[Problem Statement with all necessary data]

Previous problems asked: ${allPreviousQuestionTexts.map((q) => q.substring(0, 100)).join(" | ")}

CRITICAL - DIFFERENT QUESTION TYPE: Each previous question is a different type (e.g. Profit & Loss, Time-Speed-Distance, Ratios). Your next MUST be from a DIFFERENT type. Same type with only different numbers = FORBIDDEN. Keep difficulty: ${difficulty}. Generate standard, realistic aptitude problems.`
            } else {
              const topicData = aptitudeTopics[courseSubject] || { description: "General Aptitude", examples: [] }
              const topicDescription = topicData.description
              const topicExamples = topicData.examples

              // SET interviewContext for Aptitude
              interviewContext = `🎯 APTITUDE PROBLEM - ${courseSubject.toUpperCase()}

YOU ARE GENERATING AN APTITUDE QUESTION, NOT A CODING PROBLEM.

TOPIC: ${topicDescription}

VALID QUESTION TYPES FOR THIS TOPIC:
${topicExamples.map((ex, i) => `${i + 1}. ${ex}`).join('\n')}

⚠️ CRITICAL RESTRICTION: 
- The question MUST be from the VALID QUESTION TYPES listed above
- DO NOT generate coding/programming problems
- DO NOT generate DSA problems
- DO NOT generate questions from other aptitude categories

REQUIREMENTS:
1. Generate ONE clear aptitude problem from the valid types above
2. Include all necessary data in the problem itself
3. No hints or solutions
4. Difficulty: ${difficulty.toUpperCase()}

FORMAT:
[Problem Statement with all necessary data]

${courseSubject === 'verbal' || courseSubject === 'verbal-reasoning' ? `
REMEMBER: This is VERBAL reasoning - focus on language, grammar, vocabulary, comprehension.
Example formats:
- "Choose the correct word: The project was _____ (accepted/excepted) by the committee."
- "Find the error: 'He don't know the answer.' - identify and correct"
- Short passage followed by comprehension question
` : ''}
${courseSubject === 'logical' || courseSubject === 'logical-reasoning' ? `
REMEMBER: This is LOGICAL reasoning - focus on patterns, deductions, arrangements.
Example formats:
- "Find the next number: 2, 6, 12, 20, 30, ?"
- "If A is B's brother and C is A's mother, how is B related to C?"
- "5 people sit in a row. A sits next to B but not C..."
` : ''}
${courseSubject === 'quantitative' || courseSubject === 'quant' ? `
REMEMBER: This is QUANTITATIVE aptitude - focus on math, calculations, formulas.
Example formats:
- "A shopkeeper sells an item at 20% profit. If cost price is Rs. 500, find selling price."
- "A train travels 300km in 5 hours. Find its speed in m/s."
- "Find the area of a triangle with base 10cm and height 8cm."
` : ''}
${courseSubject === 'data-interpretation' || courseSubject === 'di' ? `
REMEMBER: This is DATA INTERPRETATION - you MUST include data (table/chart description).
Example format:
"The following table shows sales (in lakhs) for 5 products:
Product A: 120, Product B: 85, Product C: 150, Product D: 95, Product E: 110
Question: What is the percentage contribution of Product C to total sales?"
` : ''}
${courseSubject === 'analytical' || courseSubject === 'analytical-reasoning' ? `
REMEMBER: This is ANALYTICAL reasoning - focus on critical thinking, arguments, conclusions.
Example formats:
- "Statement: All successful people wake up early. Conclusion: Waking up early guarantees success. Is the conclusion valid?"
- "Statement: The company's profits have declined. Assumption: The company had profits before. Is this assumption implicit?"
` : ''}
${courseSubject === 'speed-accuracy' ? `
REMEMBER: This is SPEED & ACCURACY - focus on quick calculations.
Example formats:
- "Calculate quickly: 17 × 23 = ?"
- "Approximate: 4987 ÷ 51 ≈ ?"
- "Simplify: (25 × 16) ÷ (5 × 4) = ?"
` : ''}

Previous problems asked: ${allPreviousQuestionTexts.map((q) => q.substring(0, 100)).join(" | ")}

CRITICAL - DIFFERENT QUESTION TYPE: Each previous question is a different type (e.g. Profit & Loss, Time-Speed-Distance, Ratios). Your next MUST be from a DIFFERENT type. Same type with only different numbers = FORBIDDEN. Keep difficulty: ${difficulty}. Generate standard, realistic aptitude problems.`
            }
          } else if (courseName && courseSubject) {
            // Course interview - either full course or specific subcourse
            const courseMap: Record<string, Record<string, { description: string; topics: string[] }>> = {
              frontend: {
                react: {
                  description: "React - Build interactive UIs with React hooks and components",
                  topics: ["Hooks (useState, useEffect, useContext, useMemo, useCallback)", "Component lifecycle", "State management", "Context API", "Virtual DOM", "JSX", "Performance optimization", "React Router"]
                },
                vue: {
                  description: "Vue.js - Create reactive applications with Vue's composition API",
                  topics: ["Composition API", "Reactivity system", "Vue Router", "Vuex/Pinia", "Components", "Directives", "Lifecycle hooks", "Computed properties"]
                },
                angular: {
                  description: "Angular - Develop enterprise apps with TypeScript and RxJS",
                  topics: ["TypeScript", "RxJS observables", "Dependency injection", "Services", "Modules", "Components", "Directives", "Angular CLI", "Forms (reactive/template)"]
                },
                nextjs: {
                  description: "Next.js - Master server-side rendering and static site generation",
                  topics: ["SSR (Server-Side Rendering)", "SSG (Static Site Generation)", "ISR (Incremental Static Regeneration)", "API routes", "App Router", "Middleware", "Image optimization", "Data fetching"]
                },
                typescript: {
                  description: "TypeScript - Write type-safe JavaScript for scalable applications",
                  topics: ["Type annotations", "Interfaces", "Generics", "Type guards", "Utility types", "Enums", "Decorators", "Type inference", "Strict mode"]
                },
                tailwind: {
                  description: "Tailwind CSS - Design modern UIs with utility-first CSS framework",
                  topics: ["Utility classes", "Responsive design", "Custom configurations", "Plugins", "JIT mode", "Component patterns", "Dark mode", "Animations"]
                }
              },
              backend: {
                nodejs: {
                  description: "Node.js - Build scalable server applications with JavaScript runtime",
                  topics: ["Express.js", "Middleware", "RESTful APIs", "Authentication (JWT, OAuth)", "Database integration", "Async patterns", "Streams", "Clustering", "Error handling"]
                },
                python: {
                  description: "Python - Create robust backends with Django and Flask frameworks",
                  topics: ["Django/Flask", "REST APIs", "ORM (SQLAlchemy, Django ORM)", "Authentication", "Middleware", "Deployment", "Celery (async tasks)", "Testing"]
                },
                java: {
                  description: "Java - Develop enterprise applications with Spring Boot",
                  topics: ["Spring Boot", "REST APIs", "JPA/Hibernate", "Dependency injection", "Microservices", "Security (Spring Security)", "Testing", "Maven/Gradle"]
                },
                go: {
                  description: "Go - Build high-performance concurrent services",
                  topics: ["Goroutines", "Channels", "HTTP servers", "Concurrency patterns", "Database access", "Microservices", "Error handling", "Testing"]
                },
                dotnet: {
                  description: ".NET - Create modern applications with ASP.NET Core",
                  topics: ["ASP.NET Core", "Entity Framework", "Web APIs", "Dependency injection", "Middleware", "Authentication", "SignalR", "Blazor"]
                },
                rust: {
                  description: "Rust - Write memory-safe systems programming code",
                  topics: ["Ownership", "Borrowing", "Lifetimes", "Async runtime (Tokio)", "Actix/Axum", "Error handling", "Memory safety", "Performance optimization"]
                }
              },
              fullstack: {
                mern: {
                  description: "MERN Stack - MongoDB, Express, React, and Node.js ecosystem",
                  topics: ["MongoDB (queries, aggregation)", "Express.js", "React", "Node.js", "RESTful APIs", "State management", "Authentication", "Deployment"]
                },
                mean: {
                  description: "MEAN Stack - Build Angular applications with Node.js backend",
                  topics: ["MongoDB", "Express.js", "Angular", "Node.js", "TypeScript", "RxJS", "Authentication", "Full-stack architecture"]
                },
                lamp: {
                  description: "LAMP Stack - Traditional web development with Linux, Apache, MySQL, PHP",
                  topics: ["Linux server", "Apache configuration", "MySQL", "PHP", "MVC patterns", "Database design", "Security", "Deployment"]
                },
                jamstack: {
                  description: "JAMstack - Modern web architecture with JavaScript, APIs, and Markup",
                  topics: ["Static site generators (Gatsby, Hugo)", "Headless CMS", "Serverless functions", "CDN deployment", "APIs", "Pre-rendering", "Performance"]
                },
                serverless: {
                  description: "Serverless - Build scalable apps without managing infrastructure",
                  topics: ["AWS Lambda", "Azure Functions", "Event-driven design", "Cold starts", "Function composition", "API Gateway", "DynamoDB", "Cost optimization"]
                },
                microservices: {
                  description: "Microservices - Design distributed systems with service architecture",
                  topics: ["Service decomposition", "API design", "Inter-service communication", "Event sourcing", "CQRS", "Service mesh", "Containerization", "Monitoring"]
                }
              },
              datascience: {
                "python-ds": {
                  description: "Python for DS - Master NumPy, Pandas, and data visualization libraries",
                  topics: ["NumPy arrays", "Pandas DataFrames", "Data manipulation", "Data cleaning", "Exploratory data analysis", "Matplotlib", "Seaborn", "Jupyter notebooks"]
                },
                ml: {
                  description: "Machine Learning - Build predictive models with scikit-learn and algorithms",
                  topics: ["Supervised learning", "Unsupervised learning", "scikit-learn", "Model training", "Cross-validation", "Feature engineering", "Hyperparameter tuning", "Model evaluation"]
                },
                deeplearning: {
                  description: "Deep Learning - Create neural networks with TensorFlow and PyTorch",
                  topics: ["Neural networks", "TensorFlow", "PyTorch", "CNNs", "RNNs", "Transformers", "Model optimization", "GPU training", "Transfer learning"]
                },
                nlp: {
                  description: "NLP - Process and analyze natural language data",
                  topics: ["Text preprocessing", "Tokenization", "Word embeddings", "Sentiment analysis", "Named entity recognition", "Transformers (BERT, GPT)", "Text classification"]
                },
                sql: {
                  description: "SQL & Databases - Query and manage relational database systems",
                  topics: ["Complex queries", "JOINs", "Window functions", "Indexing", "Query optimization", "Database design", "Stored procedures", "Transactions"]
                },
                analytics: {
                  description: "Data Analytics - Extract insights from data with statistical analysis",
                  topics: ["Statistical analysis", "Hypothesis testing", "A/B testing", "Data visualization", "Business intelligence", "Reporting", "KPIs", "Dashboards"]
                }
              },
              devops: {
                docker: {
                  description: "Docker - Containerize applications for consistent deployment",
                  topics: ["Containers", "Images", "Dockerfile", "Docker Compose", "Networking", "Volumes", "Multi-stage builds", "Best practices"]
                },
                kubernetes: {
                  description: "Kubernetes - Orchestrate and manage containerized workloads",
                  topics: ["Pods", "Services", "Deployments", "ConfigMaps", "Secrets", "Scaling", "Helm", "Monitoring", "Ingress"]
                },
                aws: {
                  description: "AWS - Deploy scalable cloud infrastructure on Amazon Web Services",
                  topics: ["EC2", "S3", "Lambda", "RDS", "CloudFormation", "IAM", "VPC", "Architecture design", "Cost optimization"]
                },
                gcp: {
                  description: "Google Cloud - Build applications on Google Cloud Platform",
                  topics: ["Compute Engine", "Cloud Functions", "BigQuery", "Cloud Storage", "Kubernetes Engine", "IAM", "Cloud Run", "Pub/Sub"]
                },
                azure: {
                  description: "Azure - Create enterprise solutions with Microsoft Azure",
                  topics: ["Virtual Machines", "App Service", "Azure Functions", "Cosmos DB", "Azure DevOps", "Active Directory", "Storage", "Networking"]
                },
                cicd: {
                  description: "CI/CD Pipelines - Automate testing and deployment workflows",
                  topics: ["Pipeline design", "Automated testing", "Deployment strategies", "GitOps", "Jenkins", "GitHub Actions", "GitLab CI", "ArgoCD"]
                }
              },
              mobile: {
                reactnative: {
                  description: "React Native - Build cross-platform apps with React for mobile",
                  topics: ["React Native components", "Navigation", "State management", "Native modules", "Expo", "Platform-specific code", "Performance", "Debugging"]
                },
                flutter: {
                  description: "Flutter - Create beautiful native apps with Dart framework",
                  topics: ["Widgets", "State management (Provider, Riverpod, Bloc)", "Dart language", "Animations", "Platform integration", "Navigation", "Testing"]
                },
                swift: {
                  description: "Swift (iOS) - Develop native iOS applications with Swift",
                  topics: ["Swift language", "UIKit", "SwiftUI", "Core Data", "Networking", "App lifecycle", "Auto Layout", "App Store guidelines"]
                },
                kotlin: {
                  description: "Kotlin (Android) - Build modern Android apps with Kotlin language",
                  topics: ["Kotlin language", "Jetpack Compose", "Activities", "Fragments", "Room database", "MVVM", "Coroutines", "Navigation"]
                },
                xamarin: {
                  description: "Xamarin - Create cross-platform apps with C# and .NET",
                  topics: ["C#", ".NET", "XAML", "Xamarin.Forms", "Native API access", "MVVM", "Platform-specific code", "Testing"]
                },
                ionic: {
                  description: "Ionic - Build hybrid mobile apps with web technologies",
                  topics: ["Angular/React/Vue integration", "Capacitor", "Hybrid apps", "Web technologies", "Native plugins", "PWA", "Theming", "Performance"]
                }
              },
              productmgmt: {
                strategy: {
                  description: "Product Strategy - Define vision, goals, and product roadmaps",
                  topics: ["Vision setting", "Market analysis", "Competitive positioning", "Product-market fit", "Roadmap prioritization", "OKRs", "Go-to-market strategy"]
                },
                research: {
                  description: "User Research - Understand user needs through research and testing",
                  topics: ["User interviews", "Surveys", "Usability testing", "Personas", "Journey mapping", "A/B testing", "Analytics interpretation", "Feedback loops"]
                },
                analytics: {
                  description: "Product Analytics - Make data-driven decisions with metrics and KPIs",
                  topics: ["Metrics definition", "KPIs", "Funnel analysis", "Cohort analysis", "Retention metrics", "Data-driven decisions", "Dashboards", "Experimentation"]
                },
                roadmap: {
                  description: "Roadmap Planning - Prioritize features and plan product releases",
                  topics: ["Feature prioritization", "Release planning", "Stakeholder alignment", "Resource allocation", "Timeline estimation", "Dependencies", "Trade-offs"]
                },
                stakeholder: {
                  description: "Stakeholder Mgmt - Align teams and communicate with stakeholders",
                  topics: ["Executive communication", "Cross-functional collaboration", "Conflict resolution", "Alignment strategies", "Presentations", "Status updates"]
                },
                agile: {
                  description: "Agile & Scrum - Manage projects with agile methodologies",
                  topics: ["Sprint planning", "Backlog grooming", "Retrospectives", "User stories", "Estimation techniques", "Agile ceremonies", "Kanban", "Velocity"]
                }
              },
              qa: {
                manual: {
                  description: "Manual Testing - Learn testing fundamentals and test case design",
                  topics: ["Test case design", "Test planning", "Exploratory testing", "Regression testing", "Bug reporting", "Test documentation", "Test scenarios", "Edge cases"]
                },
                automation: {
                  description: "Test Automation - Automate testing with frameworks and best practices",
                  topics: ["Test frameworks", "Page Object Model", "Test data management", "CI integration", "Test reporting", "Best practices", "Maintainability"]
                },
                selenium: {
                  description: "Selenium - Perform browser automation and web testing",
                  topics: ["WebDriver", "Locators", "Waits (implicit/explicit)", "Cross-browser testing", "Selenium Grid", "Framework integration", "Handling alerts/frames"]
                },
                performance: {
                  description: "Performance Testing - Test application speed, scalability, and stability",
                  topics: ["Load testing", "Stress testing", "JMeter", "k6", "Performance metrics", "Bottleneck identification", "Optimization", "Monitoring"]
                },
                security: {
                  description: "Security Testing - Identify vulnerabilities and security flaws",
                  topics: ["OWASP Top 10", "Penetration testing", "Vulnerability assessment", "Security scanning tools", "Secure coding", "Authentication testing", "SQL injection"]
                },
                api: {
                  description: "API Testing - Validate REST APIs and microservices endpoints",
                  topics: ["REST API testing", "Postman", "Request/response validation", "Authentication testing", "Contract testing", "Mocking", "Status codes", "Error handling"]
                }
              }
            }

            // Handle "multi" course interview - covers SELECTED subcourses only
            const selectedTopics = Array.isArray(topicsParam) ? topicsParam : (typeof topicsParam === "string" ? topicsParam.split(",").filter(Boolean) : [])
            if (courseSubject === "multi" && selectedTopics.length > 0) {
              const allSubcourses = courseMap[courseName] || {}
              const allTopics: string[] = []
              const allDescriptions: string[] = []
              selectedTopics.forEach((key: string) => {
                const value = allSubcourses[key]
                if (value) {
                  allDescriptions.push(`• ${value.description}`)
                  allTopics.push(...value.topics)
                }
              })
              courseContext = `\n\n🎯 MULTI-TOPIC COURSE INTERVIEW: ${courseName.toUpperCase()}

This interview covers SELECTED topics: ${selectedTopics.join(", ").toUpperCase()}.

COVERED AREAS:
${allDescriptions.join("\n")}

KEY TOPICS (rotate through these):
${allTopics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

YOUR QUESTIONS MUST:
1. Rotate through DIFFERENT selected topic areas
2. Cover practical, real-world scenarios from the selected topics
3. Test breadth across the chosen subcourses
4. Vary questions across all selected topics

DIFFICULTY: ${difficulty}
Previous questions (avoid repetition):
${previousAnswers.map((qa: any, idx: number) => `${idx + 1}. ${qa.question}`).join("\n")}`
            } else if (courseSubject === "full") {
              const allSubcourses = courseMap[courseName] || {}
              const allTopics: string[] = []
              const allDescriptions: string[] = []
              
              Object.entries(allSubcourses).forEach(([key, value]) => {
                allDescriptions.push(`• ${value.description}`)
                allTopics.push(...value.topics)
              })

              courseContext = `\n\n🎯 FULL COURSE INTERVIEW: ${courseName.toUpperCase()}

This is a COMPREHENSIVE interview covering ALL topics in ${courseName.toUpperCase()}.

COVERED AREAS:
${allDescriptions.join('\n')}

ALL KEY TOPICS (rotate through these):
${allTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

YOUR QUESTIONS MUST:
1. Rotate through DIFFERENT subcourse areas (don't focus on just one)
2. Cover practical, real-world scenarios across the entire ${courseName} domain
3. Test breadth of knowledge across all subcourses
4. Ask about integration between different technologies/concepts
5. Include best practices, common challenges, and real-world applications

⚠️ IMPORTANT: Vary your questions across ALL subcourse topics, not just one area.

DIFFICULTY: ${difficulty}
Previous questions (avoid repetition):
${previousAnswers.map((qa: any, idx: number) => `${idx + 1}. ${qa.question}`).join("\n")}`
            } else {
              // Regular single subcourse interview
              const topicData = courseMap[courseName]?.[courseSubject]
              const topicDescription = topicData?.description || `${courseName} ${courseSubject} development`
              const topicsList = topicData?.topics || []

              courseContext = `\n\n🎯 COURSE FOCUS: ${courseName.toUpperCase()} - ${courseSubject.toUpperCase()}

TOPIC: ${topicDescription}

KEY TOPICS TO ASK ABOUT:
${topicsList.map((t, i) => `${i + 1}. ${t}`).join('\n')}

YOUR QUESTIONS MUST:
1. Be directly related to the KEY TOPICS listed above
2. Cover practical, real-world scenarios specific to ${courseSubject}
3. Test understanding of ${courseSubject} concepts, not generic programming
4. Ask about best practices, common challenges, and optimization

⚠️ DO NOT ask questions about other technologies or generic programming.

DIFFICULTY: ${difficulty}
Previous questions (avoid repetition):
${previousAnswers.map((qa: any, idx: number) => `${idx + 1}. ${qa.question}`).join("\n")}`
            }
          }

          if (interviewType === "custom" && customScenario) {
            interviewContext = `You are conducting a highly personalized custom interview scenario.\n\nSCENARIO DESCRIPTION: ${customScenario.description}\n\nINTERVIEW CONTEXT: ${customScenario.context || "Standard interview setting"}\n\nCANDIDATE\'S GOALS TO DEMONSTRATE:\n${customScenario.goals.map((goal: string, i: number) => `${i + 1}. ${goal}`).join("\n")}\n\nFOCUS AREAS TO ASSESS:\n${customScenario.focusAreas.map((area: string, i: number) => `${i + 1}. ${area}`).join("\n")}\n\nYOUR JOB AS INTERVIEWER:\n1. Ask questions that directly evaluate the focus areas listed above\n2. Create realistic scenarios aligned with the candidate\'s goals\n3. Vary question types: situational, behavioral, technical (if relevant), problem-solving\n4. Build naturally on previous responses\n5. Keep questions aligned with the scenario description throughout\n\nThis is a REAL interview tailored to their specific needs. Make it count.`
          } else if (!isAptitude && !isDSAInterview && !isOtherInterview) {
            const contextMap = {
              technical:
                "Conduct a technical interview. Use SIMPLE, everyday English - no fancy or formal words. No corny phrases. Keep it casual like real talk.\n\n" +
                "QUESTION MIX: Technical (40%), Problem-solving (25%), Behavioral (20%), Communication (15%)\n\n" +
                "STYLE: Ask like a real person. Build on their answers. Be conversational, not robotic.",
              hr:
                "Conduct an HR interview. Use SIMPLE, everyday English - no fancy or formal words. No corny phrases. Keep it casual like real talk.\n\n" +
                "QUESTION MIX: Behavioral (40%), Motivational (25%), Situational (20%), Cultural fit (15%)\n\n" +
                "STYLE: Ask follow-ups based on their answers. Be natural, not formal.",
              custom:
                "Conduct an interview. Use SIMPLE, everyday English - no fancy or formal words. No corny phrases. Keep it casual like real talk.\n\n" +
                "QUESTION MIX: Experience (35%), Skills (30%), Behavioral (20%), Goals (15%)\n\n" +
                "STYLE: Build on their answers. Mix question types. Be natural.",
            }

            interviewContext = contextMap[interviewType as keyof typeof contextMap] || contextMap.custom
            interviewContext += courseContext
          }
        }

        let difficultyContext = ""

        switch (difficulty) {
          case "beginner":
            difficultyContext =
              "\n\nDIFFICULTY LEVEL: BEGINNER - Ask fundamental questions about basic concepts, definitions, and simple applications. Focus on understanding core principles and basic usage. Avoid complex scenarios or advanced topics. Keep questions encouraging and supportive."
            break
          case "intermediate":
            difficultyContext =
              "\n\nDIFFICULTY LEVEL: INTERMEDIATE - Ask practical questions about real-world applications, problem-solving, and best practices. Include scenario-based questions that require applying knowledge to solve common challenges. Balance technical depth with accessibility."
            break
          case "pro":
            difficultyContext =
              "\n\nDIFFICULTY LEVEL: PRO - Ask advanced questions about optimization, performance, scalability, and complex problem-solving. Include questions about trade-offs, design patterns, and advanced techniques. Challenge them to think critically."
            break
          case "advanced":
            difficultyContext =
              "\n\nDIFFICULTY LEVEL: ADVANCED - Ask expert-level questions about system architecture, complex design decisions, cutting-edge technologies, and deep technical knowledge. Challenge the candidate with sophisticated scenarios requiring comprehensive understanding and strategic thinking."
            break
          default:
            difficultyContext =
              "\n\nDIFFICULTY LEVEL: INTERMEDIATE - Ask practical questions about real-world applications and problem-solving."
        }

        let personalizationContext = ""

        if (userProfile?.preferences) {
          const prefs = userProfile.preferences as any
          const careerStage = prefs.career_stage

          if (careerStage === "student") {
            personalizationContext =
              "\n\nIMPORTANT: The candidate is a STUDENT who is currently pursuing their degree. They have NO professional work experience yet. Ask questions appropriate for someone seeking their FIRST job or internship. Focus on:\n" +
              "- Academic projects and coursework\n" +
              "- Learning experiences and how they overcome challenges\n" +
              "- Theoretical knowledge and eagerness to apply it\n" +
              "- Teamwork in group projects\n" +
              "- Their potential and growth mindset\n" +
              "NEVER ask about previous jobs, professional experience, or workplace scenarios."
          } else if (careerStage === "recent_graduate") {
            personalizationContext =
              "\n\nIMPORTANT: The candidate is a RECENT GRADUATE who graduated within the last 2 years. They may have limited professional experience. Ask questions appropriate for entry-level positions:\n" +
              "- Academic projects and any internships\n" +
              "- How they\'re transitioning from academic to professional life\n" +
              "- Their eagerness to learn and grow\n" +
              "- Fresh perspectives and modern knowledge"
          } else if (careerStage === "professional") {
            const yearsExp = prefs.years_of_experience || 0
            const currentRole = prefs.current_role || "professional"
            personalizationContext = `\n\nThe candidate is a ${currentRole} with ${yearsExp} years of professional experience. Ask questions appropriate for their experience level, including past projects, leadership, and professional growth.`
          } else if (careerStage === "career_changer") {
            personalizationContext =
              "\n\nThe candidate is transitioning to a new field. Ask questions that:\n" +
              "- Acknowledge their transferable skills from previous career\n" +
              "- Explore their motivation for the career change\n" +
              "- Assess how they\'re preparing for the transition\n" +
              "- Assess how they\'re preparing for the transition\n" +
              "- Value their unique perspective from different background"
          }

          if (prefs.target_role) {
            personalizationContext += ` They are targeting a ${prefs.target_role} position.`
          }
        }

        if (userProfile?.skills && Array.isArray(userProfile.skills) && userProfile.skills.length > 0) {
          personalizationContext += `\n\nCandidate\'s skills: ${userProfile.skills.join(", ")}`
        }

        if (userProfile?.education && Array.isArray(userProfile.education) && userProfile.education.length > 0) {
          const edu = userProfile.education[0] as any
          personalizationContext += `\n\nEducation: ${edu.degree} from ${edu.school}`
        }

        if (userProfile?.resume_data) {
          const resumeData = userProfile.resume_data as any
          personalizationContext += "\n\nRESUME INSIGHTS:"

          if (resumeData.experience && Array.isArray(resumeData.experience) && resumeData.experience.length > 0) {
            personalizationContext += "\nWork Experience:"
            resumeData.experience.slice(0, 3).forEach((exp: any) => {
              personalizationContext += `\n- ${exp.role || exp.title} at ${exp.company}${exp.duration ? ` (${exp.duration})` : ""}`
              if (exp.description) {
                personalizationContext += `\n  ${exp.description.substring(0, 150)}`
              }
            })
          }

          if (resumeData.projects && Array.isArray(resumeData.projects) && resumeData.projects.length > 0) {
            personalizationContext += "\n\nProjects:"
            resumeData.projects.slice(0, 2).forEach((proj: any) => {
              personalizationContext += `\n- ${proj.name}: ${proj.description?.substring(0, 100) || ""}`
              if (proj.technologies) {
                personalizationContext += `\n  Technologies: ${Array.isArray(proj.technologies) ? proj.technologies.join(", ") : proj.technologies}`
              }
            })
          }

          if (resumeData.summary) {
            personalizationContext += `\n\nProfessional Summary: ${resumeData.summary}`
          }

          personalizationContext +=
            "\n\nUSE THIS RESUME DATA to ask specific questions about their actual experience, projects, and skills. Reference their real work when appropriate."
        }

        const previousContext =
          previousAnswers && previousAnswers.length > 0
            ? `\n\nPREVIOUS CONVERSATION:\n${previousAnswers.map((qa: any, i: number) => `\nQ${i + 1}: ${qa.question}\nA${i + 1}: ${qa.answer}`).join("\n")}\n\nBased on their previous answers, you can ask follow-up questions or explore new areas. Make the conversation flow naturally like a real interview.`
            : ""

        const contextUsageInstruction =
          previousAnswers && previousAnswers.length > 0
            ? `\n\nIMPORTANT: Review the previous conversation above. Your next question MUST:\n1. Either ask a follow-up based on what they said (reference their answer naturally)\n2. OR explore a different aspect of the role/topic\n3. NEVER ask the same type of question twice - each question must be about a DIFFERENT concept\n4. Do NOT rephrase previous questions (e.g. "What do you know about X?" vs "What do you know about X so far?" = same meaning)\n5. Build on their responses to create a flowing conversation\n6. If they mentioned something interesting, dig deeper into it\n\nMake this feel like a REAL conversation, not a scripted questionnaire.`
            : ""

        console.log("[v0] Calling generateText with personalized context and difficulty...")

        // Get company name for company-specific interviews (technical, system-design - no coding)
        const needsCompanyName = isCompanyTechnicalInterview || isCompanySystemDesignInterview
        const companyCodingName = needsCompanyName 
          ? (companyContextMap[companyId]?.name || companyId.charAt(0).toUpperCase() + companyId.slice(1))
          : ""
        const companyCodingFocus = needsCompanyName
          ? (companyContextMap[companyId]?.focusAreas || ["Data structures & algorithms", "Problem-solving", "System design"])
          : []
        const roleCodingRole = isRoleCodingInterview
          ? (roleContextMap[roleId] || { name: roleId, skills: ["Data structures & algorithms", "Problem-solving", "Coding"], questionTypes: ["Coding problems"] })
          : null

        // Coding-specific difficulty (generic difficultyContext is for conversational questions)
        const codingDifficultyContext =
          difficulty === "beginner"
            ? "\n\nDIFFICULTY: BEGINNER - The problem MUST be simple: basic loops, conditionals, array/string operations. NO dynamic programming, NO Kadane's algorithm, NO graphs, NO recursion beyond factorial. Good examples: find max in array, count vowels, reverse string, two-sum, fizzbuzz, palindrome check."
            : difficulty === "pro" || difficulty === "expert" || difficulty === "advanced"
              ? "\n\nDIFFICULTY: ADVANCED - The problem can use dynamic programming, graphs, advanced data structures, or optimization. Challenge the candidate."
              : "\n\nDIFFICULTY: INTERMEDIATE - The problem should require some problem-solving (e.g. sliding window, two pointers, simple recursion) but not advanced algorithms like DP or graph traversal."

        const totalCodingProblems = Math.ceil((questionCount ?? interviewQuestionCount) / 6)
        const singleProblemVariantInstruction =
          totalCodingProblems === 1 && useFixBuggyVariant === true
            ? "\n\nSINGLE-PROBLEM (5 min): You MUST use the FIX BUGGY CODE variant. Provide buggy code in a code block and ask the candidate to fix it."
            : totalCodingProblems === 1 && useFixBuggyVariant === false
              ? "\n\nSINGLE-PROBLEM (5 min): You MUST use the WRITE FROM SCRATCH variant. Problem statement with example input/output only."
              : ""

        const { text } = await generateTextWithRetry(
          groqClient("llama-3.1-8b-instant"),
          isRoleCodingInterview
            ? `${interviewContext}${codingDifficultyContext}

This is coding problem number ${codingProblemIndex ?? questionNumber} of ${Math.ceil((questionCount ?? interviewQuestionCount) / 6)}.
${previousContext}
${singleProblemVariantInstruction}

CRITICAL: You are generating a CODING PROBLEM for a ${roleCodingRole!.name} interview. The problem MUST be runnable in our sandbox (Judge0): Python/JavaScript/Java/C++ with STANDARD LIBRARY ONLY.

ROLE SKILLS TO TEST (adapt to runnable problems):
${roleCodingRole!.skills.map((s, i) => `${i + 1}. ${s}`).join("\n")}

QUESTION TYPES: ${roleCodingRole!.questionTypes.join(", ")}

VARIANT CHOICE (MUST use BOTH types across the interview - alternate between them):
- WRITE FROM SCRATCH: Problem statement with example input/output. Candidate writes code from scratch.
- FIX BUGGY CODE: Provide code with a bug and ask them to fix it. Format: "Here is code that has a bug. Fix it so that [expected behavior]." Include the buggy code in a code block. The bug should be fixable (off-by-one, wrong condition, missing edge case, etc.).

When there are 2+ coding problems, use at least one "fix buggy code" variant. When there are 3+ problems, use at least two different types.

REQUIRED FORMAT:
**Problem:** [Clear problem statement - either write from scratch OR fix the buggy code below]

**Example:** (if write-from-scratch)
Input: [example input]
Output: [example output]

**Constraints:**
- [time/space complexity requirements]
- [input size/range]

⚠️ EXECUTION CONSTRAINTS (MANDATORY - code runs in Judge0 sandbox):
- Use ONLY standard library / built-in language features. NO external libraries (no pip, no npm, no import numpy/pandas/sklearn/react).
- The problem MUST be deterministic: NO randomness, NO file I/O, NO network calls, NO system calls.
- The candidate implements a function (or prints output) that can be tested with predefined inputs/outputs.
- Keep input sizes small: arrays under 20 elements, strings under 50 chars.
- Match the user's selected difficulty: ${difficulty}. Do NOT make it too complex for the difficulty level.

Generate ONE unique coding problem appropriate for ${difficulty} level. Make it different from any previous problems. Return ONLY the problem in the format above.`
            : isCodingInterview
            ? `${interviewContext}${difficultyContext}

This is coding problem number ${questionNumber} out of ${questionCount ?? interviewQuestionCount}.
${previousContext}
${singleProblemVariantInstruction}

CRITICAL: You are generating a CODING PROBLEM for ${courseName.toUpperCase()} / ${courseSubject.toUpperCase()} ONLY. The problem MUST be specific to this domain - a ${courseSubject} developer would solve it. NOT a generic algorithm.

VARIANT CHOICE (MUST use BOTH types across the interview - alternate between them):
- WRITE FROM SCRATCH: Problem statement with example input/output. Candidate writes code from scratch.
- FIX BUGGY CODE: Provide buggy code in a code block and ask the candidate to fix it. The code should have a clear bug (wrong logic, off-by-one, missing edge case). Include expected behavior.

When there are 2+ coding problems, use at least one "fix buggy code" variant. When there are 3+ problems, use at least two different types.

REQUIRED FORMAT:
**Problem:** [Clear problem statement - either write from scratch OR fix the buggy code below]

**Example:** (if write-from-scratch)
Input: [example input]
Output: [example output]

**Constraints:**
- [time/space complexity requirements]
- [input size/range]

Generate ONE unique ${courseSubject} coding problem. Make it different from any previous problems in this interview.`
            : isAptitude
            ? `${interviewContext}${difficultyContext}

This is aptitude problem number ${questionNumber} out of ${questionCount ?? interviewQuestionCount}.
${previousContext}

CRITICAL: You are generating an APTITUDE MCQ for ${courseSubject.toUpperCase()}, NOT a coding problem.

You MUST return a valid JSON object with this EXACT structure (no markdown, no code blocks):
{"question":"<the question text>","options":[{"key":"A","text":"<option A>"},{"key":"B","text":"<option B>"},{"key":"C","text":"<option C>"},{"key":"D","text":"<option D>"}],"correctAnswer":"<A|B|C|D>"}

RULES:
- question: Clear, concise aptitude problem (1-4 sentences)
- options: Exactly 4 options with keys A, B, C, D
- correctAnswer: The key (A, B, C, or D) of the correct option
- Return ONLY the JSON object, nothing else`
            : isCompanyTechnicalInterview
            ? (questionNumber === 1
                ? `${interviewContext}

This is question number 1 - the opening question.

The interviewer has already introduced themselves. Generate ONLY a short ask for the candidate to introduce themselves. CRITICAL: Must be 9-11 words. Use SIMPLE English. Examples: "Can you tell me a bit about yourself and your background?", "I'd like to hear about your background and experience." Return ONLY the question.`
                : `${interviewContext}${difficultyContext}

This is technical question number ${questionNumber} out of ${questionCount ?? interviewQuestionCount}.
${previousContext}

CRITICAL: You are generating a TECHNICAL interview question for ${companyCodingName || companyId}. Ask about data structures, algorithms, system concepts, or problem-solving.

The question should:
1. Be specific and technical - test real engineering knowledge
2. Match ${companyCodingName || companyId}'s interview style and difficulty
3. Be clear and direct (1-3 sentences)
4. NOT be a full coding problem with examples/constraints - just a technical question

Examples of good technical questions:
- "How would you optimize a slow database query with multiple JOINs?"
- "Explain the trade-offs between SQL and NoSQL databases for a high-traffic application."
- "What happens when you type a URL in the browser and press Enter?"

Generate ONE unique technical question. Return ONLY the question, nothing else.`)
            : isCompanySystemDesignInterview
            ? (questionNumber === 1
                ? `${interviewContext}

This is question number 1 - the opening question.

The interviewer has already introduced themselves. Generate ONLY a short ask for the candidate to introduce themselves. CRITICAL: Must be 9-11 words. Use SIMPLE English. Examples: "Can you tell me a bit about yourself and your background?", "I'd like to hear about your background and experience." Return ONLY the question.`
                : `${interviewContext}${difficultyContext}

This is system design question number ${questionNumber} out of ${questionCount ?? interviewQuestionCount}.
${previousContext}

CRITICAL: You are generating a SYSTEM DESIGN scenario for ${companyCodingName || companyId}. Present a real-world system to design.

REQUIRED FORMAT:
**Scenario:** [Clear description of the system to design - 2-4 sentences explaining what needs to be built]

**Requirements:**
- [Key requirement 1]
- [Key requirement 2]
- [Key requirement 3]

**Consider:**
- Scale expectations (users, requests, data volume)
- Key components and trade-offs to discuss

Make the scenario relevant to ${companyCodingName || companyId}'s domain and scale. Generate ONE unique system design scenario. Make it different from any previous problems in this interview.`)
            : `${interviewContext}${questionNumber === 1 ? "" : difficultyContext}${questionNumber === 1 ? "" : personalizationContext}
      
This is question number ${questionNumber}.
${previousContext}${isAptitude ? "" : contextUsageInstruction}

${
  questionNumber === 1
    ? (isOtherInterview && otherInterviewType === "salary-negotiation"
        ? "You are a recruiter starting a salary negotiation. Generate ONLY one short opening question (9-11 words). Focus on compensation: e.g. 'What are your salary expectations for this role?', 'Can you share your current compensation and expectations?', 'What salary range are you looking for in this position?'. No intro, no preamble - just the question."
        : (isOtherInterview && otherInterviewType
            ? "The interviewer already introduced themselves. Generate ONLY a short ask for the candidate to introduce themselves. CRITICAL: Must be 9-11 words exactly. Use SIMPLE, everyday English. Examples: 'Can you tell me a bit about yourself and your background?', 'I'd like to hear about your background and experience.'. No intro, no preamble - just the ask."
            : "The interviewer already introduced themselves. Generate ONLY a short ask for the candidate to introduce themselves. CRITICAL: Must be 9-11 words exactly. Use SIMPLE, everyday English. Examples (9-11 words): 'Can you tell me a bit about yourself and your background?', 'I'd like to hear about your background and experience.', 'Tell me about yourself and what you've done so far.', 'Walk me through your background and experience so far.'. No intro, no preamble - just the ask."))
    : (isOtherInterview && otherInterviewType === "salary-negotiation"
        ? `CRITICAL: Each question MUST be 9-11 words exactly. Use SIMPLE, everyday English.

1. Exactly 9-11 words - count them
2. UNIQUE - not asked before AND not the same meaning as any previous question
3. Focus ONLY on salary negotiation: compensation, benefits, offers, counter-offers, value articulation, negotiation tactics. Do NOT ask technical, coding, or programming questions.
4. Reference their answers when possible

Each question must explore a DIFFERENT aspect of salary/compensation negotiation.

Good: "What's your expected salary range for this role?" "How would you respond if our offer is below your expectations?"
Bad: Technical questions, generic behavioral questions unrelated to compensation

Generate ONE question. Return ONLY the question.`
        : (isOtherInterview && otherInterviewType
            ? `CRITICAL: Each question MUST be 9-11 words exactly. Use SIMPLE, everyday English.

1. Exactly 9-11 words - count them
2. UNIQUE - not asked before AND not the same meaning as any previous question
3. Focus ONLY on ${otherInterviewType === "hr-interview" ? "behavioral, experience, motivation, cultural fit" : "light behavioral, rapport, confidence-building"}. Do NOT ask technical, coding, or programming questions.
4. Reference their answers when possible

Each question must explore a DIFFERENT topic. Do NOT mix in technical questions.

Generate ONE question. Return ONLY the question.`
            : `CRITICAL: Each question MUST be 9-11 words exactly. Use SIMPLE, everyday English - no fancy or formal words. No corny phrases.

1. Exactly 9-11 words - count them
2. UNIQUE - not asked before AND not the same meaning as any previous question
3. Mix technical, behavioral, problem-solving
4. Reference their answers when possible

AVOID SEMANTIC DUPLICATES: Do NOT ask questions that mean the same thing as previous ones. Examples of BAD duplicates:
- "What do you know about NumPy arrays?" and "What do you know about NumPy arrays so far?" (same meaning)
- "How do you handle missing data in Pandas?" and "How do you usually handle missing data in Pandas?" (same meaning)
Each question must explore a DIFFERENT topic or concept.

Good (9-11 words): "What's the toughest bug you've ever fixed in your code?" "How do you handle conflicts when working with your teammates?"
Bad: Questions shorter than 9 or longer than 11 words

Generate ONE question. Return ONLY the question.`))
}

Generate ONE question. CRITICAL: Must be 9-11 words exactly. Use simple, everyday English. Return ONLY the question, nothing else.`,
          5, // maxRetries
          2000, // initialDelayMs
        )

        console.log("[v0] generateText succeeded, received response")

        let newQuestion = text.trim()
        if (newQuestion.startsWith("```")) {
          newQuestion = newQuestion.replace(/^```[a-zA-Z]*\s*/, "").replace(/```\s*$/, "").trim()
        }

        if (!newQuestion) {
          throw new Error("Empty question returned from model")
        }

        // For aptitude MCQ: parse JSON response
        let mcqPayload: { question: string; options: Array<{ key: string; text: string }>; correctAnswer: string } | null = null
        if (isAptitude) {
          try {
            const parsed = JSON.parse(newQuestion) as { question?: string; options?: Array<{ key: string; text: string }>; correctAnswer?: string }
            if (parsed?.question && Array.isArray(parsed.options) && parsed.options.length >= 2) {
              mcqPayload = {
                question: parsed.question,
                options: parsed.options.slice(0, 4).map((o) => ({ key: String(o.key || "").trim() || "?", text: String(o.text || "").trim() })),
                correctAnswer: String(parsed.correctAnswer || "").trim().toUpperCase().charAt(0) || "A",
              }
              newQuestion = mcqPayload.question
            }
          } catch {
            console.log("[v0] Aptitude response was not valid JSON, retrying for MCQ format...")
            attempts++
            continue
          }
          if (!mcqPayload) {
            console.log("[v0] Aptitude MCQ parse failed (missing options), retrying...")
            attempts++
            continue
          }
        }

        if (isDuplicateQuestion(newQuestion, previousAnswers || [], previousQuestionsFromDB)) {
          console.log("[v0] Generated duplicate question, retrying...")
          attempts++
          continue
        }

        console.log("[v0] Generated question:", newQuestion.substring(0, 100) + "...")

        try {
          const questionHash = generateQuestionHash(newQuestion)

          const { data: existingQuestion, error: checkError } = await supabase
            .from("interview_questions_asked")
            .select("id, is_important, times_asked")
            .eq("user_id", user.id)
            .eq("question_hash", questionHash)
            .maybeSingle()

          if (checkError) {
            console.log("[v0] Warning: Could not check question history:", checkError.message)
            userQuestion = newQuestion
            break
          }

          if (!existingQuestion) {
            console.log("[v0] Question is unique, using it")
            userQuestion = newQuestion
            if (mcqPayload) aptitudeMCQResult = mcqPayload

            try {
              const { error: insertError } = await supabase.from("interview_questions_asked").insert({
                user_id: user.id,
                question_hash: questionHash,
                question_text: newQuestion,
                is_important: false,
                times_asked: 1,
                interview_type: interviewType || null,
              })

              if (insertError) {
                console.log("[v0] Could not record question history:", insertError.message)
              } else {
                console.log("[v0] Question history recorded successfully")
              }
            } catch (insertError) {
              console.log(
                "[v0] Could not record question history:",
                insertError instanceof Error ? insertError.message : "Unknown error",
              )
            }
          } else if (existingQuestion.is_important) {
            console.log("[v0] Reusing important question")
            userQuestion = newQuestion
            if (mcqPayload) aptitudeMCQResult = mcqPayload

            // Increment times_asked for important/reused questions
            try {
              await supabase
                .from("interview_questions_asked")
                .update({ times_asked: (existingQuestion.times_asked || 0) + 1 })
                .eq("id", existingQuestion.id)
              console.log("[v0] Incremented times_asked for important question")
            } catch (incError) {
              console.log("[v0] Could not increment times_asked:", incError instanceof Error ? incError.message : String(incError))
            }
          } else {
            console.log("[v0] Question already asked, trying again (attempt", attempts + 1, "of", maxAttempts, ")")

            // Increment times_asked to record additional attempt on this question
            try {
              await supabase
                .from("interview_questions_asked")
                .update({ times_asked: (existingQuestion.times_asked || 0) + 1 })
                .eq("id", existingQuestion.id)
              console.log("[v0] Incremented times_asked for existing question")
            } catch (incError) {
              console.log("[v0] Could not increment times_asked:", incError instanceof Error ? incError.message : String(incError))
            }

            attempts++
          }
        } catch (dbError) {
          console.log(
            "[v0] Database operation failed, using question anyway:",
            dbError instanceof Error ? dbError.message : String(dbError),
          )
          userQuestion = newQuestion
          if (mcqPayload) aptitudeMCQResult = mcqPayload
          break
        }
      } catch (attemptError) {
        lastError = attemptError
        console.error("[v0] Error in attempt", attempts + 1)
        if (attemptError instanceof Error) {
          console.error("[v0] Error message:", attemptError.message)
          console.error("[v0] Error cause:", attemptError.cause)
        } else {
          console.error("[v0] Error:", attemptError)
        }
        attempts++
      }
    }

    if (!userQuestion) {
      console.log("[v0] All regeneration attempts failed, using fallback question")
      if (lastError) {
        console.error("[v0] Last error:", lastError instanceof Error ? lastError.message : String(lastError))
      }
      if (isCodingForFallback) {
        // Course-specific fallbacks - NEVER use generic DSA for frontend/datascience/devops
        const codingFallbacks: Record<string, string[]> = {
          frontend: [
            "Implement a React component that displays a list of items with add/remove functionality. Use useState for state management.",
            "Create a React hook that fetches data from an API and returns loading, error, and data states.",
            "Build a form component with controlled inputs for name and email, including basic validation.",
          ],
          backend: [
            "Implement an Express middleware that logs request method and URL. Export it for use in an app.",
            "Create a REST API endpoint that accepts POST with JSON body and returns the parsed data with a 201 status.",
            "Write a function that connects to a database and returns a user by ID, handling connection errors.",
          ],
          datascience: [
            "Using Pandas, load a CSV file and compute the mean and standard deviation of a numeric column. Handle missing values.",
            "Using scikit-learn, fit a simple LinearRegression model on sample X, y arrays and return the coefficient.",
            "Write a function that takes a DataFrame and returns rows where a specified column is above its median.",
          ],
          devops: [
            "Write a Dockerfile that runs a Node.js app. Use a multi-stage build and expose port 3000.",
            "Create a shell script that checks if a process is running by name and restarts it if not.",
            "Write a docker-compose.yml with a web service and a Redis service, with the web depending on Redis.",
          ],
          fullstack: [
            "Implement an API route that fetches data and a React component that displays it. Handle loading state.",
            "Create a form that submits to a POST endpoint and shows success/error feedback.",
          ],
          mobile: [
            "Implement a React Native FlatList that renders items from an array with pull-to-refresh.",
            "Create a screen component with a TextInput and a submit button that validates non-empty input.",
          ],
          dsa: [
            "Implement a function that takes an array of numbers and returns the sum of all elements. Include edge cases for empty array and single element.",
          ],
        }
        const fallbackList = courseName && codingFallbacks[courseName]
          ? codingFallbacks[courseName]
          : codingFallbacks.dsa
        const prevTexts = new Set([
          ...(previousAnswers || []).map((qa: any) => (qa.question || "").trim()).filter(Boolean),
          ...previousQuestionsFromDB,
        ])
        const pick = fallbackList.find((q) => !prevTexts.has(q)) || fallbackList[0]
        userQuestion = pick
      } else {
        userQuestion = questionNumber === 1
          ? "Can you tell me a bit about yourself and your background?"
          : "Tell me about a challenging situation you faced and how you approached solving it."
      }

      // Record the fallback question so it is not repeatedly returned in subsequent attempts
      try {
        const questionHash = generateQuestionHash(userQuestion)
        const { error: insertFallbackError } = await supabase.from("interview_questions_asked").insert({
          user_id: user.id,
          question_hash: questionHash,
          question_text: userQuestion,
          is_important: false,
          times_asked: 1,
          interview_type: interviewType || null,
        })

        if (insertFallbackError) {
          console.log("[v0] Could not record fallback question:", insertFallbackError.message)
        } else {
          console.log("[v0] Fallback question recorded to avoid repetition")
        }
      } catch (recordError) {
        console.log("[v0] Error recording fallback question:", recordError instanceof Error ? recordError.message : String(recordError))
      }
    }

    console.log("[v0] Returning question successfully")
    if (aptitudeMCQResult) {
      return NextResponse.json(aptitudeMCQResult)
    }
    return NextResponse.json({ question: userQuestion })
  } catch (error) {
    console.error("[v0] Fatal error in question endpoint:", error)
    let errorMessage = "Failed to generate question"
    let errorDetails = ""

    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || ""
    } else if (typeof error === "object" && error !== null) {
      errorDetails = JSON.stringify(error)
    } else {
      errorDetails = String(error)
    }

    console.error("[v0] Error message:", errorMessage)
    console.error("[v0] Error details:", errorDetails)

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
