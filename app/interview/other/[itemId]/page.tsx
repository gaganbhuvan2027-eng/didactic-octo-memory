"use client"

import { use } from "react"
import InterviewRoom from "@/components/interview-room"

const otherInterviews: Record<string, { title: string }> = {
  "hr-interview": { title: "HR Interview" },
  "warmup": { title: "Warmup Interview" },
  "salary-negotiation": { title: "Salary Negotiation" },
}

export default function OtherInterviewPage({
  params,
}: {
  params: Promise<{ itemId: string }>
}) {
  const { itemId } = use(params)
  
  const interviewType = `other-${itemId}`
  const courseTitle = otherInterviews[itemId]?.title || "Interview"

  return <InterviewRoom interviewType={interviewType} courseTitle={courseTitle} />
}
