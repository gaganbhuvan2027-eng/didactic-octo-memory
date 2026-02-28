/**
 * Parse interview URL to extract interviewType and params for pre-warming.
 */
export function parseInterviewUrl(nextUrl: string): {
  interviewType: string
  round: string | null
  duration: number
  difficulty: string
  interviewer: string
  topics: string[]
  subcourse: string | null
  isCodingRound: boolean
  customScenario?: unknown
} | null {
  try {
    const url = new URL(nextUrl, "http://localhost")
    const path = url.pathname
    const params = url.searchParams

    let interviewType = ""

    if (path.startsWith("/interview/course/")) {
      const parts = path.replace("/interview/course/", "").split("/").filter(Boolean)
      if (parts.length >= 2) {
        interviewType = parts[0] === "multi" ? `${parts[0]}-${parts[1]}` : `${parts[0]}-${parts[1]}`
      } else if (parts.length === 1) {
        interviewType = parts[0]
      }
    } else if (path.startsWith("/interview/role/")) {
      const rest = path.replace("/interview/role/", "")
      const parts = rest.split("/").filter(Boolean)
      if (parts.length >= 2) {
        const roleId = parts.slice(0, -1).join("-")
        const type = parts[parts.length - 1]
        interviewType = `role-${roleId}-${type}`
      }
    } else if (path.startsWith("/interview/company/")) {
      const rest = path.replace("/interview/company/", "")
      if (rest.includes("/role/")) {
        const [companyPart, rolePart] = rest.split("/role/")
        const companyId = companyPart.split("/")[0]
        const roleId = rolePart?.replace(/\//g, "") || ""
        interviewType = `company-${companyId}-role-${roleId}`
      } else {
        const parts = rest.split("/").filter(Boolean)
        if (parts.length >= 2) {
          interviewType = `company-${parts[0]}-${parts[1]}`
        } else if (parts.length === 1) {
          interviewType = `company-${parts[0]}-full`
        }
      }
    } else if (path.startsWith("/interview/other/")) {
      const itemId = path.replace("/interview/other/", "").replace(/\//g, "")
      interviewType = `other-${itemId}`
    } else {
      return null
    }

    const round = params.get("round")
    const duration = parseInt(params.get("duration") || "15", 10)
    const difficulty = params.get("difficulty") || "beginner"
    const interviewer = params.get("interviewer") || "claire"
    const topicsParam = params.get("topics")
    const topics = topicsParam ? topicsParam.split(",").filter(Boolean) : []
    const subcourse = params.get("subcourse")
    const isCodingRound = round === "coding" || params.get("round") === "coding"

    return {
      interviewType,
      round,
      duration,
      difficulty,
      interviewer,
      topics,
      subcourse,
      isCodingRound,
    }
  } catch {
    return null
  }
}

export const PRELOAD_STORAGE_KEY = "interview_preload"

export interface InterviewPreload {
  interview: { id: string; question_count: number }
  firstQuestion: string | null
  interviewType: string
}
