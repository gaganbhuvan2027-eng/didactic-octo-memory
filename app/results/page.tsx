"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download } from 'lucide-react'
import DashboardNavbar from "@/components/dashboard-navbar"
import { downloadInterviewReport } from "@/utils/download-report"
import ResultsOverview from "@/components/results-overview"
import AIFeedback from "@/components/ai-feedback"
import InterviewConversation from "@/components/interview-conversation"
import DSAAptitudeResultsUI from "@/components/dsa-aptitude-results-ui"
import AptitudeQuantitativeResultsUI from "@/components/aptitude-quantitative-results-ui"
import CodingResultsUI from "@/components/coding-results-ui"
import { generateAnalysis } from "@/app/actions/generate-analysis"
import { createClient } from "@/lib/supabase/client"

interface AnalysisData {
  overall_score: number
  communication_score: number
  technical_score: number
  dsa_score?: number // Added for DSA interviews
  logical_reasoning_score?: number // Added for Aptitude interviews
  problem_solving_score: number
  confidence_score: number
  eye_contact_score?: number
  smile_score?: number
  stillness_score?: number
  face_confidence_score?: number
  strengths: string[]
  improvements: string[]
  detailed_feedback: string
  interviewType?: string
  total_questions?: number
  answered_questions?: number
  correct_answers_count?: string // e.g., "3/5"
  wrong_answers_count?: number
  not_answered_questions_count?: number // Added
}

interface ConversationItem {
  questionNumber: number
  question: string
  userAnswer: string
  skipped: boolean
}

interface ProbableAnswer {
  questionNumber: number
  probableAnswer: string
}

