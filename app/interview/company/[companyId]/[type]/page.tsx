"use client"

import { use } from "react"
import InterviewRoom from "@/components/interview-room"
import { companies } from "@/lib/companies"

export default function CompanyInterviewPage({
  params,
}: {
  params: Promise<{ companyId: string; type: string }>
}) {
  const { companyId, type } = use(params)
  
  const interviewType = `company-${companyId}-${type}`
  
  // Get company name for display
  const company = companies.find(c => c.id === companyId)
  const courseTitle = company?.name ? `${company.name} Interview` : "Company Interview"

  return <InterviewRoom interviewType={interviewType} courseTitle={courseTitle} />
}
