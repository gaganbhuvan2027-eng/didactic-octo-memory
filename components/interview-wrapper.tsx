"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import NewInterviewRoom from "./new-interview-room"
import DSACodeInterviewer from "./dsa-code-interviewer"
import AptitudeMCQInterviewer from "./aptitude-mcq-interviewer"
import CodingRoundInterviewer from "./coding-round-interviewer"

interface CustomScenario {
  description: string
  goals: string[]
  focusAreas: string[]
  context: string
}

function InterviewContent({ interviewType, courseTitle, customScenario }: { interviewType: string; courseTitle?: string; customScenario?: CustomScenario }) {
  const searchParams = useSearchParams()
  // support both names: scheduledInterviewId and scheduleId
  const scheduledId = searchParams.get("scheduledInterviewId") || searchParams.get("scheduleId")
  const round = searchParams.get("round")

  // Aptitude uses MCQ interface (not code editor)
  const isAptitude = interviewType.startsWith("aptitude")
  // DSA uses the original code interviewer (unchanged)
  const isDSA = interviewType.startsWith("dsa-")
  // Role coding rounds only: use code editor (Judge0-compatible, standard library only)
  const isRoleCodingRound = round === "coding" && interviewType.startsWith("role-")

  if (isAptitude) {
    return <AptitudeMCQInterviewer interviewType={interviewType} />
  }
  if (isDSA) {
    return <DSACodeInterviewer interviewType={interviewType} />
  }
  if (isRoleCodingRound) {
    return (
      <CodingRoundInterviewer
        interviewType={interviewType}
        courseTitle={courseTitle}
      />
    )
  }

  return (
    <NewInterviewRoom
      interviewType={interviewType}
      scheduledInterviewId={scheduledId}
      customScenario={customScenario}
    />
  )
}

export default function InterviewWrapper({ interviewType, courseTitle, customScenario }: { interviewType: string; courseTitle?: string; customScenario?: CustomScenario }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Preparing interview...</p>
          </div>
        </div>
      }
    >
      <InterviewContent interviewType={interviewType} courseTitle={courseTitle} customScenario={customScenario} />
    </Suspense>
  )
}
