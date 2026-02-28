"use client"

import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface Props {
  interview: any
  className?: string
}

export default function StartScheduledInterviewButton({ interview, className }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [isOwner, setIsOwner] = useState<boolean | null>(null)

  useEffect(() => {
    let mounted = true

    const checkOwner = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!mounted) return
        const owner = Boolean(user && interview && interview.member && user.id === interview.member.id)
        console.debug('[v0] Start button check:', { currentUserId: user?.id, interviewMemberId: interview?.member?.id, owner })
        setIsOwner(owner)
      } catch (err) {
        console.error('Error checking interview owner:', err)
        if (mounted) setIsOwner(false)
      }
    }

    // initial check
    checkOwner()

    // subscribe to auth changes so UI updates when user signs in/out
    const { data: { subscription } = {} as any } = supabase.auth.onAuthStateChange((_event) => {
      // Re-check owner when auth state changes
      checkOwner()
    })

    return () => {
      mounted = false
      try {
        subscription?.unsubscribe()
      } catch (e) {
        /* ignore */
      }
    }
  }, [interview])

  const isExpired = (i: any) => {
    if (!i.deadline) return false
    return new Date() > new Date(i.deadline)
  }

  const handleStartInterview = async () => {
    if (isExpired(interview)) {
      alert("This interview has expired and can no longer be started")
      return
    }

    if (isOwner === false) {
      alert("Only the scheduled member can start this interview. Please sign in as the member to begin.")
      return
    }

    try {
      const response = await fetch("/api/user/start-scheduled-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId: interview.id }),
      })

      if (response.ok) {
        const payload = await response.json().catch(() => ({}))

        // If server indicates interview already in progress, direct user to the existing interview
        if (payload.alreadyStarted && payload.interviewId) {
          const difficulty = payload.difficulty || interview.difficulty || 'intermediate'
          const topic = payload.topic || interview.course || ''
          const params = new URLSearchParams({
            scheduled: 'true',
            scheduleId: interview.id,
            difficulty,
            interviewId: payload.interviewId,
          })

          if (topic?.includes('hr') || topic?.includes('behavioral')) {
            router.push(`/interview/hr?${params.toString()}`)
          } else if (topic?.startsWith('dsa-') || topic?.startsWith('aptitude')) {
            // DSA and aptitude interviews use the code-based interviewer
            router.push(`/interview/${topic}?${params.toString()}`)
          } else if (topic?.includes('technical') || topic?.includes('/')) {
            router.push(`/interview/course/${topic}?${params.toString()}`)
          } else {
            router.push(`/interview/technical?${params.toString()}`)
          }

          return
        }

        const scheduledDate = payload.scheduledDate || interview.scheduled_date || ''
        const difficulty = payload.difficulty || interview.difficulty || 'intermediate'
        const topic = payload.topic || interview.course || ''
        const duration = payload.duration || interview.duration || '30'

        const params = new URLSearchParams({
          scheduled: 'true',
          scheduleId: interview.id,
          difficulty,
          duration: String(duration),
          scheduledDate,
          topic,
        })

        // Route based on topic / course
        if (topic?.includes('hr') || topic?.includes('behavioral')) {
          router.push(`/interview/hr?${params.toString()}`)
        } else if (topic?.startsWith('dsa-') || topic?.startsWith('aptitude')) {
          // DSA and aptitude interviews use the code-based interviewer
          router.push(`/interview/${topic}?${params.toString()}`)
        } else if (topic?.includes('technical') || topic?.includes('/')) {
          router.push(`/interview/course/${topic}?${params.toString()}`)
        } else {
          router.push(`/interview/technical?${params.toString()}`)
        }
      } else {
        // Show clearer, actionable error messages
        const err = await response.json().catch(() => ({}))
        console.error("Failed to start scheduled interview:", err)

        if (response.status === 401) {
          alert("You must sign in to start this interview.")
        } else if (response.status === 403) {
          alert("You are not allowed to start this interview.")
        } else if (response.status === 404) {
          alert("Interview not found or it may not be scheduled for your account.")
        } else if (response.status === 409) {
          // Schedule already completed - send user to results if we have an interview id
          if (err && err.interviewId) {
            alert("This scheduled interview has already been completed - showing results.")
            router.push(`/results?interviewId=${err.interviewId}`)
          } else {
            alert(err.error || "This scheduled interview has already been completed.")
          }
        } else {
          alert(err.error || "Failed to start interview. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error starting interview:", error)
      alert("Failed to start interview. Please try again.")
    }
  }

  const handleCheckResult = async () => {
    try {
      const res = await fetch(`/api/user/schedule-result?scheduleId=${interview.id}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Unable to find interview results for this schedule')
        return
      }
      const data = await res.json()
      if (data?.interviewId) {
        router.push(`/results?interviewId=${data.interviewId}`)
      } else {
        alert('No interview found for this schedule')
      }
    } catch (err) {
      console.error('Error fetching schedule result:', err)
      alert('Failed to fetch result. Please try again.')
    }
  }

  const disabled = isExpired(interview) || isOwner === false

  // If schedule status is completed, show "Check Result" instead of "Start Interview"
  if (interview?.status === 'completed') {
    return (
      <Button onClick={handleCheckResult} className={`bg-emerald-600 hover:bg-emerald-700 gap-2 text-sm w-full md:w-auto ${className || ""}`}>
        ✅
        Check Result
      </Button>
    )
  }

  return (
    <Button onClick={handleStartInterview} disabled={disabled} className={`bg-blue-600 hover:bg-blue-700 gap-2 text-sm w-full md:w-auto ${className || ""}`}>
      <Play className="w-3 h-3 md:w-4 md:h-4" />
      {isOwner === false ? "Only member can start" : "Start Interview"}
    </Button>
  )
}
