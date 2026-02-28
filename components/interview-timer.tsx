"use client"

import { useState, useEffect, useRef } from "react"
import { Clock } from "lucide-react"

interface InterviewTimerProps {
  durationMinutes: number
  onTimeUp?: () => void
}

export function InterviewTimer({ durationMinutes, onTimeUp }: InterviewTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60)
  const endTimeRef = useRef<number | null>(null)
  const firedRef = useRef(false)
  const onTimeUpRef = useRef(onTimeUp)

  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  useEffect(() => {
    // Reset timer when duration changes
    const totalSeconds = durationMinutes * 60
    setTimeRemaining(totalSeconds)
    firedRef.current = false
    endTimeRef.current = Date.now() + totalSeconds * 1000

    if (!endTimeRef.current) return

    const interval = setInterval(() => {
      const now = Date.now()
      const end = endTimeRef.current ?? now
      const remainingSeconds = Math.max(0, Math.round((end - now) / 1000))
      setTimeRemaining(remainingSeconds)

      if (remainingSeconds <= 0 && !firedRef.current) {
        firedRef.current = true
        onTimeUpRef.current?.()
        clearInterval(interval)
      }
    }, 500)

    return () => clearInterval(interval)
  }, [durationMinutes])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  const isWarning = timeRemaining <= 300 && timeRemaining > 60
  const isCritical = timeRemaining <= 60

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-sm transition-colors ${
        isCritical
          ? "bg-red-100 text-red-700 border-2 border-red-300"
          : isWarning
            ? "bg-yellow-100 text-yellow-700 border-2 border-yellow-300"
            : "bg-blue-100 text-blue-700 border-2 border-blue-300"
      }`}
    >
      <Clock className={`w-4 h-4 ${isCritical ? "animate-pulse" : ""}`} />
      <span className="font-semibold">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  )
}
