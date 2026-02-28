"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import AvatarVideoPlayer, { type AvatarVideoPlayerRef } from "./avatar-video-player"
import streams from "@/lib/courses"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, RotateCcw, Mic, Info, Play, RefreshCw, MicOff } from "lucide-react"
import { ExitInterviewDialog } from "./exit-interview-dialog"
import { EvaluationCriteriaDialog } from "./evaluation-criteria-dialog"
import { StartInterviewDialog } from "./start-interview-dialog"
import { useInterviewContext } from "@/contexts/interview-context"
import { getInterviewCost } from "@/utils/credits"

const LANGUAGES = ["Python", "JavaScript", "Java", "C++"] as const

// Prevent double-speak of intro (e.g. React Strict Mode remount)
let _lastCodingIntroSpokeAt = 0

interface CodingRoundInterviewerProps {
  interviewType: string
  courseTitle?: string
}

interface TranscriptMessage {
  type: "ai" | "user" | "code"
  content: string
  timestamp: Date
  questionNumber?: number
}

function getCourseContext(interviewType: string): { title: string; language: string } {
  const parts = interviewType.split("-")
  const streamId = parts[0]
  const topicId = parts.slice(1).join("-")
  const stream = streams.find((s) => s.id === streamId)
  const topic = stream?.subcourses.find((sc) => sc.id === topicId)
  const topicLabel = topic?.name || (topicId ? topicId.replace(/-/g, " ") : "Coding")
  const streamLabel = stream?.title || streamId
  return {
    title: topic ? `${streamLabel} | ${topicLabel}` : `${streamLabel} | Coding`,
    language: "PYTHON",
  }
}

