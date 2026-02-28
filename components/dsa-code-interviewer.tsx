'use client'

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import streams from "@/lib/courses"
import { createClient } from "@/lib/supabase/client"
import { useTextToSpeech } from "@/hooks/use-text-to-speech"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Loader2, RotateCcw, Play, Info } from "lucide-react"
import { InterviewTimer } from "@/components/interview-timer"
import { getInterviewCost } from "@/utils/credits"
import { ExitInterviewDialog } from "./exit-interview-dialog"
import { EvaluationCriteriaDialog } from "./evaluation-criteria-dialog"
import { StartInterviewDialog } from "./start-interview-dialog"
import { useInterviewContext } from "@/contexts/interview-context"

// DSA: only C++, Java, Python
const DSA_LANGUAGES = ["C++", "Java", "Python"] as const

interface DSACodeInterviewerProps {
  interviewType: string
}

interface TranscriptMessage {
  type: "ai" | "user" | "code"
  content: string
  timestamp: Date
  questionNumber?: number
}

export default function DSACodeInterviewer({ interviewType }: DSACodeInterviewerProps) {
  const router = useRouter()
  const supabase = createClient()
  const { speak } = useTextToSpeech({ rate: 0.9 })
  const isAptitude = interviewType.startsWith("aptitude")

  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(5)
  const [userCode, setUserCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [questionHistory, setQuestionHistory] = useState<Array<{ question: string; userCode: string }>>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [showEndConfirmDialog, setShowEndConfirmDialog] = useState(false)
  const [showEvaluationCriteria, setShowEvaluationCriteria] = useState(false)
  const [showStartConfirmDialog, setShowStartConfirmDialog] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<(typeof DSA_LANGUAGES)[number]>("C++")
  const [hasAutoStarted, setHasAutoStarted] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Interview context for navbar communication
  let interviewContext: ReturnType<typeof useInterviewContext> | null = null
  try {
    interviewContext = useInterviewContext()
  } catch {
    // Context not available (component used outside provider)
  }

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await fetch("/api/user/credits")
        const data = await res.json()
        if (res.ok) {
          setBalance(data.balance ?? 0)
        }
      } catch (error) {
        console.error("Error fetching credits in DSACodeInterviewer:", error)
      }
    }
    fetchCredits();

    // Refresh credits every 30 seconds or on pathname change
    const interval = setInterval(fetchCredits, 30000)
    return () => clearInterval(interval)
  }, [pathname]); // Depend on pathname to re-fetch credits when URL changes

  // Read language from URL (set in config modal for DSA)
  useEffect(() => {
    const urlLang = searchParams.get("language")
    if (urlLang && DSA_LANGUAGES.includes(urlLang as (typeof DSA_LANGUAGES)[number])) {
      setSelectedLanguage(urlLang as (typeof DSA_LANGUAGES)[number])
    }
  }, [searchParams])

  // Skip welcome and auto-start when difficulty and duration come from config modal (URL params)
  useEffect(() => {
    if (hasAutoStarted) return
    const urlDuration = searchParams.get("duration")
    const urlDifficulty = searchParams.get("difficulty")
    if (!urlDuration || !urlDifficulty) return

    const durationNum = parseInt(urlDuration, 10)
    const validDurations = [5, 15, 30, 45]
    const validDifficulties = ["beginner", "pro", "expert"]
    if (!validDurations.includes(durationNum) || !validDifficulties.includes(urlDifficulty)) return

    // Don't auto-start if we're resuming an existing interview from URL
    const urlInterviewId = searchParams.get("interviewId")
    const schedId = searchParams.get("scheduledInterviewId") || searchParams.get("scheduleId")
    if (urlInterviewId || schedId) return

    setHasAutoStarted(true)
    setSelectedDuration(durationNum)
    setSelectedDifficulty(urlDifficulty)
    setShowWelcome(false)
    confirmStartInterview(durationNum, urlDifficulty)
  }, [searchParams, hasAutoStarted])

  // Client-side guard: when an interviewId or scheduledInterviewId is present in the URL,
  // check whether a result already exists (redirect to results) or if an in-progress interview exists
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)

      const urlInterviewId = params.get('interviewId')
      if (urlInterviewId) {
        ;(async () => {
          try {
            const res = await fetch(`/api/interview/results?interviewId=${urlInterviewId}`)
            if (res.ok) {
              router.push(`/results?interviewId=${urlInterviewId}`)
              return
            } else {
              setInterviewId(urlInterviewId)
            }
          } catch (err) {
            console.warn('[v0] Error checking DSA interview results for interviewId:', urlInterviewId, err)
          }
        })()
      }

      const schedId = params.get('scheduledInterviewId') || params.get('scheduleId')
      if (schedId) {
        ;(async () => {
          try {
            const res = await fetch(`/api/user/schedule-result?scheduleId=${schedId}`)
            if (res.ok) {
              const data = await res.json()
              if (data.scheduleStatus === 'completed' || data.interviewStatus === 'completed') {
                if (data.interviewId) {
                  router.push(`/results?interviewId=${data.interviewId}`)
                  return
                }
              }

              if (data.interviewId) {
                setInterviewId(data.interviewId)
              }
            }
          } catch (err) {
            console.warn('[v0] Error checking DSA schedule-result for scheduleId:', schedId, err)
          }
        })()
      }

      // Stop any lingering TTS if the user arrived at results
      const stopHandler = () => {
        try {
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel()
          }
        } catch (err) {
          console.warn('[v0] DSA interviewer: failed to cancel TTS on stop event', err)
        }
      }

      window.addEventListener('app:stop-voice-agent', stopHandler as EventListener)
      return () => window.removeEventListener('app:stop-voice-agent', stopHandler as EventListener)
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

    if (!duration || !difficulty) {
      return
    }

    setShowStartConfirmDialog(false)
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        router.push("/auth")
        return
      }

      const cost = getInterviewCost(duration, interviewType);
      if (balance !== null && balance < cost) {
        setError(`Not enough credits. This interview costs ${cost} credits, but you only have ${balance}.`);
        setIsLoading(false);
        return;
      }

      let data: { interview: { id: string; question_count: number }; firstQuestion?: string | null } | null = null
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
          const errorData = await response.json();
          let errorMessage = errorData.error || "Failed to start interview";

          if (response.status === 402) {
            errorMessage = errorData.error || "Not enough credits to start this interview.";
          }

          throw new Error(errorMessage);
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

        const cost = getInterviewCost(duration, interviewType)
        if (interviewContext) {
          interviewContext.setInterviewStarted(true)
          interviewContext.setCreditsUsed(cost)
          interviewContext.setTotalQuestions(inv.question_count || 5)
          interviewContext.setInterviewId(inv.id)
        }

        if (typeof interviewData.firstQuestion === "string" && interviewData.firstQuestion) {
          setCurrentQuestion(interviewData.firstQuestion)
          setQuestionHistory([{ question: interviewData.firstQuestion, userCode: "" }])
          setCurrentQuestionIndex(0)
        } else {
          await generateNextQuestion(inv.id, 1, [], user.id, "initial")
        }
      }
    } catch (error) {
      console.error("Error starting interview:", error)
      setError(error instanceof Error ? error.message : "Failed to start interview")
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

    // Check history first for both "next" and "prev" navigation
    if ((direction === "prev" || direction === "next") && questionHistory[questionNum - 1]) {
      const historicalEntry = questionHistory[questionNum - 1];
      setCurrentQuestion(historicalEntry.question);
      setUserCode(historicalEntry.userCode || "");
      setCurrentQuestionIndex(questionNum - 1);
      setTranscript((prev) => {
        // Filter out messages beyond the current question number when navigating
        return prev.filter(msg => (msg.questionNumber || 0) <= questionNum);
      });
      setIsLoading(false);
      return;
    }

    // If not in history or initial load, fetch new question
    try {
      const response = await fetch("/api/interview/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId: interviewSessionId,
          interviewType,
          questionNumber: questionNum,
          previousAnswers,
          userId: userId,
          isCodingRound: true,
        }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to generate question")
      }

      const data = await response.json()

      if (data?.question) {
        setCurrentQuestion(data.question)
        // Only add to history if moving forward or initial load (and not already in history)
        if (direction !== "prev" && !questionHistory[questionNum - 1]) {
          setQuestionHistory((prev) => {
            const newHistory = [...prev];
            newHistory[questionNum - 1] = { question: data.question, userCode: "" };
            return newHistory;
          });
        }
        setUserCode(""); // Clear user code for new question
        setTranscript((prev) => [
          ...prev,
          {
            type: "ai",
            content: data.question,
            timestamp: new Date(),
            questionNumber: questionNum,
          },
        ])
      } else {
        setError("No question received. Please try again.")
      }
    } catch (error) {
      console.error("Error generating question:", error)
      setError(error instanceof Error ? error.message : "Failed to generate question")
    } finally {
      setIsLoading(false)
    }
  }

  const submitCode = async () => {
    if (!userCode.trim() || !interviewId) return

    setIsLoading(true)

    try {
      // Update history with current user code before submitting
      setQuestionHistory((prev) => {
        const newHistory = [...prev];
        if (newHistory[currentQuestionIndex]) {
          newHistory[currentQuestionIndex].userCode = userCode;
        }
        return newHistory;
      });

      setTranscript((prev) => [
        ...prev,
        {
          type: "code",
          content: userCode,
          timestamp: new Date(),
          questionNumber: currentQuestionIndex + 1,
        },
      ])

      const saveResponse = await fetch("/api/interview/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          question: currentQuestion,
          answer: userCode,
          questionNumber: currentQuestionIndex + 1,
          skipped: false,
        }),
      })

      if (!saveResponse.ok) {
        throw new Error("Failed to save response")
      }

      if (!isAptitude) {
        // Request AI analysis of the code (DSA only)
        const analysisResponse = await fetch("/api/interview/analyze-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewId,
            code: userCode,
            problem: currentQuestion,
            interviewType,
          }),
        })

        if (analysisResponse.ok) {
          const analysisData = await analysisResponse.json()

          setTranscript((prev) => [
            ...prev,
            {
              type: "ai",
              content: analysisData.feedback,
              timestamp: new Date(),
              questionNumber: currentQuestionIndex + 1,
            },
          ])
        }
      }

      setUserCode("")

      if (currentQuestionIndex < totalQuestions - 1) {
        const nextQuestionIndex = currentQuestionIndex + 1
        setCurrentQuestionIndex(nextQuestionIndex)

        // Update questions answered in context
        if (interviewContext) {
          interviewContext.setQuestionsAnswered(nextQuestionIndex)
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          await generateNextQuestion(
            interviewId,
            nextQuestionIndex + 1,
            [{ question: currentQuestion, answer: userCode }],
            user.id,
            "next"
          )
        }
      } else {
        // Update final questions answered count
        if (interviewContext) {
          interviewContext.setQuestionsAnswered(totalQuestions)
        }
        await completeInterview()
      }
    } catch (error) {
      console.error("Error submitting code:", error)
      setError(error instanceof Error ? error.message : "Failed to submit code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < totalQuestions - 1 && interviewId) {
      // Save current question and user code to history before moving next
      setQuestionHistory((prev) => {
        const newHistory = [...prev];
        if (newHistory[currentQuestionIndex]) {
          newHistory[currentQuestionIndex].userCode = userCode;
        }
        return newHistory;
      });

      const nextQuestionIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextQuestionIndex);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // generateNextQuestion will now check history first
        await generateNextQuestion(interviewId, nextQuestionIndex + 1, [], user.id, "next");
      }
    }
  };

  const handlePreviousQuestion = async () => {
    if (currentQuestionIndex > 0 && interviewId) {
      // Save current question and user code to history before moving previous
      setQuestionHistory((prev) => {
        const newHistory = [...prev];
        if (newHistory[currentQuestionIndex]) {
          newHistory[currentQuestionIndex].userCode = userCode;
        }
        return newHistory;
      });

      const prevQuestionIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevQuestionIndex);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await generateNextQuestion(interviewId, prevQuestionIndex + 1, [], user.id, "prev");
      }
    }
  };

  const completeInterview = async () => {
    console.log("[v0] completeInterview: function started.");
    setIsLoading(true)

    try {
      console.log('[v0] completeInterview: interviewId=', interviewId, 'scheduleId=', (new URLSearchParams(window.location.search).get('scheduledInterviewId') || new URLSearchParams(window.location.search).get('scheduleId')))

      if (!interviewId) {
        console.error('[v0] completeInterview: missing interviewId, aborting analysis')
        setError('Analysis failed: interview session missing (no interviewId)')
        setIsLoading(false);
        return
      }

      // Ensure any speech synthesis is cancelled before analysis
      try {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
          window.speechSynthesis.cancel()
        }
      } catch (ttsErr) {
        console.warn('[v0] completeInterview: Failed to cancel TTS before analysis:', ttsErr)
      }

      console.log("[v0] completeInterview: About to call /api/interview/analyze...");
      const analysisResponse = await fetch("/api/interview/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          interviewId,
          interviewType,
          questionsSkipped: 0,
          scheduleId: (new URLSearchParams(window.location.search).get('scheduledInterviewId') || new URLSearchParams(window.location.search).get('scheduleId')) || undefined,
        }),
      })
      console.log("[v0] completeInterview: /api/interview/analyze response received. Status:", analysisResponse.status, "OK:", analysisResponse.ok);

      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json()
        console.log("[v0] completeInterview: Analysis data received successfully:", analysisData);
      } else {
        console.warn('[v0] completeInterview: Analyze failed, navigating to results (page will retry):', analysisResponse.status)
      }
      window.location.href = `/results?interviewId=${interviewId}`
    } catch (error) {
      console.error("[v0] completeInterview: Error in main catch block:", error)
      console.warn("[v0] Navigating to results anyway (page will retry analyze)")
      window.location.href = `/results?interviewId=${interviewId}`
    } finally {
      setIsLoading(false)
      console.log("[v0] completeInterview: function finished (finally block).");
    }
  }

  // Handler for when timer runs out
  const handleTimeUp = () => {
    console.log("[v0] handleTimeUp called. showResults:", showResults);
    if (!showResults) {
      completeInterview()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const { selectionStart, selectionEnd, value } = e.currentTarget;
    const indentation = '  '; // Use 2 spaces for indentation

    if (e.key === 'Tab') {
      e.preventDefault();

      const newValue =
        value.substring(0, selectionStart) +
        indentation +
        value.substring(selectionEnd);

      e.currentTarget.value = newValue;
      e.currentTarget.selectionStart = e.currentTarget.selectionEnd = selectionStart + indentation.length;
      setUserCode(newValue);
    } else if (e.key === 'Enter') {
      e.preventDefault();

      const currentLineStart = value.lastIndexOf('\n', selectionStart - 1) + 1;
      const currentLine = value.substring(currentLineStart, selectionStart);

      const match = currentLine.match(/^(\s*)/);
      const currentIndentation = match ? match[1] : '';

      let newIndentation = currentIndentation;

      if (currentLine.trimEnd().endsWith(':')) {
        newIndentation += indentation;
      }

      const newValue =
        value.substring(0, selectionStart) +
        '\n' +
        newIndentation +
        value.substring(selectionStart);

      e.currentTarget.value = newValue;
      e.currentTarget.selectionStart = e.currentTarget.selectionEnd = selectionStart + 1 + newIndentation.length;
      setUserCode(newValue);
    }
  };

  if (showWelcome) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 max-w-2xl w-full bg-white border border-gray-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">{isAptitude ? "Aptitude Test" : "DSA Test"}</h2>
          <p className="text-gray-600 mb-2">
            Solve coding problems within the time limit. Write your solution and submit for analysis.
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
                  className={`h-16 ${
                    selectedDifficulty === "beginner" ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50 border-gray-200"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold">Beginner</div>
                    <div className="text-xs opacity-80">Basic problems</div>
                  </div>
                </Button>
                <Button
                  onClick={() => setSelectedDifficulty("pro")}
                  variant={selectedDifficulty === "pro" ? "default" : "outline"}
                  className={`h-16 ${
                    selectedDifficulty === "pro" ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50 border-gray-200"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold">Pro</div>
                    <div className="text-xs opacity-80">Intermediate</div>
                  </div>
                </Button>
                <Button
                  onClick={() => setSelectedDifficulty("expert")}
                  variant={selectedDifficulty === "expert" ? "default" : "outline"}
                  className={`h-16 ${
                    selectedDifficulty === "expert" ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50 border-gray-200"
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold">Expert</div>
                    <div className="text-xs opacity-80">Advanced problems</div>
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

          {/* Start Interview Credit Confirmation Dialog */}
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

  const handleRefreshQuestion = async () => {
    if (!interviewId || currentQuestionIndex < 0) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setQuestionHistory((prev) => {
        const next = [...prev]
        delete next[currentQuestionIndex]
        return next
      })
      await generateNextQuestion(interviewId, currentQuestionIndex + 1, [], user.id, "initial")
    }
  }

  const handleReset = () => setUserCode("")

  // ✅ Removed intermediate score card - navigates directly to results page now

  return (
    <div className="flex h-full min-h-0 bg-white">
      {/* Left Panel: Problem */}
      <div className="flex-1 min-w-0 flex flex-col border-r border-gray-200 overflow-hidden">
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Problem</h2>
            <button
              type="button"
              onClick={handleRefreshQuestion}
              disabled={isLoading}
              className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-white hover:border-blue-300 transition-colors"
              aria-label="Refresh problem"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {/* Metadata card: Difficulty, Time, Topics */}
          {(() => {
            const streamId = interviewType.split("-")[0]
            const topicId = interviewType.split("-").slice(1).join("-")
            const stream = streams.find((s) => s.id === streamId)
            const topic = stream?.subcourses.find((sc) => sc.id === topicId)
            const topicLabel = topic?.name || (topicId ? topicId.replace(/-/g, " ") : "Mixed")
            return (
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
            )
          })()}

          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Write a code solution for the problem described below.
            </p>
            <p className="text-gray-900 whitespace-pre-wrap font-medium leading-relaxed">
              {currentQuestion || (isLoading ? "Loading problem..." : "No problem loaded.")}
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

      {/* Right Panel: Code Editor */}
      <div className="flex-1 min-w-0 flex flex-col bg-gray-50">
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as (typeof DSA_LANGUAGES)[number])}
              className="px-3 py-2 text-sm font-medium bg-white border border-gray-200 text-gray-700 rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {DSA_LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
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

        <div className="flex-1 flex flex-col min-h-0 p-4">
          <div className="flex-1 flex flex-col min-h-[200px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex flex-1 min-h-0 font-mono text-sm">
              <div className="flex-shrink-0 w-12 py-4 pl-4 pr-2 text-right text-gray-400 select-none border-r border-gray-200 bg-gray-50">
                {Array.from({ length: Math.max(1, (userCode.match(/\n/g)?.length ?? 0) + 1) }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <Textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write your code here..."
                className="flex-1 min-h-full resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 py-4 pl-4 pr-6 bg-white"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Reset
              </Button>
              <Button
                onClick={submitCode}
                disabled={isLoading || userCode.trim() === ""}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Compile & Run
              </Button>
            </div>
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
              <Button
                onClick={submitCode}
                disabled={isLoading || userCode.trim() === ""}
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
      </div>

      <EvaluationCriteriaDialog
        open={showEvaluationCriteria}
        onOpenChange={setShowEvaluationCriteria}
        interviewType={interviewType}
      />
      {/* End Interview Confirmation Dialog */}
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
