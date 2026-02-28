'use client'

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import streams from "@/lib/courses"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Loader2, RotateCcw, Check, Info } from "lucide-react"
import { InterviewTimer } from "@/components/interview-timer"
import { getInterviewCost } from "@/utils/credits"
import { ExitInterviewDialog } from "./exit-interview-dialog"
import { EvaluationCriteriaDialog } from "./evaluation-criteria-dialog"
import { StartInterviewDialog } from "./start-interview-dialog"
import { useInterviewContext } from "@/contexts/interview-context"

export interface MCQOption {
  key: string
  text: string
}

export interface MCQQuestion {
  question: string
  options: MCQOption[]
  correctAnswer?: string
}

interface AptitudeMCQInterviewerProps {
  interviewType: string
}

interface QuestionHistoryEntry {
  question: string
  options: MCQOption[]
  correctAnswer?: string
  selectedOption: string
}

function parseMCQResponse(data: { question?: string; options?: MCQOption[]; correctAnswer?: string }): MCQQuestion | null {
  if (!data?.question) return null
  const options = Array.isArray(data.options) && data.options.length >= 2
    ? data.options
    : null
  return {
    question: data.question,
    options: options || [],
    correctAnswer: data.correctAnswer,
  }
}

export default function AptitudeMCQInterviewer({ interviewType }: AptitudeMCQInterviewerProps) {
  const router = useRouter()
  const supabase = createClient()

  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [currentMCQ, setCurrentMCQ] = useState<MCQQuestion | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(5)
  const [selectedOption, setSelectedOption] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [questionHistory, setQuestionHistory] = useState<Record<number, QuestionHistoryEntry>>({})
  const [error, setError] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [showEndConfirmDialog, setShowEndConfirmDialog] = useState(false)
  const [showEvaluationCriteria, setShowEvaluationCriteria] = useState(false)
  const [showStartConfirmDialog, setShowStartConfirmDialog] = useState(false)
  const [hasAutoStarted, setHasAutoStarted] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  let interviewContext: ReturnType<typeof useInterviewContext> | null = null
  try {
    interviewContext = useInterviewContext()
  } catch {
    // Context not available
  }

  const streamId = interviewType.split("-")[0]
  const topicId = interviewType.split("-").slice(1).join("-")
  const stream = streams.find((s) => s.id === streamId)
  const topic = stream?.subcourses.find((sc) => sc.id === topicId)
  const topicLabel = topic?.name || (topicId ? topicId.replace(/-/g, " ") : "Mixed")

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch("/api/user/credits")
        const data = await res.json()
        if (res.ok) setBalance(data.balance ?? 0)
      } catch (err) {
        console.error("Error fetching credits:", err)
      }
    }
    fetchCredits()
    const interval = setInterval(fetchCredits, 30000)
    return () => clearInterval(interval)
  }, [pathname])

  useEffect(() => {
    if (hasAutoStarted) return
    const urlDuration = searchParams.get("duration")
    const urlDifficulty = searchParams.get("difficulty")
    if (!urlDuration || !urlDifficulty) return

    const durationNum = parseInt(urlDuration, 10)
    const validDurations = [5, 15, 30, 45]
    const validDifficulties = ["beginner", "pro", "expert"]
    if (!validDurations.includes(durationNum) || !validDifficulties.includes(urlDifficulty)) return

    const urlInterviewId = searchParams.get("interviewId")
    const schedId = searchParams.get("scheduledInterviewId") || searchParams.get("scheduleId")
    if (urlInterviewId || schedId) return

    setHasAutoStarted(true)
    setSelectedDuration(durationNum)
    setSelectedDifficulty(urlDifficulty)
    setShowWelcome(false)
    confirmStartInterview(durationNum, urlDifficulty)
  }, [searchParams, hasAutoStarted])

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const urlInterviewId = params.get("interviewId")
    if (urlInterviewId) {
      ;(async () => {
        try {
          const res = await fetch(`/api/interview/results?interviewId=${urlInterviewId}`)
          if (res.ok) {
            router.push(`/results?interviewId=${urlInterviewId}`)
            return
          }
          setInterviewId(urlInterviewId)
        } catch (err) {
          console.warn("Error checking results:", err)
        }
      })()
    }

    const schedId = params.get("scheduledInterviewId") || params.get("scheduleId")
    if (schedId) {
      ;(async () => {
        try {
          const res = await fetch(`/api/user/schedule-result?scheduleId=${schedId}`)
          if (res.ok) {
            const data = await res.json()
            if (data.scheduleStatus === "completed" || data.interviewStatus === "completed") {
              if (data.interviewId) router.push(`/results?interviewId=${data.interviewId}`)
              return
            }
            if (data.interviewId) setInterviewId(data.interviewId)
          }
        } catch (err) {
          console.warn("Error checking schedule:", err)
        }
      })()
    }
  }, [])

  const handleStartClick = (duration: number) => {
    if (!selectedDifficulty) {
      setError("Please select a difficulty level")
      return
    }
    setSelectedDuration(duration)
    setShowStartConfirmDialog(true)
  }

  const confirmStartInterview = async (durationOverride?: number, difficultyOverride?: string) => {
    const duration = durationOverride ?? selectedDuration
    const difficulty = difficultyOverride ?? selectedDifficulty
    if (!duration || !difficulty) return

    setShowStartConfirmDialog(false)
    setIsLoading(true)
    setError(null)

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        router.push("/auth")
        return
      }

      const cost = getInterviewCost(duration, interviewType)
      if (balance !== null && balance < cost) {
        setError(`Not enough credits. This interview costs ${cost} credits, but you only have ${balance}.`)
        setIsLoading(false)
        return
      }

      let data: { interview: { id: string; question_count: number }; firstQuestion?: string | { question: string; options: MCQOption[]; correctAnswer?: string } | null } | null = null
      const preloadRaw = typeof window !== "undefined" ? sessionStorage.getItem("interview_preload") : null
      if (preloadRaw) {
        try {
          const preload = JSON.parse(preloadRaw)
          if (preload?.interviewType === interviewType && preload?.interview?.id) {
            sessionStorage.removeItem("interview_preload")
            data = { interview: preload.interview, firstQuestion: preload.firstQuestion ?? null }
          } else {
            throw new Error("Preload mismatch")
          }
        } catch {
          data = null as any
        }
      }

      if (!data) {
        const response = await fetch("/api/interview/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewType,
            userId: user.id,
            userEmail: user.email,
            userName: user.user_metadata?.name || user.email?.split("@")[0],
            duration,
            difficulty,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to start interview")
        }

        data = await response.json()
      }

      const interviewData = data
      if (interviewData?.interview) {
        const inv = interviewData.interview
        setInterviewId(inv.id)
        setTotalQuestions(inv.question_count || 5)
        setShowWelcome(false)
        setSelectedDuration(duration)
        setSelectedDifficulty(difficulty)

        if (interviewContext) {
          interviewContext.setInterviewStarted(true)
          interviewContext.setCreditsUsed(cost)
          interviewContext.setTotalQuestions(inv.question_count || 5)
          interviewContext.setInterviewId(inv.id)
        }

        const mcq = interviewData.firstQuestion && typeof interviewData.firstQuestion === "object" && interviewData.firstQuestion?.question
          ? parseMCQResponse(interviewData.firstQuestion)
          : null
        if (mcq) {
          setCurrentMCQ(mcq)
          setSelectedOption("")
          setCurrentQuestionIndex(0)
          setQuestionHistory((prev) => ({ ...prev, 0: { question: mcq.question, options: mcq.options, correctAnswer: mcq.correctAnswer, selectedOption: "" } }))
        } else {
          await generateNextQuestion(inv.id, 1, [], user.id, "initial")
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start interview")
    } finally {
      setIsLoading(false)
    }
  }

  const generateNextQuestion = async (
    interviewSessionId: string,
    questionNum: number,
    previousAnswers: Array<{ question: string; answer: string }>,
    userId: string,
    direction: "next" | "prev" | "initial" = "initial"
  ) => {
    setIsLoading(true)
    setError(null)

    const hist = questionHistory[questionNum - 1]
    if ((direction === "prev" || direction === "next") && hist) {
      setCurrentMCQ({ question: hist.question, options: hist.options, correctAnswer: hist.correctAnswer })
      setSelectedOption(hist.selectedOption)
      setCurrentQuestionIndex(questionNum - 1)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/interview/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: interviewSessionId,
          interviewType,
          questionNumber: questionNum,
          previousAnswers,
          userId,
          isCodingRound: false,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to generate question")
      }

      const data = await response.json()
      const mcq = parseMCQResponse(data)

      if (mcq) {
        setCurrentMCQ(mcq)
        setSelectedOption("")
        if (direction !== "prev" && !questionHistory[questionNum - 1]) {
          setQuestionHistory((prev) => ({
            ...prev,
            [questionNum - 1]: {
              question: mcq.question,
              options: mcq.options,
              correctAnswer: mcq.correctAnswer,
              selectedOption: "",
            },
          }))
        }
      } else {
        setError("No valid question received. Please try again.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate question")
    } finally {
      setIsLoading(false)
    }
  }

  const submitAnswer = async () => {
    if (!selectedOption || !currentMCQ || !interviewId) return

    setIsLoading(true)

    try {
      const questionPayload = JSON.stringify({
        question: currentMCQ.question,
        options: currentMCQ.options,
        correctAnswer: currentMCQ.correctAnswer,
      })

      setQuestionHistory((prev) => ({
        ...prev,
        [currentQuestionIndex]: {
          question: currentMCQ.question,
          options: currentMCQ.options,
          correctAnswer: currentMCQ.correctAnswer,
          selectedOption,
        },
      }))

      const saveResponse = await fetch("/api/interview/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          question: questionPayload,
          answer: selectedOption,
          questionNumber: currentQuestionIndex + 1,
          skipped: false,
        }),
      })

      if (!saveResponse.ok) throw new Error("Failed to save response")

      setSelectedOption("")

      if (currentQuestionIndex < totalQuestions - 1) {
        const nextIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextIndex)
        if (interviewContext) interviewContext.setQuestionsAnswered(nextIndex)

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await generateNextQuestion(
            interviewId,
            nextIndex + 1,
            [{ question: currentMCQ.question, answer: selectedOption }],
            user.id,
            "next"
          )
        }
      } else {
        if (interviewContext) interviewContext.setQuestionsAnswered(totalQuestions)
        await completeInterview()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit answer")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < totalQuestions - 1 && interviewId) {
      setQuestionHistory((prev) => ({
        ...prev,
        [currentQuestionIndex]: {
          question: currentMCQ!.question,
          options: currentMCQ!.options,
          correctAnswer: currentMCQ!.correctAnswer,
          selectedOption,
        },
      }))
      const nextIndex = currentQuestionIndex + 1
      setCurrentQuestionIndex(nextIndex)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await generateNextQuestion(interviewId, nextIndex + 1, [], user.id, "next")
    }
  }

  const handlePreviousQuestion = async () => {
    if (currentQuestionIndex > 0 && interviewId) {
      setQuestionHistory((prev) => ({
        ...prev,
        [currentQuestionIndex]: {
          question: currentMCQ!.question,
          options: currentMCQ!.options,
          correctAnswer: currentMCQ!.correctAnswer,
          selectedOption,
        },
      }))
      const prevIndex = currentQuestionIndex - 1
      setCurrentQuestionIndex(prevIndex)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) await generateNextQuestion(interviewId, prevIndex + 1, [], user.id, "prev")
    }
  }

  const completeInterview = async () => {
    setIsLoading(true)
    try {
      if (!interviewId) {
        setError("Analysis failed: session missing")
        setIsLoading(false)
        return
      }

      const analysisResponse = await fetch("/api/interview/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          interviewId,
          interviewType,
          questionsSkipped: 0,
          scheduleId: searchParams.get("scheduledInterviewId") || searchParams.get("scheduleId") || undefined,
        }),
      })

      if (!analysisResponse.ok) {
        console.warn("[v0] Analyze failed, navigating anyway (results page will retry)")
      }
      window.location.href = `/results?interviewId=${interviewId}`
    } catch (err) {
      console.warn("[v0] Analyze error, navigating anyway (results page will retry):", err)
      window.location.href = `/results?interviewId=${interviewId}`
    } finally {
      setIsLoading(false)
    }
  }

  const handleTimeUp = () => completeInterview()

  const handleRefreshQuestion = async () => {
    if (!interviewId || currentQuestionIndex < 0) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setQuestionHistory((prev) => {
        const next = { ...prev }
        delete next[currentQuestionIndex]
        return next
      })
      await generateNextQuestion(interviewId, currentQuestionIndex + 1, [], user.id, "initial")
    }
  }

  if (showWelcome) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-2xl w-full bg-white border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Aptitude Test</h2>
          <p className="text-gray-600 mb-2">
            Answer multiple-choice questions within the time limit. Select your answer and submit.
          </p>
          <p className="text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded-md p-2 mb-6 inline-block">
            💡 <strong>Note:</strong> For the best experience, we recommend using <strong>Microsoft Edge</strong>.
          </p>

          <div className="space-y-6 mb-6">
            <div>
              <p className="font-semibold mb-3 text-gray-900">Difficulty:</p>
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => setSelectedDifficulty("beginner")}
                  variant={selectedDifficulty === "beginner" ? "default" : "outline"}
                  className={selectedDifficulty === "beginner" ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50 border-gray-200"}
                >
                  <div className="text-center">
                    <div className="font-bold">Beginner</div>
                    <div className="text-xs opacity-80">Basic questions</div>
                  </div>
                </Button>
                <Button
                  onClick={() => setSelectedDifficulty("pro")}
                  variant={selectedDifficulty === "pro" ? "default" : "outline"}
                  className={selectedDifficulty === "pro" ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50 border-gray-200"}
                >
                  <div className="text-center">
                    <div className="font-bold">Pro</div>
                    <div className="text-xs opacity-80">Intermediate</div>
                  </div>
                </Button>
                <Button
                  onClick={() => setSelectedDifficulty("expert")}
                  variant={selectedDifficulty === "expert" ? "default" : "outline"}
                  className={selectedDifficulty === "expert" ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50 border-gray-200"}
                >
                  <div className="text-center">
                    <div className="font-bold">Expert</div>
                    <div className="text-xs opacity-80">Advanced questions</div>
                  </div>
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-semibold text-gray-900">Test Duration:</p>
            <div className="grid grid-cols-3 gap-4">
              {[15, 30, 45].map((duration) => (
                <Button
                  key={duration}
                  onClick={() => handleStartClick(duration)}
                  disabled={isLoading || !selectedDifficulty}
                  className="h-20"
                >
                  {duration} minutes
                </Button>
              ))}
            </div>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </div>

          <StartInterviewDialog
            isOpen={showStartConfirmDialog}
            onClose={() => setShowStartConfirmDialog(false)}
            onConfirm={confirmStartInterview}
            creditCost={selectedDuration ? getInterviewCost(selectedDuration, interviewType) : 0}
            currentBalance={balance ?? 0}
            duration={selectedDuration ?? 15}
            difficulty={selectedDifficulty ?? "intermediate"}
            interviewType={interviewType}
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 bg-white">
      {/* Left Panel: Question */}
      <div className="flex-1 min-w-0 flex flex-col border-r border-gray-200 overflow-hidden">
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Question</h2>
            <button
              type="button"
              onClick={handleRefreshQuestion}
              disabled={isLoading}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:border-blue-300 transition-colors"
              aria-label="Refresh question"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div>
              <span className="text-xs font-medium text-blue-600 uppercase">Difficulty</span>
              <p className="text-sm font-semibold text-gray-900 capitalize">{selectedDifficulty || "—"}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-blue-600 uppercase">Time</span>
              <p className="text-sm font-semibold text-gray-900">{selectedDuration ? `${selectedDuration} mins` : "—"}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-blue-600 uppercase">Topics</span>
              <p className="text-sm font-semibold text-gray-900 capitalize">{topicLabel}</p>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 text-sm">Select the correct answer from the options below.</p>
            <p className="text-gray-900 whitespace-pre-wrap font-medium leading-relaxed">
              {currentMCQ?.question || (isLoading ? "Loading question..." : "No question loaded.")}
            </p>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  type="button"
                  onClick={async () => {
                    setError(null)
                    const { data: { user } } = await supabase.auth.getUser()
                    if (user && interviewId) {
                      await generateNextQuestion(interviewId, currentQuestionIndex + 1, [], user.id, "initial")
                    }
                  }}
                  className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Options */}
      <div className="flex-1 min-w-0 flex flex-col bg-gray-50">
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            {selectedDuration && (
              <div className="relative">
                <InterviewTimer durationMinutes={selectedDuration} onTimeUp={handleTimeUp} />
              </div>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => setShowEvaluationCriteria(true)}
            disabled={isLoading}
            className="border-blue-200 text-blue-700 hover:bg-blue-50"
          >
            <Info className="w-4 h-4 mr-2" />
            Evaluation Criteria
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowEndConfirmDialog(true)}
            disabled={isLoading || !interviewId}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Exit Test
          </Button>
        </div>

        <div className="flex-1 flex flex-col min-h-0 p-4 overflow-y-auto">
          <div className="space-y-3">
            {currentMCQ?.options?.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => !isLoading && setSelectedOption(opt.key)}
                disabled={isLoading}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                  selectedOption === opt.key
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                }`}
              >
                <span className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold text-sm ${
                  selectedOption === opt.key ? "border-blue-600 bg-blue-600 text-white" : "border-gray-300"
                }`}>
                  {selectedOption === opt.key ? <Check className="w-4 h-4" /> : opt.key}
                </span>
                <span className="flex-1 pt-0.5">{opt.text}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3 mt-6">
            <div className="flex gap-2">
              <Button
                onClick={handlePreviousQuestion}
                disabled={isLoading || currentQuestionIndex === 0}
                variant="outline"
                size="sm"
                className="border-gray-300"
              >
                Previous
              </Button>
              <Button
                onClick={handleNextQuestion}
                disabled={isLoading || currentQuestionIndex === totalQuestions - 1}
                variant="outline"
                size="sm"
                className="border-gray-300"
              >
                Next
              </Button>
            </div>
            <Button
              onClick={submitAnswer}
              disabled={isLoading || !selectedOption}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </div>
      </div>

      <EvaluationCriteriaDialog
        open={showEvaluationCriteria}
        onOpenChange={setShowEvaluationCriteria}
        interviewType={interviewType}
      />
      <ExitInterviewDialog
        isOpen={showEndConfirmDialog}
        onClose={() => setShowEndConfirmDialog(false)}
        onConfirm={() => {
          setShowEndConfirmDialog(false)
          completeInterview()
        }}
        isInterviewStarted={!showWelcome}
        creditsUsed={selectedDuration ? getInterviewCost(selectedDuration, interviewType) : 0}
      />
    </div>
  )
}