export default function CodingRoundInterviewer({
  interviewType,
  courseTitle,
}: CodingRoundInterviewerProps) {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const avatarRef = useRef<AvatarVideoPlayerRef>(null)
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null)

  const urlDuration = parseInt(searchParams.get("duration") || "15")
  const urlDifficulty = searchParams.get("difficulty") || "beginner"
  const urlInterviewer = (searchParams.get("interviewer") || "claire").replace("vivek", "claire")
  const urlTopics = searchParams.get("topics")?.split(",").filter(Boolean) || []
  const urlSubcourse = searchParams.get("subcourse")
  const urlLanguage = searchParams.get("language") || "Python"

  const [interviewId, setInterviewId] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState("")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState(6)
  const [userCode, setUserCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showWelcome, setShowWelcome] = useState(true)
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([])
  const [questionHistory, setQuestionHistory] = useState<Array<{ question: string; userCode: string }>>([])
  // New flow: code problem → 5 concept Qs per code. phase = "code" | "concept"
  const [phase, setPhase] = useState<"code" | "concept">("code")
  const [currentCodeIndex, setCurrentCodeIndex] = useState(0)
  const [currentConceptIndex, setCurrentConceptIndex] = useState(0)
  const [conceptHistory, setConceptHistory] = useState<Array<{ question: string; answer: string }>>([])
  const [codingProblemsCount, setCodingProblemsCount] = useState(1)
  const [lastSubmittedCode, setLastSubmittedCode] = useState("")
  const [lastSubmittedProblem, setLastSubmittedProblem] = useState("")
  // Speech for concept answers - create fresh instance per session to avoid Chrome restart issues
  const recognitionRef = useRef<any>(null)
  const liveTranscriptRef = useRef<string>("")
  const interimTranscriptRef = useRef<string>("")
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [showEndConfirmDialog, setShowEndConfirmDialog] = useState(false)
  const [showEvaluationCriteria, setShowEvaluationCriteria] = useState(false)
  const [showStartConfirmDialog, setShowStartConfirmDialog] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<(typeof LANGUAGES)[number]>(
    LANGUAGES.includes(urlLanguage as (typeof LANGUAGES)[number]) ? (urlLanguage as (typeof LANGUAGES)[number]) : "Python"
  )
  const [hasAutoStarted, setHasAutoStarted] = useState(false)
  const [hasStartedCoding, setHasStartedCoding] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(urlDuration * 60)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [executeOutput, setExecuteOutput] = useState<{ stdout: string; stderr: string } | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [lastSpokenText, setLastSpokenText] = useState<string>("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const speakInProgressRef = useRef(false)
  const speakAbortRef = useRef<AbortController | null>(null)
  const introSpokenRef = useRef(false)

  let interviewContext: ReturnType<typeof useInterviewContext> | null = null
  try {
    interviewContext = useInterviewContext()
  } catch {
    // Context not available
  }

  // Map interviewer to voice (Claire uses INWORLD_VOICE_ID_CLAIRE; Vivek uses INWORLD_VOICE_ID)
  const interviewerToVoice: Record<string, string> = {
    claire: "claire",
    john: "alex",
    emma: "ashley",
    payal: "ashley",
    kapil: "alex",
  }
  const voiceId = interviewerToVoice[urlInterviewer] || "claire"

  // TTS using /api/tts - avatar syncs with audio (playSpeaking only when audio actually plays)
  const speakText = useCallback(async (text: string): Promise<void> => {
    if (!text?.trim()) return
    // Abort any in-flight TTS request to prevent double audio
    if (speakAbortRef.current) speakAbortRef.current.abort()
    const controller = new AbortController()
    speakAbortRef.current = controller

    window.speechSynthesis?.cancel()
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause()
      ttsAudioRef.current.currentTime = 0
      ttsAudioRef.current = null
    }
    speakInProgressRef.current = true
    setIsSpeaking(true)

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
        signal: controller.signal,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        console.warn("TTS failed, falling back to browser:", errData)
        throw new Error(errData.error || "TTS failed")
      }

      const data = await response.json()
      const audioContent = data.audioContent

      if (audioContent) {
        if (controller.signal.aborted) return
        const audioBlob = new Blob(
          [Uint8Array.from(atob(audioContent), (c) => c.charCodeAt(0))],
          { type: "audio/mp3" }
        )
        const audioUrl = URL.createObjectURL(audioBlob)

        return new Promise((resolve) => {
          const audio = new Audio(audioUrl)
          ttsAudioRef.current = audio
          // Avatar speaks ONLY when audio actually plays - syncs lip movement with sound
          avatarRef.current?.playSpeaking()

          audio.onended = () => {
            speakInProgressRef.current = false
            setIsSpeaking(false)
            avatarRef.current?.playIdle()
            ttsAudioRef.current = null
            URL.revokeObjectURL(audioUrl)
            resolve()
          }

          audio.onerror = () => {
            speakInProgressRef.current = false
            setIsSpeaking(false)
            avatarRef.current?.playIdle()
            ttsAudioRef.current = null
            URL.revokeObjectURL(audioUrl)
            resolve()
          }

          audio.play().catch((e) => {
            if (e?.name === "AbortError") { resolve(); return }
            speakInProgressRef.current = false
            setIsSpeaking(false)
            avatarRef.current?.playIdle()
            ttsAudioRef.current = null
            resolve()
          })
        })
      }

      // Fallback to browser TTS - avatar syncs when we start speaking
      if (controller.signal.aborted) return
      return new Promise((resolve) => {
        if ("speechSynthesis" in window) {
          avatarRef.current?.playSpeaking()
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.rate = 0.9
          utterance.onend = () => {
            speakInProgressRef.current = false
            setIsSpeaking(false)
            avatarRef.current?.playIdle()
            resolve()
          }
          utterance.onerror = () => {
            speakInProgressRef.current = false
            setIsSpeaking(false)
            avatarRef.current?.playIdle()
            resolve()
          }
          window.speechSynthesis.speak(utterance)
        } else {
          speakInProgressRef.current = false
          setIsSpeaking(false)
          avatarRef.current?.playIdle()
          resolve()
        }
      })
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return
      speakInProgressRef.current = false
      setIsSpeaking(false)
      avatarRef.current?.playIdle()
      return Promise.resolve()
    } finally {
      if (speakAbortRef.current === controller) speakAbortRef.current = null
    }
  }, [voiceId])

  const { title: contextTitle, language: contextLanguage } = getCourseContext(interviewType)
  const displayTitle = courseTitle || contextTitle

  // Stop voice when navbar exit or global stop is triggered
  useEffect(() => {
    const handler = () => {
      window.speechSynthesis?.cancel()
      ttsAudioRef.current?.pause()
      ttsAudioRef.current = null
      avatarRef.current?.stopAll()
    }
    window.addEventListener("app:stop-voice-agent", handler)
    return () => window.removeEventListener("app:stop-voice-agent", handler)
  }, [])

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
  }, [])

  const handleStartAnswer = () => {
    if (phase !== "concept" || isSpeaking || isLoading) return
    const SpeechRecognition = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    if (!SpeechRecognition) return

    setError(null)
    liveTranscriptRef.current = ""
    interimTranscriptRef.current = ""

    // Create fresh instance each time - Chrome has issues restarting after stop()
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0]?.transcript?.trim() || ""
        if (event.results[i].isFinal) {
          liveTranscriptRef.current += (liveTranscriptRef.current ? " " : "") + transcript
          interimTranscriptRef.current = ""
        } else {
          interimTranscriptRef.current = transcript
        }
      }
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
      setIsRecording(true)
    } catch (e) {
      console.warn("Speech recognition start failed:", e)
    }
  }

  const handleEndAnswer = async () => {
    if (!isRecording) return
    const rec = recognitionRef.current
    recognitionRef.current = null
    try { rec?.stop() } catch (_) {}
    setIsRecording(false)
    // Allow time for final results to arrive after stop
    await new Promise((r) => setTimeout(r, 400))
    const final = liveTranscriptRef.current.trim() || interimTranscriptRef.current.trim() || "No speech detected"
    if (final && final !== "No speech detected") await processConceptAnswer(final)
    else if (final === "No speech detected") setError("No speech detected. Please try again and speak clearly.")
  }

  useEffect(() => {
    if (!showWelcome && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [showWelcome, timeRemaining])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  useEffect(() => {
    if (hasAutoStarted) return
    const urlDurationParam = searchParams.get("duration")
    const urlDifficultyParam = searchParams.get("difficulty")
    if (!urlDurationParam || !urlDifficultyParam) return

    const durationNum = parseInt(urlDurationParam, 10)
    const validDurations = [5, 15, 30]
    const validDifficulties = ["beginner", "pro", "expert"]
    if (!validDurations.includes(durationNum) || !validDifficulties.includes(urlDifficultyParam)) return

    const urlInterviewId = searchParams.get("interviewId")
    const schedId = searchParams.get("scheduledInterviewId") || searchParams.get("scheduleId")
    if (urlInterviewId || schedId) return

    setHasAutoStarted(true)
    setSelectedDuration(durationNum)
    setSelectedDifficulty(urlDifficultyParam)
    setShowWelcome(false)
    confirmStartInterview(durationNum, urlDifficultyParam)
  }, [searchParams, hasAutoStarted])

  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const urlInterviewId = params.get("interviewId")
    if (urlInterviewId) {
      fetch(`/api/interview/results?interviewId=${urlInterviewId}`)
        .then((res) => {
          if (res.ok) router.push(`/results?interviewId=${urlInterviewId}`)
          else {
            // No results yet (e.g. unattended/abandoned interview) - redirect to results page
            // which will trigger generateAnalysis and create the analysis
            router.push(`/results?interviewId=${urlInterviewId}`)
          }
        })
        .catch(() => router.push(`/results?interviewId=${urlInterviewId}`))
    }
    const schedId = params.get("scheduledInterviewId") || params.get("scheduleId")
    if (schedId) {
      fetch(`/api/user/schedule-result?scheduleId=${schedId}`)
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data) => {
          if (data?.scheduleStatus === "completed" || data?.interviewStatus === "completed") {
            if (data.interviewId) router.push(`/results?interviewId=${data.interviewId}`)
          } else if (data?.interviewId) {
            setInterviewId(data.interviewId)
          }
        })
        .catch(() => {})
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
        setError(`Not enough credits. This interview costs ${cost} credits.`)
        setIsLoading(false)
        return
      }

      let data: { interview: { id: string; question_count: number }; firstQuestion?: string | null }
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
            round: "coding",
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to start interview")
        }

        data = await response.json()
      }

      if (data.interview) {
        const qCount = data.interview.question_count || 6
        const codeCount = qCount === 6 ? 1 : qCount === 12 ? 2 : 3
        setInterviewId(data.interview.id)
        setTotalQuestions(qCount)
        setCodingProblemsCount(codeCount)
        setShowWelcome(false)
        setSelectedDuration(duration)
        setSelectedDifficulty(difficulty)
        setTimeRemaining(duration * 60)
        setPhase("code")
        setCurrentCodeIndex(0)
        setCurrentConceptIndex(0)
        setConceptHistory([])

        if (interviewContext) {
          interviewContext.setInterviewStarted(true)
          interviewContext.setCreditsUsed(cost)
          interviewContext.setTotalQuestions(qCount)
          interviewContext.setInterviewId(data.interview.id)
        }

        if (data.firstQuestion) {
          setCurrentQuestion(data.firstQuestion)
          const codeBlockMatch = data.firstQuestion.match(/```[\w]*\n([\s\S]*?)```/)
          const initialCode = codeBlockMatch ? codeBlockMatch[1].trim() : ""
          setQuestionHistory([{ question: data.firstQuestion, userCode: initialCode }])
          setUserCode(initialCode)
          setTranscript((prev) => [
            ...prev,
            { type: "ai", content: data.firstQuestion!, timestamp: new Date(), questionNumber: 1 },
          ])
          const spokenIntro = initialCode
            ? "Here's code with a bug. Fix it in the editor."
            : "Here's your coding problem. Take a look and solve it in the editor."
          setLastSpokenText(spokenIntro)
          const now = Date.now()
          if (!introSpokenRef.current && now - _lastCodingIntroSpokeAt > 2000) {
            introSpokenRef.current = true
            _lastCodingIntroSpokeAt = now
            await speakText(spokenIntro)
          }
        } else {
          await generateNextCodingProblem(data.interview.id, 1, [], user.id)
        }
      }
    } catch (err) {
      console.error("Error starting interview:", err)
      setError(err instanceof Error ? err.message : "Failed to start interview")
    } finally {
      setIsLoading(false)
    }
  }

  const generateNextCodingProblem = async (
    interviewSessionId: string,
    codingProblemNum: number,
    previousCodeProblems: Array<{ question: string; answer: string }>,
    userId: string
  ) => {
    setIsLoading(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        interviewId: interviewSessionId,
        interviewType,
        questionNumber: (codingProblemNum - 1) * 6 + 1,
        previousAnswers: previousCodeProblems,
        userId,
        isCodingRound: true,
        codingProblemIndex: codingProblemNum,
        ...(codingProblemsCount === 1 && { useFixBuggyVariant: Math.random() < 0.5 }),
      }
      if (urlTopics.length > 0) body.topics = urlTopics
      if (urlSubcourse) body.subcourse = urlSubcourse

      const response = await fetch("/api/interview/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "Failed to generate question")
      }

      const data = await response.json()
      if (data?.question) {
        setCurrentQuestion(data.question)
        // For "fix buggy code" problems, extract and pre-fill the buggy code from the first code block
        let initialCode = ""
        const codeBlockMatch = data.question.match(/```[\w]*\n([\s\S]*?)```/)
        if (codeBlockMatch) {
          initialCode = codeBlockMatch[1].trim()
        }
        setQuestionHistory((prev) => {
          const next = [...prev]
          next[codingProblemNum - 1] = { question: data.question, userCode: initialCode }
          return next
        })
        setUserCode(initialCode)
        setTranscript((prev) => [
          ...prev,
          { type: "ai", content: data.question, timestamp: new Date(), questionNumber: (codingProblemNum - 1) * 6 + 1 },
        ])
        const spokenIntro = initialCode
          ? "Here's code with a bug. Fix it in the editor."
          : "Here's your coding problem. Take a look and solve it in the editor."
        setLastSpokenText(spokenIntro)
        const now = Date.now()
        if (!introSpokenRef.current && now - _lastCodingIntroSpokeAt > 2000) {
          introSpokenRef.current = true
          _lastCodingIntroSpokeAt = now
          await speakText(spokenIntro)
        }
      } else {
        setError("No question received. Please try again.")
      }
    } catch (err) {
      console.error("Error generating coding problem:", err)
      setError(err instanceof Error ? err.message : "Failed to generate question")
    } finally {
      setIsLoading(false)
    }
  }

  const generateConceptQuestion = async (
    conceptIndexOverride?: number,
    codeOverride?: string,
    problemOverride?: string
  ) => {
    const code = codeOverride ?? lastSubmittedCode
    const problem = problemOverride ?? lastSubmittedProblem
    if (!interviewId || !code || !problem) return
    setIsLoading(true)
    setError(null)
    const idx = conceptIndexOverride ?? currentConceptIndex + 1
    try {
      const res = await fetch("/api/interview/concept-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          problem,
          userCode: code,
          conceptIndex: idx,
          previousConceptQAndA: conceptHistory,
        }),
      })
      if (!res.ok) throw new Error("Failed to generate concept question")
      const data = await res.json()
      if (data?.question) {
        setCurrentQuestion(data.question)
        setTranscript((prev) => [
          ...prev,
          { type: "ai", content: data.question, timestamp: new Date(), questionNumber: currentCodeIndex * 6 + 2 + currentConceptIndex },
        ])
        setLastSpokenText(data.question)
        await speakText(data.question)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate question")
    } finally {
      setIsLoading(false)
    }
  }

  const submitCode = async () => {
    if (!userCode.trim() || !interviewId) return

    setIsLoading(true)
    try {
      const questionNum = currentCodeIndex * 6 + 1
      setQuestionHistory((prev) => {
        const next = [...prev]
        if (next[currentCodeIndex]) next[currentCodeIndex] = { ...next[currentCodeIndex], userCode }
        return next
      })

      setTranscript((prev) => [
        ...prev,
        { type: "code", content: userCode, timestamp: new Date(), questionNumber: questionNum },
      ])

      const saveRes = await fetch("/api/interview/response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewId,
          question: currentQuestion,
          answer: userCode,
          questionNumber: questionNum,
          skipped: false,
        }),
      })

      if (!saveRes.ok) throw new Error("Failed to save response")

      setLastSubmittedCode(userCode)
      setLastSubmittedProblem(currentQuestion)
      setConceptHistory([])
      setCurrentConceptIndex(0)
      setPhase("concept")
      setCurrentQuestionIndex(questionNum)

      await generateConceptQuestion(1, userCode, currentQuestion)
    } catch (err) {
      console.error("Error submitting code:", err)
      setError(err instanceof Error ? err.message : "Failed to submit code")
    } finally {
      setIsLoading(false)
    }
  }

  const processConceptAnswer = async (answer: string) => {
    if (!interviewId) return
    setIsLoading(true)
    const questionNum = currentCodeIndex * 6 + 2 + currentConceptIndex

    try {
    const saveRes = await fetch("/api/interview/response", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        interviewId,
        question: currentQuestion,
        answer,
        questionNumber: questionNum,
        skipped: false,
      }),
    })
    if (!saveRes.ok) throw new Error("Failed to save response")

    setTranscript((prev) => [
      ...prev,
      { type: "user", content: answer, timestamp: new Date(), questionNumber: questionNum },
    ])
    setConceptHistory((prev) => [...prev, { question: currentQuestion, answer }])

    if (currentConceptIndex < 4) {
      setCurrentConceptIndex((i) => i + 1)
      setCurrentQuestionIndex(questionNum)
      await generateConceptQuestion(currentConceptIndex + 2)
    } else if (currentCodeIndex < codingProblemsCount - 1) {
      setCurrentCodeIndex((i) => i + 1)
      setCurrentConceptIndex(0)
      setConceptHistory([])
      setPhase("code")
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const prevCodeAnswers = questionHistory
          .slice(0, currentCodeIndex + 1)
          .filter((e) => e?.question)
          .map((e) => ({ question: e.question, answer: e.userCode || "" }))
        await generateNextCodingProblem(interviewId, currentCodeIndex + 2, prevCodeAnswers, user.id)
      }
    } else {
      if (interviewContext) interviewContext.setQuestionsAnswered(totalQuestions)
      await completeInterview()
    }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save answer")
    } finally {
      setIsLoading(false)
    }
  }

  const completeInterview = async () => {
    setIsLoading(true)
    try {
      if (!interviewId) {
        setError("Interview session missing")
        setIsLoading(false)
        return
      }

      window.speechSynthesis?.cancel()
      avatarRef.current?.stopAll()

      const res = await fetch("/api/interview/analyze", {
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

      if (!res.ok) {
        console.warn("[v0] Analyze failed, navigating anyway (results page will retry)")
      }
      window.location.href = `/results?interviewId=${interviewId}`
    } catch (err) {
      console.warn("Error completing interview, navigating anyway (results page will retry):", err)
      window.location.href = `/results?interviewId=${interviewId}`
    } finally {
      setIsLoading(false)
    }
  }

  const handleTimeUp = () => {
    if (!showWelcome) completeInterview()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const { selectionStart, selectionEnd, value } = e.currentTarget
    const indent = "    " // 4 spaces - IDE standard
    if (e.key === "Tab") {
      e.preventDefault()
      if (e.shiftKey) {
        // Shift+Tab: outdent - remove 4 spaces from line start
        const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1
        const lineEnd = value.indexOf("\n", selectionStart)
        const lineEndVal = lineEnd === -1 ? value.length : lineEnd
        const line = value.substring(lineStart, lineEndVal)
        const newLine = line.replace(/^    /, "")
        const newValue = value.substring(0, lineStart) + newLine + value.substring(lineEndVal)
        e.currentTarget.value = newValue
        setUserCode(newValue)
      } else {
        const newValue = value.substring(0, selectionStart) + indent + value.substring(selectionEnd)
        e.currentTarget.value = newValue
        e.currentTarget.selectionStart = e.currentTarget.selectionEnd = selectionStart + indent.length
        setUserCode(newValue)
      }
    } else if (e.key === "Enter") {
      e.preventDefault()
      const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1
      const currentLine = value.substring(lineStart, selectionStart)
      const match = currentLine.match(/^(\s*)/)
      const currentIndent = match ? match[1] : ""
      let newIndent = currentIndent
      const trimmed = currentLine.trimEnd()
      if (trimmed.endsWith(":") || trimmed.endsWith("{")) newIndent += indent
      if (trimmed.endsWith("}")) newIndent = newIndent.length >= indent.length ? newIndent.slice(0, -indent.length) : ""
      const newValue = value.substring(0, selectionStart) + "\n" + newIndent + value.substring(selectionStart)
      e.currentTarget.value = newValue
      e.currentTarget.selectionStart = e.currentTarget.selectionEnd = selectionStart + 1 + newIndent.length
      setUserCode(newValue)
    }
  }

  const handleExecute = async () => {
    if (!userCode.trim() || isExecuting) return
    setIsExecuting(true)
    setExecuteOutput(null)
    try {
      const res = await fetch("/api/execute-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: userCode, language: selectedLanguage }),
      })
      const data = await res.json()
      const stdout = data.stdout ?? ""
      const stderr = data.stderr ?? (data.error ?? "")
      setExecuteOutput({ stdout, stderr })
    } catch (e) {
      setExecuteOutput({ stdout: "", stderr: "Failed to execute code. Please try again." })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleResetEditor = () => {
    setUserCode("")
    setExecuteOutput(null)
  }

  const handleRefreshQuestion = async () => {
    if (!interviewId || phase !== "code") return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const prevCodeAnswers = questionHistory
        .slice(0, currentCodeIndex)
        .filter((e) => e?.question)
        .map((e) => ({ question: e.question, answer: e.userCode || "" }))
      setQuestionHistory((prev) => {
        const next = [...prev]
        if (next[currentCodeIndex]) next[currentCodeIndex] = { question: "", userCode: "" }
        return next
      })
      await generateNextCodingProblem(interviewId, currentCodeIndex + 1, prevCodeAnswers, user.id)
    }
  }

  if (showWelcome) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="p-8 max-w-2xl w-full bg-white border border-gray-200 rounded-xl shadow-sm">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Coding Round</h2>
          <p className="text-gray-600 mb-2">
            Practice coding problems with the AI interviewer. Write your solution and submit for feedback.
          </p>

          <div className="space-y-6 mb-6">
            <div>
              <p className="font-semibold mb-3 text-gray-900">Difficulty:</p>
              <div className="grid grid-cols-3 gap-3">
                {(["beginner", "pro", "expert"] as const).map((d) => (
                  <Button
                    key={d}
                    onClick={() => setSelectedDifficulty(d)}
                    variant={selectedDifficulty === d ? "default" : "outline"}
                    className={`h-16 ${selectedDifficulty === d ? "bg-blue-600 hover:bg-blue-700" : "hover:bg-blue-50 border-gray-200"}`}
                  >
                    <div className="text-center">
                      <div className="font-bold capitalize">{d}</div>
                      <div className="text-xs opacity-80">
                        {d === "beginner" ? "Basic" : d === "pro" ? "Intermediate" : "Advanced"}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="font-semibold text-gray-900">Duration:</p>
            <div className="grid grid-cols-3 gap-4">
              {[5, 15, 30].map((d) => (
                <Button
                  key={d}
                  onClick={() => handleStartClick(d)}
                  disabled={isLoading || !selectedDifficulty}
                  className="h-20"
                >
                  {d} minutes
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
            difficulty={selectedDifficulty ?? "beginner"}
            interviewType={interviewType}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Dark header bar */}
      <header className="flex-shrink-0 h-14 bg-gray-800 text-white flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <span className="font-semibold">{displayTitle}</span>
          <span className="px-2 py-0.5 text-xs font-medium bg-gray-600 rounded">{contextLanguage}</span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEvaluationCriteria(true)}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Info className="w-4 h-4 mr-1" />
            Criteria
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEndConfirmDialog(true)}
            className="text-red-400 hover:text-red-300 hover:bg-gray-700"
          >
            EXIT PRACTICE
          </Button>
        </div>
      </header>

      {/* Main content: question + editor, with avatar top-right */}
      <div className="flex-1 flex min-h-0 relative">
        {/* Left: Question + Editor - padding-right so content doesn't overlap avatar */}
        <div className="flex-1 flex flex-col min-w-0 p-6 pr-72">
          {/* Avatar's spoken message - shown at top with repeat button */}
          {lastSpokenText && (
            <div className="flex-shrink-0 mb-4 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">Interviewer says</p>
                  <p className="text-gray-900 font-medium">{lastSpokenText}</p>
                </div>
                <button
                  type="button"
                  onClick={() => speakText(lastSpokenText)}
                  disabled={isSpeaking}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium disabled:opacity-50"
                  aria-label="Repeat"
                >
                  <RefreshCw className="w-4 h-4" />
                  Repeat
                </button>
              </div>
            </div>
          )}

          {/* Question area */}
          <div className="flex-shrink-0 mb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                  {phase === "code" ? "Problem" : "Concept Question"}
                </p>
                <p className="text-lg text-gray-900 font-medium">
                  {isLoading ? "Loading question..." : currentQuestion || "Waiting for question..."}
                </p>
                {phase === "concept" && (
                  <p className="mt-2 text-sm text-blue-600 font-medium">
                    Press the microphone icon below the avatar to answer.
                  </p>
                )}
              </div>
              {phase === "code" && (
                <button
                  type="button"
                  onClick={handleRefreshQuestion}
                  disabled={isLoading}
                  className="flex-shrink-0 p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
                  aria-label="Refresh question"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              )}
            </div>
            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Editor area - always visible; read-only in concept phase */}
          <div className="flex-1 flex flex-col min-h-[280px] rounded-lg overflow-hidden border border-gray-200 shadow-sm bg-white">
            <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200 bg-gray-50 flex items-center">
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                {phase === "concept" ? "Your Submitted Code" : "Editor"}
              </span>
              <span className="ml-2 text-sm text-gray-500">({selectedLanguage})</span>
            </div>
            <div className="flex-1 flex flex-col min-h-0 p-3 bg-gray-50">
          {phase === "concept" ? (
            <>
              <div className="flex-1 min-h-[200px] rounded overflow-hidden border border-gray-200 bg-white">
                <div className="flex h-full font-mono text-[13px] leading-[1.5]">
                  <div className="flex-shrink-0 w-10 py-3 pl-2 pr-3 text-right text-gray-400 select-none bg-gray-50 border-r border-gray-200">
                    {Array.from(
                      { length: Math.max(1, ((lastSubmittedCode || userCode).match(/\n/g)?.length ?? 0) + 1) },
                      (_, i) => (
                        <div key={i} className="leading-[1.5]">{i + 1}</div>
                      )
                    )}
                  </div>
                  <Textarea
                    value={lastSubmittedCode || userCode}
                    readOnly
                    className="flex-1 min-h-full resize-none border-0 rounded-none focus-visible:ring-0 py-3 pl-3 pr-4 bg-gray-50 text-gray-900 cursor-default"
                    style={{ tabSize: 4 }}
                    spellCheck={false}
                  />
                </div>
              </div>
              <div className="mt-4 p-4 rounded-lg border border-blue-200 bg-blue-50">
                <p className="text-gray-700 font-medium">
                  Answer the concept question above using the microphone icon next to the avatar.
                </p>
                <p className="mt-2 text-sm text-gray-600">
                  {isRecording ? "Recording... Press the icon again to stop and submit." : "Click the blue mic to start speaking."}
                </p>
              </div>
            </>
          ) : (
              !hasStartedCoding ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <p className="text-gray-500 mb-4">Click on the &apos;Start Coding&apos; to begin coding.</p>
                  <Button
                    onClick={() => setHasStartedCoding(true)}
                    className="bg-green-500 hover:bg-green-600 text-white font-semibold"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    START CODING
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-h-[200px] rounded overflow-hidden border border-gray-200 bg-white">
                    <div className="flex h-full font-mono text-[13px] leading-[1.5]">
                      <div className="flex-shrink-0 w-10 py-3 pl-2 pr-3 text-right text-gray-400 select-none bg-gray-50 border-r border-gray-200">
                        {Array.from(
                          { length: Math.max(1, (userCode.match(/\n/g)?.length ?? 0) + 1) },
                          (_, i) => (
                            <div key={i} className="leading-[1.5]">{i + 1}</div>
                          )
                        )}
                      </div>
                      <Textarea
                        value={userCode}
                        onChange={(e) => setUserCode(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="// Write your code here..."
                        className="flex-1 min-h-full resize-none border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 py-3 pl-3 pr-4 bg-white text-gray-900 placeholder:text-gray-400"
                        style={{ tabSize: 4 }}
                        disabled={isLoading}
                        spellCheck={false}
                      />
                    </div>
                  </div>
                  {executeOutput && (
                    <div className="mt-3 p-3 rounded-lg font-mono text-[13px] overflow-auto max-h-32 bg-white border border-gray-200">
                      <div className="text-gray-500 text-xs mb-2 uppercase">Output</div>
                      {executeOutput.stdout && <pre className="whitespace-pre-wrap text-gray-800">{executeOutput.stdout}</pre>}
                      {executeOutput.stderr && <pre className="whitespace-pre-wrap text-red-600 mt-1">{executeOutput.stderr}</pre>}
                      {!executeOutput.stdout && !executeOutput.stderr && <span className="text-gray-500">No output</span>}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3 mt-4">
                    <button
                      type="button"
                      onClick={handleResetEditor}
                      disabled={isLoading}
                      className="px-4 py-2 bg-white border-2 border-purple-500 text-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors disabled:opacity-50"
                    >
                      RESET
                    </button>
                    <button
                      type="button"
                      onClick={handleExecute}
                      disabled={isLoading || isExecuting || !userCode.trim()}
                      className="flex items-center gap-2 px-5 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                    >
                      <Play className="w-4 h-4" />
                      EXECUTE
                    </button>
                    <div className="flex gap-2">
                      <Button
                        onClick={submitCode}
                        disabled={isLoading || userCode.trim() === ""}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "SUBMIT CODE"
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )
          )}
            </div>
          </div>
        </div>

        {/* Top-right: Avatar with timer overlay + Answer icon (only in concept phase) */}
        <div className="absolute top-6 right-6 w-64 flex-shrink-0 z-10 flex flex-col items-center gap-3">
          <div className="relative rounded-xl overflow-hidden shadow-xl bg-gray-900 aspect-video w-full">
            <AvatarVideoPlayer
              ref={avatarRef}
              avatarId={urlInterviewer}
              className="w-full h-full object-cover"
            />
            {/* Timer overlay - top right of avatar */}
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-lg text-white font-mono text-sm">
              {formatTime(timeRemaining)}
            </div>
          </div>
          {/* Answer icon - only when AI is asking concept questions (not when writing code) */}
          {phase === "concept" && (
            <>
              <button
                type="button"
                onClick={isRecording ? handleEndAnswer : handleStartAnswer}
                disabled={isLoading}
                className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all ${
                  isRecording
                    ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                } disabled:opacity-50`}
                aria-label={isRecording ? "Stop and submit answer" : "Press to answer"}
                title={isRecording ? "Stop recording" : "Press to answer the question"}
              >
                {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
              {/* User's transcript - answers given so far */}
              {conceptHistory.length > 0 && (
                <div className="w-full mt-2 p-3 rounded-lg border border-gray-200 bg-white max-h-32 overflow-y-auto">
                  <p className="text-xs font-semibold text-gray-600 mb-2">Your transcript</p>
                  <div className="space-y-2 text-xs text-gray-700">
                    {conceptHistory.map((item, i) => (
                      <div key={i} className="border-l-2 border-blue-200 pl-2">
                        <p className="text-gray-500 truncate">{item.question}</p>
                        <p className="font-medium">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
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
        questionsAnswered={currentQuestionIndex}
        totalQuestions={totalQuestions}
      />
    </div>
  )
}
