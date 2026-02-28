"use client"

import { use } from "react"
import { useSearchParams } from "next/navigation"
import InterviewRoom from "@/components/interview-room"
import streams from "@/lib/courses"

export default function CourseInterviewPage({
  params,
}: {
  params: Promise<{ stream: string; subcourse: string }>
}) {
  const { stream, subcourse } = use(params)
  const searchParams = useSearchParams()
  
  // When subcourse is "multi", topics come from searchParams
  const topicsParam = searchParams.get("topics")
  const topics = topicsParam ? topicsParam.split(",").filter(Boolean) : []
  
  const interviewType = subcourse === "full" ? `${stream}-full` : subcourse === "multi" ? `${stream}-multi` : `${stream}-${subcourse}`
  
  // Get course title for display
  const streamData = streams.find(s => s.id === stream)
  const subcourseData = streamData?.subcourses.find(sc => sc.id === subcourse)
  const courseTitle = subcourse === "multi" && topics.length > 0
    ? topics.map(t => streamData?.subcourses.find(sc => sc.id === t)?.name || t).join(", ")
    : subcourseData?.name || streamData?.title || "Interview"

  return <InterviewRoom interviewType={interviewType} courseTitle={courseTitle} />
}
