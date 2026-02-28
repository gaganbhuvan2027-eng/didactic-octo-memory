"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import DashboardNavbar from "@/components/dashboard-navbar"
import { InterviewConfigModal } from "@/components/interview-config-modal"
import streams from "@/lib/courses"

type ConfigType = "course" | "role" | "company" | "other"

interface ParsedConfig {
  type: ConfigType
  itemId: string
  roleId?: string
  isFull?: boolean
  roundType?: string
}

function parseSlug(slug: string[]): ParsedConfig | null {
  if (!slug?.length) return null
  const joined = slug.join("-")

  // company-google-full
  const companyFullMatch = joined.match(/^company-([a-z0-9]+)-full$/)
  if (companyFullMatch) {
    return { type: "company", itemId: companyFullMatch[1], isFull: true }
  }

  // company-google-role-software-engineer (companyId has no hyphen, roleId can)
  const companyRoleMatch = joined.match(/^company-([a-z0-9]+)-role-([a-z0-9-]+)$/)
  if (companyRoleMatch) {
    return { type: "company", itemId: companyRoleMatch[1], roleId: companyRoleMatch[2] }
  }

  // company-google-technical, company-google-behavioral, etc.
  const companyRoundMatch = joined.match(/^company-([a-z0-9]+)-(technical|behavioral|hr|system-design|warmup)$/)
  if (companyRoundMatch) {
    return { type: "company", itemId: companyRoundMatch[1], roundType: companyRoundMatch[2] }
  }

  // role-software-engineer
  const roleMatch = joined.match(/^role-([a-z0-9-]+)$/)
  if (roleMatch) {
    return { type: "role", itemId: roleMatch[1] }
  }

  // role-software-engineer-technical, role-software-engineer-full, role-software-engineer-warmup, etc.
  const roleTypeMatch = joined.match(/^role-([a-z0-9-]+)-(warmup|coding|technical|behavioral|hr|system-design|full)$/)
  if (roleTypeMatch) {
    return { type: "role", itemId: roleTypeMatch[1], roundType: roleTypeMatch[2] }
  }

  // frontend, backend, dsa, etc. (course)
  const courseMatch = joined.match(/^([a-z0-9-]+)$/)
  if (courseMatch) {
    const id = courseMatch[1]
    if (streams.find((s) => s.id === id)) return { type: "course", itemId: id }
  }

  // frontend-full, frontend-react (course with subcourse)
  const courseSubMatch = joined.match(/^([a-z0-9-]+)-(full|[a-z0-9-]+)$/)
  if (courseSubMatch) {
    const streamId = courseSubMatch[1]
    const suffix = courseSubMatch[2]
    if (streams.find((s) => s.id === streamId)) {
      if (suffix === "full") return { type: "course", itemId: streamId, isFull: true }
      return { type: "course", itemId: streamId, roundType: suffix }
    }
  }

  // other: hr-interview, warmup, salary-negotiation
  if (["hr-interview", "warmup", "salary-negotiation"].includes(joined)) {
    return { type: "other", itemId: joined }
  }

  return null
}

const VALID_RETURN_TABS = ["course", "company", "role", "tests", "other"]

export default function InterviewConfigPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)

  const slug = params?.slug as string[] | undefined
  const slugArray = Array.isArray(slug) ? slug : slug ? [slug] : []
  const parsed = parseSlug(slugArray)
  const returnTab = searchParams.get("returnTab")

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleClose = () => {
    document.body.style.overflow = ""
    document.body.style.pointerEvents = "auto"
    document.body.removeAttribute("data-scroll-locked")
    document.body.removeAttribute("inert")
    document.documentElement.style.overflow = ""
    document.documentElement.style.pointerEvents = "auto"
    if (returnTab && VALID_RETURN_TABS.includes(returnTab)) {
      router.push(`/interviews?tab=${returnTab}`)
    } else {
      router.back()
    }
  }

  if (!mounted || !parsed) {
    return (
      <main className="min-h-screen bg-gray-50">
        <DashboardNavbar />
        <div className="pt-24 px-4 flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-gray-500 mb-4">Invalid interview configuration</p>
          <Link href="/interviews" className="text-blue-600 hover:underline flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to interviews
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <DashboardNavbar />
      <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <Link
          href={returnTab && VALID_RETURN_TABS.includes(returnTab) ? `/interviews?tab=${returnTab}` : "/interviews"}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to interviews
        </Link>
      </div>
      <InterviewConfigModal
      isOpen={true}
      onClose={handleClose}
      type={parsed.type}
      itemId={parsed.itemId}
      roleId={parsed.roleId}
      isFull={parsed.isFull}
      roundType={parsed.roundType}
    />
    </main>
  )
}
