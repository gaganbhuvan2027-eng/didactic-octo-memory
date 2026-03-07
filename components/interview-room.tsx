"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import InterviewNavbar from "./interview-navbar"
import InterviewWrapper from "./interview-wrapper"
import { InterviewProvider, useInterviewContext } from "@/contexts/interview-context"
import { createClient } from "@/lib/supabase/client"
import "@/app/interview/interview-mobile-landscape.css"

interface CustomScenario {
  description: string
  goals: string[]
  focusAreas: string[]
  context: string
}

interface InterviewRoomProps {
  interviewType: string
  courseTitle?: string
  customScenario?: CustomScenario
}

function InterviewRoomContent({ interviewType, courseTitle, customScenario }: InterviewRoomProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { state } = useInterviewContext()
  const [userType, setUserType] = useState<string | null>(null)
  const round = searchParams.get("round")

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

  const isCodingInterview =
    interviewType.startsWith("dsa-") ||
    interviewType.startsWith("aptitude") ||
    round === "coding"

  const getInterviewTitle = () => {
    if (courseTitle && !isCodingInterview) {
      return courseTitle
    }
    if (isCodingInterview) {
      return courseTitle ? `${courseTitle} | Coding` : "Coding Practice"
    }
    const titles: Record<string, string> = {
      technical: "Technical Interview",
      hr: "HR Interview",
      custom: "Custom Scenario",
    }
    return titles[interviewType] || "Interview"
  }

  const handleExitConfirm = async () => {
    try {
      window.dispatchEvent(new CustomEvent("app:stop-voice-agent"))
    } catch {}
    if (state.interviewId) {
      try {
        const res = await fetch("/api/interview/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ interviewId: state.interviewId, questionsSkipped: 0 }),
        })
        if (!res.ok) console.warn("[v0] Analyze on exit failed:", await res.json())
      } catch (err) {
        console.warn("[v0] Analyze on exit error:", err)
      }
      router.push(`/results?interviewId=${state.interviewId}`)
    } else {
      router.push(getDashboardUrl())
    }
  }

  return (
    <div className="h-screen overflow-hidden bg-white interview-mobile-landscape flex flex-col">
      <InterviewNavbar
        isInterviewStarted={state.isStarted}
        creditsUsed={state.creditsUsed}
        interviewId={state.interviewId}
        interviewTitle={getInterviewTitle()}
        onExitConfirm={handleExitConfirm}
      />

      <div className="pt-14 px-4 md:px-6 lg:px-8 py-3 md:py-4 flex-1 flex flex-col min-h-0 overflow-hidden interview-mobile-optimized">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden interview-content-scaled">
          <InterviewWrapper interviewType={interviewType} courseTitle={courseTitle} customScenario={customScenario} />
        </div>
      </div>
    </div>
  )
}

export function InterviewRoom({ interviewType, courseTitle, customScenario }: InterviewRoomProps) {
  return (
    <InterviewProvider>
      <InterviewRoomContent interviewType={interviewType} courseTitle={courseTitle} customScenario={customScenario} />
    </InterviewProvider>
  )
}

export default InterviewRoom
