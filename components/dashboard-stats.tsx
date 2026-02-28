import { createClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"

interface DashboardStats {
  totalInterviews: number
  averageScore: number
  currentStreak: number
  lastInterviewScore: number
}

export async function DashboardStats() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  try {
    // Fetch all interviews with their results for the user
    const { data: interviews, error } = await supabase
      .from("interviews")
      .select(
        `
        id,
        completed_at,
        interview_results(overall_score)
      `,
      )
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching interviews:", error)
      return null
    }

    if (!interviews || interviews.length === 0) {
      // No interviews yet
      const defaultStats = [
        { label: "Total Interviews", value: "0", icon: "📊", color: "from-blue-50 to-blue-100" },
        { label: "Average Score", value: "-", icon: "⭐", color: "from-yellow-50 to-yellow-100" },
        { label: "Current Streak", value: "0 days", icon: "🔥", color: "from-red-50 to-red-100" },
        { label: "Last Interview", value: "-", icon: "🏆", color: "from-purple-50 to-purple-100" },
      ]

      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-12">
          {defaultStats.map((stat, index) => (
            <Card key={index} className={`p-4 md:p-6 border-0 shadow-sm bg-gradient-to-br ${stat.color}`}>
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                <div className="flex-1">
                  <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">{stat.label}</p>
                  <p className="text-xl md:text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <span className="text-2xl md:text-3xl">{stat.icon}</span>
              </div>
            </Card>
          ))}
        </div>
      )
    }

    const totalInterviews = interviews.length

    // Calculate average score
    const scores = interviews
      .map((interview: any) => interview.interview_results?.[0]?.overall_score || 0)
      .filter((score: number) => score > 0)

    const averageScore =
      scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0

    // Calculate current streak (consecutive days with interviews)
    let currentStreak = 0
    let lastDate: Date | null = null

    for (const interview of interviews) {
      if (!interview.completed_at) continue

      const interviewDate = new Date(interview.completed_at)
      interviewDate.setHours(0, 0, 0, 0)

      if (lastDate === null) {
        currentStreak = 1
        lastDate = interviewDate
      } else {
        const dayDiff = Math.floor((lastDate.getTime() - interviewDate.getTime()) / (1000 * 60 * 60 * 24))

        if (dayDiff === 1) {
          currentStreak++
          lastDate = interviewDate
        } else if (dayDiff > 1) {
          break
        }
      }
    }

    // Get last interview score
    const lastInterviewScore = interviews[0]?.interview_results?.[0]?.overall_score || 0

    const stats = [
      { label: "Total Interviews", value: totalInterviews.toString(), icon: "📊", color: "from-blue-50 to-blue-100" },
      { label: "Average Score", value: `${averageScore}%`, icon: "⭐", color: "from-yellow-50 to-yellow-100" },
      {
        label: "Current Streak",
        value: `${currentStreak} day${currentStreak !== 1 ? "s" : ""}`,
        icon: "🔥",
        color: "from-red-50 to-red-100",
      },
      { label: "Last Interview", value: `${lastInterviewScore}%`, icon: "🏆", color: "from-purple-50 to-purple-100" },
    ]

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-12">
        {stats.map((stat, index) => (
          <Card key={index} className={`p-4 md:p-6 border-0 shadow-sm bg-gradient-to-br ${stat.color}`}>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
              <div className="flex-1">
                <p className="text-xs md:text-sm text-gray-600 mb-1 md:mb-2">{stat.label}</p>
                <p className="text-xl md:text-3xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <span className="text-2xl md:text-3xl">{stat.icon}</span>
            </div>
          </Card>
        ))}
      </div>
    )
  } catch (err) {
    console.error("[v0] Error calculating stats:", err)
    return null
  }
}
