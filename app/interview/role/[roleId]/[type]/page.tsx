"use client"

import { use } from "react"
import InterviewRoom from "@/components/interview-room"
import { roles } from "@/lib/companies"

export default function RoleInterviewPage({
  params,
}: {
  params: Promise<{ roleId: string; type: string }>
}) {
  const { roleId, type } = use(params)
  
  const interviewType = `role-${roleId}-${type}`
  
  // Get role name for display
  const role = roles.find(r => r.id === roleId)
  const courseTitle = role?.name || "Role Interview"

  return <InterviewRoom interviewType={interviewType} courseTitle={courseTitle} />
}
