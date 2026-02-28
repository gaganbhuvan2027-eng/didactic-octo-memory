"use client"

import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

const TOUR_STORAGE_KEY = "mockzen_interview_tour_seen"

function getStorageKey(userId: string | null) {
  return userId ? `${TOUR_STORAGE_KEY}_${userId}` : TOUR_STORAGE_KEY
}

export interface TourStep {
  id: string
  target?: string
  title: string
  content: string
}

const defaultSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to your practice room",
    content: "Let's take a quick tour to help you get started. You can skip anytime.",
  },
  {
    id: "settings",
    target: "tour-settings",
    title: "Camera & microphone",
    content: "Click here to change your camera and microphone settings.",
  },
  {
    id: "answer",
    target: "tour-start-answer",
    title: "Record your answer",
    content: "Click Start Answer to begin speaking, then End Answer when you're done.",
  },
  {
    id: "criteria",
    target: "tour-evaluation-criteria",
    title: "Evaluation criteria",
    content: "View how your performance will be assessed during the interview.",
  },
  {
    id: "complete",
    title: "You're all set",
    content: "Complete the interview to receive your performance report.",
  },
]

interface InterviewTourProps {
  steps?: TourStep[]
  onComplete?: () => void
  onSkip?: () => void
}

export function InterviewTour({ steps = defaultSteps, onComplete, onSkip }: InterviewTourProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const hasNotifiedSeenRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    // Fast path: check generic key only (legacy/anonymous). Do NOT check other users' keys
    // here - we need current user id for per-user check, which requires async.
    const seenGeneric = localStorage.getItem(TOUR_STORAGE_KEY)
    if (seenGeneric === "true") {
      hasNotifiedSeenRef.current = true
      onComplete?.()
      return
    }

    // Show tour immediately - don't wait for API (eliminates several-second delay)
    setIsVisible(true)

    // Background: verify with API; if seen (e.g. cross-device), dismiss
    let cancelled = false
    const verify = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const storageKey = getStorageKey(user?.id ?? null)

      const seenLocal = localStorage.getItem(storageKey)
      if (seenLocal === "true") {
        if (!cancelled && !hasNotifiedSeenRef.current) {
          hasNotifiedSeenRef.current = true
          setIsVisible(false)
          onComplete?.()
        }
        return
      }

      try {
        const res = await fetch("/api/profile/tour-seen")
        if (cancelled) return
        const { seen } = await res.json()
        if (seen) {
          if (!hasNotifiedSeenRef.current) {
            hasNotifiedSeenRef.current = true
            setIsVisible(false)
            onComplete?.()
          }
        }
      } catch {
        // API failed - tour already shown, keep it
      }
    }
    verify()
    return () => { cancelled = true }
  }, [onComplete])

  useLayoutEffect(() => {
    if (!isVisible) return
    const step = steps[currentStep]
    if (!step?.target) {
      setTargetRect(null)
      return
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`)
    if (el) {
      setTargetRect(el.getBoundingClientRect())
    } else {
      setTargetRect(null)
    }
  }, [isVisible, currentStep, steps])

  const handleComplete = async () => {
    if (typeof window !== "undefined") {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const storageKey = getStorageKey(user?.id ?? null)
      localStorage.setItem(storageKey, "true")
      try {
        await fetch("/api/profile/tour-seen", { method: "POST" })
      } catch {
        // Ignore - localStorage is set
      }
    }
    setIsVisible(false)
    onComplete?.()
  }

  const handleSkip = async () => {
    if (typeof window !== "undefined") {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const storageKey = getStorageKey(user?.id ?? null)
      localStorage.setItem(storageKey, "true")
      try {
        await fetch("/api/profile/tour-seen", { method: "POST" })
      } catch {
        // Ignore - localStorage is set
      }
    }
    setIsVisible(false)
    onSkip?.()
  }

  const handleNext = () => {
    if (currentStep >= steps.length - 1) {
      handleComplete()
    } else {
      setCurrentStep((s) => s + 1)
    }
  }

  const handlePrev = () => {
    setCurrentStep((s) => Math.max(0, s - 1))
  }

  if (!isVisible) return null

  const step = steps[currentStep]
  const hasTarget = !!step?.target && !!targetRect

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Dimmed background: single box-shadow creates uniform overlay with hole - no seams */}
      {hasTarget && targetRect ? (
        <>
          {/* Visual dimming: one element, no panel edges = no cross lines */}
          <div
            className="absolute pointer-events-none"
            style={{
              left: targetRect.left,
              top: targetRect.top,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.65)",
            }}
          />
          {/* Invisible click regions (transparent, no visual seams) */}
          <div
            className="absolute left-0 top-0 right-0 bg-transparent pointer-events-auto"
            style={{ height: targetRect.top }}
            onClick={handleSkip}
            aria-hidden
          />
          <div
            className="absolute left-0 right-0 bg-transparent pointer-events-auto"
            style={{ top: targetRect.bottom, bottom: 0 }}
            onClick={handleSkip}
            aria-hidden
          />
          <div
            className="absolute top-0 bottom-0 bg-transparent pointer-events-auto"
            style={{ left: 0, width: targetRect.left }}
            onClick={handleSkip}
            aria-hidden
          />
          <div
            className="absolute top-0 right-0 bottom-0 bg-transparent pointer-events-auto"
            style={{ left: targetRect.right }}
            onClick={handleSkip}
            aria-hidden
          />
          {/* Highlight ring around target */}
          <div
            className="absolute pointer-events-none rounded-xl border-2 border-white/90"
            style={{
              left: targetRect.left - 2,
              top: targetRect.top - 2,
              width: targetRect.width + 4,
              height: targetRect.height + 4,
            }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 bg-black/65 pointer-events-auto"
          onClick={handleSkip}
          aria-hidden
        />
      )}

      {/* Caption - positioned near target or centered */}
      <div
        className="absolute pointer-events-auto transition-all duration-200"
        style={
          hasTarget && targetRect
            ? (() => {
                const w = typeof window !== "undefined" ? window.innerWidth : 400
                const h = typeof window !== "undefined" ? window.innerHeight : 600
                const spaceBelow = h - targetRect.bottom
                const showAbove = spaceBelow < 180
                const captionW = Math.min(320, w - 32)
                const left = Math.max(16, Math.min(targetRect.left, w - captionW - 16))
                return {
                  left,
                  top: showAbove ? undefined : targetRect.bottom + 12,
                  bottom: showAbove ? h - targetRect.top + 12 : undefined,
                  width: captionW,
                  maxWidth: "calc(100vw - 32px)",
                }
              })()
            : {
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "calc(100% - 2rem)",
                maxWidth: "28rem",
              }
        }
      >
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
          <p className="text-sm text-gray-600 mb-4">{step.content}</p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-1">
              <button
                onClick={handleSkip}
                className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Skip
              </button>
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 px-2 py-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </button>
              )}
            </div>
            <button
              onClick={handleNext}
              className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              {currentStep >= steps.length - 1 ? "Finish" : "Next"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export async function resetInterviewTour() {
  if (typeof window === "undefined") return
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  localStorage.removeItem(getStorageKey(user?.id ?? null))
  localStorage.removeItem(TOUR_STORAGE_KEY)
}
