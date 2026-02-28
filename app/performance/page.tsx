"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import DashboardNavbar from "@/components/dashboard-navbar"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@supabase/ssr"
import { AlertTriangle, ExternalLink, Download } from "lucide-react"
import { downloadPerformanceReport } from "@/utils/download-report"

// Helper function to format interview types properly
const formatInterviewType = (type: string): string => {
  if (!type) return "Interview"
  
  // Handle specific known types
  const typeMap: Record<string, string> = {
    "technical": "Technical",
    "hr": "HR",
    "dsa": "DSA",
    "aptitude": "Aptitude",
    "custom": "Custom Scenario",
  }
  
  // Check for exact match first
  if (typeMap[type]) return typeMap[type]
  
  // Category mappings (main courses)
  const categoryMap: Record<string, string> = {
    "frontend": "Frontend",
    "backend": "Backend",
    "fullstack": "Full Stack",
    "dsa": "DSA",
    "aptitude": "Aptitude",
    "devops": "DevOps",
    "datascience": "Data Science",
    "mobile": "Mobile",
    "database": "Database",
    "cloud": "Cloud",
    "security": "Security",
  }
  
  // Main course only - use category map for display
  if (categoryMap[type]) return categoryMap[type]
  
  // Compound types (e.g. frontend-react) - use main category only for Performance by Type
  const parts = type.split("-")
  if (parts.length >= 2 && categoryMap[parts[0]]) {
    return categoryMap[parts[0]]
  }
  
  // Fallback: capitalize first letter
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, " ")
}

