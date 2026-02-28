"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardNavbar from "@/components/dashboard-navbar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createBrowserClient } from "@supabase/ssr"
import { Calendar } from "lucide-react"

export default function HistoryPage() {
  const router = useRouter()
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError("Please log in to view your interview history")
          setLoading(false)
          return
        }

        const { data: interviewsData, error: fetchError } = await supabase
          .from("interviews")
          .select(
            `
            id,
            interview_type,
            started_at,
            completed_at,
            status,
            scheduled_interview_id,
            interview_results(overall_score)
          `,
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (fetchError) {
          console.error("[v0] Error fetching interviews:", fetchError)
          setError("Failed to load interview history")
          return
        }

        // Map database results to UI format
        const formattedInterviews = interviewsData?.map((interview: any) => {
          const startDate = new Date(interview.started_at)
          const endDate = interview.completed_at ? new Date(interview.completed_at) : null
          const duration = endDate ? Math.round((endDate.getTime() - startDate.getTime()) / 60000) : 0

          return {
            id: interview.id,
            type: interview.interview_type,
            date: startDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            score: interview.interview_results?.[0]?.overall_score || 0,
            duration: `${duration} min`,
            status: interview.status,
            isScheduled: !!interview.scheduled_interview_id,
          }
        })

        setInterviews(formattedInterviews || [])
      } catch (err) {
        console.error("[v0] Error:", err)
        setError("An error occurred while fetching interviews")
      } finally {
        setLoading(false)
      }
    }

    fetchInterviews()
  }, [])

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-green-100 text-green-800"
    if (score >= 80) return "bg-blue-100 text-blue-800"
    if (score >= 70) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  const handleRowClick = (interviewId: string) => {
    router.push(`/results?interviewId=${interviewId}`)
  }

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Page Title */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Interview History</h1>
          <p className="text-lg text-gray-600">Review all your past mock interviews and performance.</p>
        </div>

        {loading && <p className="text-center text-gray-600">Loading your interview history...</p>}

        {error && <p className="text-center text-red-600">{error}</p>}

        {!loading && interviews.length === 0 && (
          <p className="text-center text-gray-600">No interviews completed yet. Start your first interview!</p>
        )}

        {/* Interviews Table */}
        {!loading && interviews.length > 0 && (
          <Card className="border-0 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50 to-blue-25 border-b border-blue-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Interview Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Score</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {interviews.map((interview) => (
                    <tr
                      key={interview.id}
                      onClick={() => handleRowClick(interview.id)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-100 text-blue-800">{interview.type}</Badge>
                          {interview.isScheduled && (
                            <Badge variant="outline" className="flex items-center gap-1 text-purple-600 border-purple-300">
                              <Calendar className="w-3 h-3" />
                              Scheduled
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{interview.date}</td>
                      <td className="px-6 py-4 text-gray-700">{interview.duration}</td>
                      <td className="px-6 py-4">
                        <Badge className={getScoreColor(interview.score)}>{interview.score}%</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-green-100 text-green-800">{interview.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </main>
  )
}
