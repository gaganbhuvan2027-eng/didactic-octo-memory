"use client"

import { Suspense, useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { parseInterviewUrl, PRELOAD_STORAGE_KEY } from "@/lib/interview-prewarm"
import { cacheAvatarVideos } from "@/lib/avatar-cache"

const INTERVIEW_TIPS = [
  "You'll get analytics even with partial answers—answer what you can.",
  "Keep your background clean and free of distractions.",
  "Speak clearly and at a moderate pace.",
  "Take a moment to think before answering.",
  "Use the STAR method for behavioral questions.",
]

const MIN_DISPLAY_MS = 2000
const MAX_WAIT_MS = 8000

function PrepareContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<"warming" | "ready">("warming")
  const [tipIndex, setTipIndex] = useState(0)
  const prewarmStartedRef = useRef(false)
  const prewarmDoneRef = useRef(false)
  const minTimePassedRef = useRef(false)
  const redirectedRef = useRef(false)

  const nextPath = searchParams.get("next")

  const tryRedirect = () => {
    if (redirectedRef.current || !nextPath) return
    if (prewarmDoneRef.current && minTimePassedRef.current) {
      redirectedRef.current = true
      router.replace(nextPath)
    }
  }

  useEffect(() => {
    if (!nextPath) {
      router.replace("/dashboard")
      return
    }

    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - start
      const pct = Math.min(100, (elapsed / MAX_WAIT_MS) * 100)
      setProgress(pct)

      if (elapsed >= MIN_DISPLAY_MS * 0.5) {
        setPhase("ready")
      }

      if (elapsed >= MIN_DISPLAY_MS) {
        minTimePassedRef.current = true
        tryRedirect()
      }

      if (elapsed >= MAX_WAIT_MS) {
        clearInterval(interval)
        prewarmDoneRef.current = true
        tryRedirect()
      }
    }, 50)

    return () => clearInterval(interval)
  }, [router, nextPath])

  useEffect(() => {
    if (!nextPath || prewarmStartedRef.current) return

    const parsed = parseInterviewUrl(nextPath.startsWith("/") ? `${typeof window !== "undefined" ? window.location.origin : ""}${nextPath}` : nextPath)
    if (!parsed) {
      prewarmDoneRef.current = true
      return
    }

    prewarmStartedRef.current = true

    const runPrewarm = async () => {
      try {
        const supabase = createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          prewarmDoneRef.current = true
          tryRedirect()
          return
        }

        // Preload avatar videos during prepare (fixes blur/black on some devices)
        const interviewer = parsed.interviewer || "claire"
        const [res] = await Promise.all([
          fetch("/api/interview/prepare", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewType: parsed.interviewType,
            interviewTypeFromPath: nextPath,
            userId: user.id,
            userEmail: user.email,
            userName: user.user_metadata?.name || user.email?.split("@")[0],
            duration: parsed.duration,
            difficulty: parsed.difficulty,
            round: parsed.round,
            topics: parsed.topics,
            interviewer: parsed.interviewer,
            subcourse: parsed.subcourse,
            isCodingRound: parsed.isCodingRound,
          }),
        }),
          cacheAvatarVideos(interviewer).catch(() => null),
        ])

        if (res.ok) {
          const data = await res.json()
          sessionStorage.setItem(
            PRELOAD_STORAGE_KEY,
            JSON.stringify({
              interview: data.interview,
              firstQuestion: data.firstQuestion ?? null,
              questions: data.questions ?? (data.firstQuestion ? [data.firstQuestion] : []),
              audio: data.audio ?? [],
              interviewType: parsed.interviewType,
            })
          )
        }
      } catch (err) {
        console.warn("[prepare] Prewarm failed:", err)
      } finally {
        prewarmDoneRef.current = true
        tryRedirect()
      }
    }

    runPrewarm()
  }, [nextPath])

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((i) => (i + 1) % INTERVIEW_TIPS.length)
    }, 2000)
    return () => clearInterval(tipInterval)
  }, [])

  if (!nextPath) return <PrepareFallback />

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-blue-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-blue-100 p-8">
        {/* Spinner icon */}
        <div className="flex justify-center mb-6">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${
              phase === "warming"
                ? "bg-blue-600"
                : "bg-blue-600 ring-4 ring-blue-200"
            }`}
          >
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
          {phase === "warming" ? "Warming up..." : "You're all set!"}
        </h2>
        <p className="text-sm text-gray-600 text-center mb-6">
          {phase === "warming"
            ? "Setting up the simulation environment..."
            : "The interviewer is waiting for you."}
        </p>

        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
            Interview tip
          </p>
          <p className="text-sm text-gray-700">{INTERVIEW_TIPS[tipIndex]}</p>
        </div>

        {phase === "ready" && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Redirecting to interview...</span>
          </div>
        )}
      </div>
    </div>
  )
}

function PrepareFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-blue-50 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function InterviewPreparePage() {
  return (
    <Suspense fallback={<PrepareFallback />}>
      <PrepareContent />
    </Suspense>
  )
}