export default function PerformancePage() {
  const router = useRouter()
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        )

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          setError("Please log in to view your performance")
          setLoading(false)
          return
        }

        const { data: interviews, error: fetchError } = await supabase
          .from("interviews")
          .select(
            `
            id,
            interview_type,
            started_at,
            completed_at,
            interview_results(
              overall_score,
              communication_score,
              technical_score,
              problem_solving_score,
              confidence_score,
              strengths,
              improvements,
              eye_contact_score,
              smile_score,
              stillness_score,
              face_confidence_score
            )
          `,
          )
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })

        if (fetchError) {
          console.error("[v0] Error fetching performance data:", fetchError)
          setError("Failed to load performance data")
          return
        }

        if (!interviews || interviews.length === 0) {
          setPerformanceData({
            overall: {
              totalInterviews: 0,
              averageScore: 0,
              highestScore: 0,
              lowestScore: 0,
              totalTimeSpent: "0h 0m",
              improvementRate: "0%",
              totalQuestionsSkipped: 0,
              avgSkipPenalty: 0,
            },
            byType: [],
            strengths: [],
            areasToImprove: [],
            recentPerformance: [],
          })
          setLoading(false)
          return
        }

        // Calculate overall stats
        const scores = interviews.map((i) => i.interview_results?.[0]?.overall_score).filter(Boolean)
        const totalTimeSpent = interviews.reduce((acc, i) => {
          const startDate = new Date(i.started_at)
          const endDate = i.completed_at ? new Date(i.completed_at) : new Date()
          return acc + (endDate.getTime() - startDate.getTime())
        }, 0)

        const totalQuestionsSkipped = 0 // Will be calculated once migration is run
        const avgSkipPenalty = 0 // Will be calculated once migration is run

        const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
        const hours = Math.floor(totalTimeSpent / 3600000)
        const minutes = Math.floor((totalTimeSpent % 3600000) / 60000)

        // Group by main course only (e.g. frontend-react + frontend-vue -> Frontend)
        const byType: any = {}
        interviews.forEach((interview) => {
          const type = interview.interview_type
          const mainKey = type && type.includes("-") ? type.split("-")[0] : type || "other"
          if (!byType[mainKey]) {
            byType[mainKey] = {
              type: mainKey,
              completed: 0,
              scores: [],
            }
          }
          byType[mainKey].completed++
          if (interview.interview_results?.[0]?.overall_score) {
            byType[mainKey].scores.push(interview.interview_results[0].overall_score)
          }
        })

        const byTypeArray = Object.values(byType).map((item: any) => ({
          type: formatInterviewType(item.type),
          completed: item.completed,
          avgScore:
            item.scores.length > 0
              ? Math.round(item.scores.reduce((a: number, b: number) => a + b, 0) / item.scores.length)
              : 0,
          bestScore: item.scores.length > 0 ? Math.max(...item.scores) : 0,
          trend: item.scores.length > 1 && item.scores[0] > item.scores[item.scores.length - 1] ? "up" : "stable",
          recentScores: item.scores.slice(0, 5),
        }))

        // Calculate strengths and improvements
        const allResults = interviews.map((i) => i.interview_results?.[0]).filter(Boolean)
        const strengthScores: any = {}

        allResults.forEach((result) => {
          if (result.communication_score) {
            strengthScores["Communication"] = (strengthScores["Communication"] || 0) + result.communication_score
          }
          if (result.technical_score) {
            strengthScores["Technical Skills"] = (strengthScores["Technical Skills"] || 0) + result.technical_score
          }
          if (result.problem_solving_score) {
            strengthScores["Problem Solving"] = (strengthScores["Problem Solving"] || 0) + result.problem_solving_score
          }
        })

        const strengths = Object.entries(strengthScores)
          .map(([skill, score]: [string, any]) => ({
            skill,
            score: Math.round(score / allResults.length),
            category: "Technical",
          }))
          .sort((a, b) => b.score - a.score)

        const recentPerformance = interviews.slice(0, 5).map((interview) => {
          const startDate = new Date(interview.started_at)
          const endDate = interview.completed_at ? new Date(interview.completed_at) : new Date()
          const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000)

          return {
            id: interview.id, // Add interview ID
            date: startDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            type: formatInterviewType(interview.interview_type),
            score: interview.interview_results?.[0]?.overall_score || 0,
            duration: `${duration}m`,
            questionsSkipped: 0,
            skipPenalty: 0,
          }
        })

        const allImprovements: any = {}
        allResults.forEach((result) => {
          if (result.improvements && Array.isArray(result.improvements)) {
            result.improvements.forEach((improvement: string) => {
              if (!allImprovements[improvement]) {
                allImprovements[improvement] = {
                  area: improvement,
                  count: 0,
                  description: getImprovementDescription(improvement),
                  recommendation: getImprovementRecommendation(improvement),
                }
              }
              allImprovements[improvement].count++
            })
          }
        })

        const areasToImprove = Object.values(allImprovements)
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 4)
          .map((item: any) => ({
            ...item,
            frequency: `${Math.round((item.count / allResults.length) * 100)}% of interviews`,
            trend: calculateTrend(allResults, item.area),
          }))

        setPerformanceData({
          overall: {
            totalInterviews: interviews.length,
            averageScore: avgScore,
            highestScore: Math.max(...scores),
            lowestScore: Math.min(...scores),
            totalTimeSpent: `${hours}h ${minutes}m`,
            improvementRate:
              scores.length > 1
                ? `${Math.round(((scores[0] - scores[scores.length - 1]) / scores[scores.length - 1]) * 100)}%`
                : "0%",
            totalQuestionsSkipped,
            avgSkipPenalty,
          },
          byType: byTypeArray,
          strengths,
          areasToImprove,
          recentPerformance,
        })
      } catch (err) {
        console.error("[v0] Error:", err)
        setError("An error occurred while fetching performance data")
      } finally {
        setLoading(false)
      }
    }

    fetchPerformanceData()
  }, [])

  const getImprovementDescription = (area: string): string => {
    const descriptions: Record<string, string> = {
      "Speak more clearly": "Focus on pronunciation and articulation during responses",
      "Practice system design": "Study design patterns and architectural best practices",
      "Improve time management": "Practice answering questions within reasonable timeframes",
      "Better explain your thought process": "Verbalize your thinking while solving problems",
      "Increase confidence": "Build confidence through more practice sessions",
      "Focus on fundamentals": "Strengthen core algorithmic and data structure knowledge",
      "Improve communication skills": "Practice conveying ideas clearly and concisely",
      "Work on soft skills": "Develop better listening and interpersonal skills",
    }
    return descriptions[area] || "Work on improving this area in your next interview"
  }

  const getImprovementRecommendation = (area: string): string => {
    const recommendations: Record<string, string> = {
      "Speak more clearly": "Record yourself answering questions and review for clarity",
      "Practice system design": "Study 3-5 complex system design problems weekly",
      "Improve time management": "Set timers for each problem section during practice",
      "Better explain your thought process": "Practice think-aloud technique before each interview",
      "Increase confidence": "Complete 2-3 interviews per week in different topic areas",
      "Focus on fundamentals": "Review core data structures and algorithms daily",
      "Improve communication skills": "Do mock interviews with peers and get feedback",
      "Work on soft skills": "Join communication workshops or practice public speaking",
    }
    return recommendations[area] || "Focus on this area in your next practice session"
  }

  const calculateTrend = (results: any[], area: string): number => {
    const recentResults = results.slice(0, 3).map((r) => (r.improvements?.includes(area) ? 1 : 0))
    const olderResults = results.slice(3, 6).map((r) => (r.improvements?.includes(area) ? 1 : 0))

    if (recentResults.length === 0 || olderResults.length === 0) return 0

    const recentCount = recentResults.reduce((a: number, b: number) => a + b, 0)
    const olderCount = olderResults.reduce((a: number, b: number) => a + b, 0)

    return olderCount - recentCount // Positive = improving, negative = declining
  }

  return (
    <main className="min-h-screen bg-white">
      <DashboardNavbar />

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Page Title */}
        <div className="mb-12 animate-fade-in flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">Performance Overview</h1>
          <p className="text-lg text-gray-600">Track your progress and identify areas for improvement.</p>
          </div>
          {performanceData && performanceData.overall?.totalInterviews > 0 && (
            <Button
              onClick={() => downloadPerformanceReport(performanceData)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your performance data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
            </div>
          </div>
        ) : !performanceData ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-gray-600">No performance data available.</p>
          </div>
        ) : performanceData.overall.totalInterviews === 0 ? (
          <p className="text-center text-gray-600">Complete your first interview to see performance analytics!</p>
        ) : (
          <>
            {/* Overall Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                <p className="text-sm text-gray-600 mb-2">Total Interviews</p>
                <p className="text-3xl font-bold text-blue-600">{performanceData.overall.totalInterviews}</p>
              </Card>
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-green-50 to-white">
                <p className="text-sm text-gray-600 mb-2">Average Score</p>
                <p className="text-3xl font-bold text-green-600">{performanceData.overall.averageScore}%</p>
              </Card>
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-yellow-50 to-white">
                <p className="text-sm text-gray-600 mb-2">Highest Score</p>
                <p className="text-3xl font-bold text-yellow-600">{performanceData.overall.highestScore}%</p>
              </Card>
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-red-50 to-white">
                <p className="text-sm text-gray-600 mb-2">Lowest Score</p>
                <p className="text-3xl font-bold text-red-600">{performanceData.overall.lowestScore}%</p>
              </Card>
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-purple-50 to-white">
                <p className="text-sm text-gray-600 mb-2">Time Spent</p>
                <p className="text-3xl font-bold text-purple-600">{performanceData.overall.totalTimeSpent}</p>
              </Card>
              <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-teal-50 to-white">
                <p className="text-sm text-gray-600 mb-2">Improvement</p>
                <p className="text-3xl font-bold text-teal-600">{performanceData.overall.improvementRate}</p>
              </Card>
            </div>

            {/* Areas for Improvement */}
            {performanceData.areasToImprove && performanceData.areasToImprove.length > 0 && (
              <div className="mb-12">
                <Card className="p-8 border-0 shadow-sm bg-gradient-to-br from-amber-50 to-white">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Areas for Improvement</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {performanceData.areasToImprove.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="p-4 bg-white rounded-lg border border-amber-200 hover:border-amber-300 transition-colors"
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-600 mt-2"></div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{item.area}</p>
                            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            {item.trend && (
                              <p className="text-xs text-gray-500 mt-2">
                                Trend: {item.trend > 0 ? "📈 Improving" : item.trend < 0 ? "📉 Declining" : "➡️ Stable"}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-amber-100">
                          <p className="text-xs font-medium text-amber-700">Recommendation: {item.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {performanceData.overall.totalQuestionsSkipped > 0 && (
              <div className="mb-12">
                <Card className="p-6 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">Questions Skipped Impact</h3>
                      <p className="text-gray-700 mb-4">
                        You have skipped a total of{" "}
                        <span className="font-bold text-orange-600">
                          {performanceData.overall.totalQuestionsSkipped}
                        </span>{" "}
                        question
                        {performanceData.overall.totalQuestionsSkipped > 1 ? "s" : ""} across your interviews.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-lg p-4 border border-orange-200">
                          <p className="text-sm text-gray-600 mb-1">Average Penalty per Interview</p>
                          <p className="text-2xl font-bold text-orange-600">
                            -{performanceData.overall.avgSkipPenalty} points
                          </p>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-orange-200">
                          <p className="text-sm text-gray-600 mb-1">Recommendation</p>
                          <p className="text-sm text-gray-900 font-medium">
                            Try to answer all questions to maximize your score
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Performance by Interview Type */}
            {performanceData.byType.length > 0 && (
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance by Interview Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {performanceData.byType.map((item: any, index: number) => (
                    <Card key={index} className="p-6 border-0 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900">{item.type}</h3>
                        <Badge
                          className={item.trend === "up" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                        >
                          {item.trend === "up" ? "↑ Improving" : "→ Stable"}
                        </Badge>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Completed:</span>
                          <span className="text-sm font-semibold text-gray-900">{item.completed} interviews</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Average Score:</span>
                          <span className="text-sm font-semibold text-gray-900">{item.avgScore}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Best Score:</span>
                          <span className="text-sm font-semibold text-gray-900">{item.bestScore}%</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {performanceData.strengths.length > 0 && (
              <div className="mb-12">
                <Card className="p-6 border-0 shadow-sm">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Strengths</h2>
                  <div className="space-y-4">
                    {performanceData.strengths.map((item: any, index: number) => (
                      <div key={index}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{item.skill}</span>
                          <span className="text-sm font-semibold text-green-600">{item.score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${item.score}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Recent Performance */}
            {performanceData.recentPerformance.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Performance</h2>
                <Card className="p-6 border-0 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Interview Type</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Score</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Duration</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Skipped</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Penalty</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {performanceData.recentPerformance.map((item: any, index: number) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 text-sm text-gray-900">{item.date}</td>
                            <td className="py-3 px-4 text-sm text-gray-900">{item.type}</td>
                            <td className="py-3 px-4">
                              <Badge
                                className={
                                  item.score >= 90
                                    ? "bg-green-100 text-green-800"
                                    : item.score >= 80
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-yellow-100 text-yellow-800"
                                }
                              >
                                {item.score}%
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{item.duration}</td>
                            <td className="py-3 px-4">
                              {item.questionsSkipped > 0 ? (
                                <Badge className="bg-orange-100 text-orange-800">
                                  {item.questionsSkipped} question{item.questionsSkipped > 1 ? "s" : ""}
                                </Badge>
                              ) : (
                                <span className="text-sm text-gray-400">None</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              {item.skipPenalty > 0 ? (
                                <span className="text-sm font-medium text-orange-600">-{item.skipPenalty} pts</span>
                              ) : (
                                <span className="text-sm text-gray-400">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/results?interviewId=${item.id}`)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View Details
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
