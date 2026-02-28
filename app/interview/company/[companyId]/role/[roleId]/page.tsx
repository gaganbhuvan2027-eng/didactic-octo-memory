"use client"

import { use } from "react"
import InterviewRoom from "@/components/interview-room"
import { companies, roles } from "@/lib/companies"

export default function CompanyRoleInterviewPage({
  params,
}: {
  params: Promise<{ companyId: string; roleId: string }>
}) {
  const { companyId, roleId } = use(params)
  
  const interviewType = `company-${companyId}-role-${roleId}`
  
  // Get company and role names for display
  const company = companies.find(c => c.id === companyId)
  const role = roles.find(r => r.id === roleId)
  const courseTitle = `${company?.name || "Company"} - ${role?.name || "Role"} Interview`

  return <InterviewRoom interviewType={interviewType} courseTitle={courseTitle} />
}