export default function ResultsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const interviewId = searchParams.get("interviewId")
  const forceType = searchParams.get("forceType")
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [conversation, setConversation] = useState<ConversationItem[]>([])
  const [probableAnswers, setProbableAnswers] = useState<ProbableAnswer[]>([])
  const [currentInterviewType, setCurrentInterviewType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [backRedirected, setBackRedirected] = useState<boolean>(false)
  const [userType, setUserType] = useState<string | null>(null)
  const [courseName, setCourseName] = useState<string | null>(null)
  const [round, setRound] = useState<string | null>(null)
  const [practicedAt, setPracticedAt] = useState<string | null>(null)

  useEffect(() => {
    console.log("[v0] Results page mounted with interviewId:", interviewId)

    const fetchAnalysis = async () => {
      if (!interviewId) {
        console.log("[v0] No interview ID in search params")
        setError("No interview ID provided")
        setIsLoading(false)
        return
      }

      let analysisTriggered = false
      
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          console.log(`[v0] Fetching analysis for interview (attempt ${attempt + 1}):`, interviewId)
          const response = await fetch(`/api/interview/results?interviewId=${interviewId}`)
          console.log("[v0] Results API response status:", response.status)

          if (response.ok) {
            const data = await response.json()
            console.log("[v0] Analysis data received successfully")
            setAnalysis(data.analysis)
            setBatchId(data.batchId || null)
            setCourseName(data.courseName || null)
            setRound(data.round || null)
            setPracticedAt(data.practicedAt || null)
            setCurrentInterviewType(data.analysis.interviewType || "technical")

            const formattedConversation = (data.responses || [])
              .reduce<ConversationItem[]>((acc, r: any) => {
                let questionText = r.question
                let userAnswer = r.answer || "[No response provided]"
                if (typeof r.question === "string" && r.question.trim().startsWith("{")) {
                  try {
                    const parsed = JSON.parse(r.question) as { question?: string; options?: Array<{ key: string; text: string }> }
                    if (parsed?.question) {
                      questionText = parsed.question
                      if (Array.isArray(parsed.options) && parsed.options.length > 0) {
                        const selectedOpt = parsed.options.find((o: { key: string }) => o.key === r.answer)
                        if (selectedOpt) userAnswer = `${r.answer}: ${selectedOpt.text}`
                      }
                    }
                  } catch {
                    /* use question as-is */
                  }
                }
                const item: ConversationItem = {
                  questionNumber: r.question_number,
                  question: questionText,
                  userAnswer,
                  skipped: r.skipped || false,
                }
                if (!acc.some((c) => c.questionNumber === item.questionNumber)) {
                  acc.push(item)
                }
                return acc
              }, [])
              .sort((a, b) => a.questionNumber - b.questionNumber)
            setConversation(formattedConversation)

            setIsLoading(false)
            console.log("[v0] Results page ready to display")

            // Fetch probable answers in background (don't block - they load as they're generated)
            fetch(`/api/interview/conversation?interviewId=${interviewId}`)
              .then((res) => res.ok ? res.json() : null)
              .then((data) => data?.probableAnswers && setProbableAnswers(data.probableAnswers))
              .catch((err) => console.error("[v0] Error fetching probable answers:", err))

            return
          } else if (response.status === 404) {
            // Trigger analysis via server action (bypasses auth issues)
            if (!analysisTriggered) {
              analysisTriggered = true
              console.log("[v0] Analysis not found (404), triggering generateAnalysis server action...")
              try {
                // Get interview type first
                const interviewTypeRes = await fetch(`/api/interview/type?interviewId=${interviewId}`)
                if (!interviewTypeRes.ok) {
                  if (interviewTypeRes.status === 404) {
                    setError("Interview not found. Please try again from your dashboard.")
                    setIsLoading(false)
                    return
                  }
                }
                const interviewType = interviewTypeRes.ok
                  ? ((await interviewTypeRes.json())?.interviewType || "technical")
                  : "technical"
                console.log("[v0] Interview type:", interviewType)
                const result = await generateAnalysis(interviewId, interviewType, 0)
                if (result.success) {
                  console.log("[v0] generateAnalysis succeeded")
                } else {
                  console.error("[v0] generateAnalysis failed:", result.error)
                }
              } catch (actionError) {
                console.error("[v0] generateAnalysis error:", actionError)
              }
            }
            
            console.log("[v0] Waiting for analysis to be ready...")
            await new Promise((resolve) => setTimeout(resolve, attempt < 3 ? 2000 : 3000))
          } else {
            throw new Error("Failed to fetch analysis")
          }
        } catch (err) {
          console.error("[v0] Error in fetch attempt", attempt + 1 + ":", err)
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }

      console.error("[v0] Failed to fetch analysis after all attempts")
      setError("Unable to load your interview results. The analysis may still be processing. Please try refreshing the page in a moment.")
      setIsLoading(false)
    }

    fetchAnalysis()
  }, [interviewId])

  // Fetch user type to determine correct dashboard navigation
  useEffect(() => {
    const fetchUserType = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from("users")
            .select("user_type")
            .eq("id", user.id)
            .single()
          setUserType(profile?.user_type || "user")
        }
      } catch (err) {
        console.error("[v0] Error fetching user type:", err)
      }
    }
    fetchUserType()
  }, [])

  // Helper to get the correct dashboard URL based on user type
  const getDashboardUrl = () => {
    if (userType === "institution_admin") return "/institution-dashboard"
    if (userType === "institution") return "/my-institute"
    return "/dashboard"
  }

  // Redirect user to batches immediately when BACK is pressed from Results.
  // Also rewrite the previous history entry (interview URL) to /dashboard so that
  // pressing Back again goes to the dashboard.
  useEffect(() => {
    if (!analysis) return

    // Stop any active TTS/voice when results are ready
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        console.log('[v0] Results page: cancelling speech synthesis')
        window.speechSynthesis.cancel()
      }

      // Notify in-page voice agents to stop
      try {
        window.dispatchEvent(new CustomEvent('app:stop-voice-agent'))
      } catch (evErr) {
        console.warn('[v0] Results page: failed to dispatch stop event', evErr)
      }
    } catch (err) {
      console.warn('[v0] Error stopping voice/TTS on results load:', err)
    }

    const onPopState = (ev: PopStateEvent) => {
      if (backRedirected) return
      const dashboardUrl = getDashboardUrl()
      console.log('[v0] Results page: popstate detected — redirecting based on user type to:', dashboardUrl)

      try {
        // Replace the current history entry with the appropriate dashboard
        history.replaceState({ exitOnNextBack: true }, '', dashboardUrl)
      } catch (err) {
        console.warn('[v0] Failed to replace history state while redirecting back:', err)
      }

      // If user has a batch, go to batch page, otherwise go to appropriate dashboard
      const dest = batchId ? `/my-batches/${batchId}` : dashboardUrl
      setBackRedirected(true)
      router.push(dest)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [analysis, batchId, backRedirected, userType])

  const isSkillOnly = currentInterviewType && (currentInterviewType.startsWith('dsa') || currentInterviewType.startsWith('aptitude') || currentInterviewType === 'problem_solving' || currentInterviewType === 'problem-solving')

  // Coding round is only for role-wise interviews (not company or course)
  const isRoleCodingRound = round === "coding" && (currentInterviewType || "").startsWith("role-")
  const showCodingResults = isRoleCodingRound

  // Detect aptitude-quantitative even if the interview_type in the DB was not recorded as the subtype.
  // Fallback heuristics: if the analysis includes a logical_reasoning_score, treat as aptitude-quantitative
  const isAptitudeQuant = (forceType === 'aptitude-quantitative') || (analysis && (analysis.interviewType === 'aptitude-quantitative' || typeof (analysis as any).logical_reasoning_score !== 'undefined')) || currentInterviewType === 'aptitude-quantitative'

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      {/* Main Content */}
      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => (batchId ? router.push(`/my-batches/${batchId}`) : router.push(getDashboardUrl()))}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {batchId ? "Back to Batch" : "Back to Dashboard"}
          </button>
        </div>

        {/* Page Title Section */}
        <div className="mb-12 animate-fade-in flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Your Interview Performance</h1>
            <p className="text-lg text-gray-600 mb-4">Here&apos;s how you performed in your last mock interview.</p>

            {/* Course, Round, Date/Time */}
            <div className="flex flex-wrap gap-4 text-sm">
            {courseName && (
              <span className="text-blue-600 font-medium">Course: {courseName}</span>
            )}
            {round && (
              <span className="text-blue-600 font-medium">Round: {round}</span>
            )}
            {practicedAt && (
              <span className="text-blue-600 font-medium">
                Practiced on: {new Date(practicedAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            )}
            </div>
          </div>
          {analysis && (
            <button
              onClick={() => downloadInterviewReport(analysis, analysis.interviewType || "Technical Interview")}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0 self-end sm:self-auto sm:ml-auto"
            >
              <Download className="w-4 h-4" />
              Download Report
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your result is being generated</h2>
              <p className="text-gray-600 mb-1">We&apos;re analyzing your performance and preparing suggested answers.</p>
              <p className="text-sm text-gray-500">This may take up to a minute. Please don&apos;t close this page.</p>
            </div>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border-2 border-red-200 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Results</h3>
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => router.push(getDashboardUrl())}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        ) : analysis ? (
          <>
            {/* You Are Here - Level Progress Bar */}
            <div className="mb-8 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm font-medium text-gray-600 mb-3">You Are Here</p>
              <div className="relative pt-2">
                {(() => {
                  const levelStages = [
                    { min: 0, max: 30, label: "Needs Practice" },
                    { min: 31, max: 50, label: "Beginner" },
                    { min: 51, max: 65, label: "Proficient" },
                    { min: 66, max: 80, label: "Advanced" },
                    { min: 81, max: 95, label: "Expert" },
                    { min: 96, max: 100, label: "Outstanding" },
                  ]
                  const score = analysis.overall_score ?? 0
                  const currentStageIndex = levelStages.findIndex((s) => score >= s.min && score <= s.max)
                  const currentStage = currentStageIndex >= 0 ? levelStages[currentStageIndex] : levelStages[0]
                  return (
                    <>
                      <div className="flex items-center gap-0.5">
                        {levelStages.map((stage, i) => (
                          <div
                            key={stage.label}
                            className={`flex-1 h-2.5 rounded-sm transition-colors ${
                              i <= currentStageIndex ? "bg-blue-500" : "bg-gray-200"
                            }`}
                            title={stage.label}
                          />
                        ))}
                      </div>
                      <div
                        className="absolute top-0 flex flex-col items-center -translate-x-1/2 transition-all duration-500"
                        style={{ left: `${((currentStageIndex + 0.5) / levelStages.length) * 100}%` }}
                      >
                        <span className="text-blue-600 font-bold text-lg leading-none">▼</span>
                        <span className="text-xs font-semibold text-gray-800 mt-1 whitespace-nowrap">
                          {currentStage.label} ({score}%)
                        </span>
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] sm:text-xs text-gray-500">
                        {levelStages.map((s) => (
                          <span key={s.label} className="flex-1 text-center truncate px-0.5" title={s.label}>
                            {s.label === currentStage.label ? "" : s.label}
                          </span>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {isSkillOnly ? (
              isAptitudeQuant ? (
                <AptitudeQuantitativeResultsUI analysis={analysis} interviewType={currentInterviewType || 'aptitude-quantitative'} />
              ) : (
                <DSAAptitudeResultsUI analysis={analysis} interviewType={currentInterviewType || 'technical'} />
              )
            ) : showCodingResults ? (
              <CodingResultsUI
                analysis={analysis}
                interviewType={currentInterviewType || 'technical'}
                conversation={conversation}
                probableAnswers={probableAnswers}
              />
            ) : (
              <>
                <ResultsOverview analysis={analysis} interviewType={currentInterviewType} />
              </>
            )}

            {/* Comprehensive AI Analysis - above Question-by-Question Review */}
            {!isSkillOnly && <AIFeedback analysis={analysis} />}

            {/* Question-by-Question Review - hidden for coding rounds (CodingResultsUI has full structure) */}
            {!showCodingResults && (
              <InterviewConversation
                conversation={conversation}
                probableAnswers={probableAnswers}
                interviewId={interviewId}
                interviewType={currentInterviewType}
                totalQuestions={analysis.total_questions}
                answeredQuestions={analysis.answered_questions}
              />
            )}

            <div className="mt-12 flex gap-4 justify-center">
              <button
                onClick={() => router.push(getDashboardUrl())}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </>
        ) : null}
      </div>
    </main>
  )
}
