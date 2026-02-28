"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Trophy, Medal, Award, TrendingUp, Star, Target, Zap } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LeaderboardMember {
  id: string
  name: string
  email: string
  rank: number
  averageScore: number
  totalInterviews: number
  technicalScore: number
  communicationScore: number
  problemSolvingScore: number
  confidenceScore: number
  recentImprovement: number
  badges: string[]
}

export default function InstitutionLeaderboardPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardMember[]>([])
  const [sortBy, setSortBy] = useState<"overall" | "technical" | "communication" | "problemSolving">("overall")

  useEffect(() => {
    fetchLeaderboardData()
  }, [])

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      const { data: userProfile } = await supabase.from("users").select("institution_id").eq("id", user.id).single()

      if (!userProfile) return

      const { data: institutionMembers } = await supabase
        .from("institution_members")
        .select("*, users:user_id(id, email, name)")
        .eq("institution_id", userProfile.institution_id)

      if (!institutionMembers) {
        setLeaderboard([])
        return
      }

      const leaderboardData: LeaderboardMember[] = []

      for (const member of institutionMembers) {
        const { data: interviews } = await supabase
          .from("interviews")
          .select("id, completed_at")
          .eq("user_id", member.users.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: true })

        const { data: results } = await supabase
          .from("interview_results")
          .select(
            "overall_score, technical_score, communication_score, problem_solving_score, confidence_score, created_at",
          )
          .in("interview_id", interviews?.map((i) => i.id) || [])
          .order("created_at", { ascending: true })

        if (!results || results.length === 0) continue

        const averageScore = Math.round(results.reduce((sum, r) => sum + r.overall_score, 0) / results.length)
        const technicalScore = Math.round(
          results.reduce((sum, r) => sum + (r.technical_score || 0), 0) / results.length,
        )
        const communicationScore = Math.round(
          results.reduce((sum, r) => sum + (r.communication_score || 0), 0) / results.length,
        )
        const problemSolvingScore = Math.round(
          results.reduce((sum, r) => sum + (r.problem_solving_score || 0), 0) / results.length,
        )
        const confidenceScore = Math.round(
          results.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / results.length,
        )

        // Calculate recent improvement (last 3 vs previous 3)
        let recentImprovement = 0
        if (results.length >= 6) {
          const recent = results.slice(-3)
          const previous = results.slice(-6, -3)
          const recentAvg = recent.reduce((sum, r) => sum + r.overall_score, 0) / 3
          const previousAvg = previous.reduce((sum, r) => sum + r.overall_score, 0) / 3
          recentImprovement = Math.round(recentAvg - previousAvg)
        }

        // Assign badges
        const badges: string[] = []
        if (averageScore >= 90) badges.push("Excellence")
        if (interviews.length >= 20) badges.push("Dedicated")
        if (recentImprovement >= 10) badges.push("Rising Star")
        if (technicalScore >= 85) badges.push("Tech Expert")
        if (communicationScore >= 85) badges.push("Great Communicator")
        if (results.length >= 10 && results.every((r) => r.overall_score >= 70)) badges.push("Consistent")

        leaderboardData.push({
          id: member.users.id,
          name: member.users.name || "Unknown",
          email: member.users.email,
          rank: 0,
          averageScore,
          totalInterviews: interviews.length,
          technicalScore,
          communicationScore,
          problemSolvingScore,
          confidenceScore,
          recentImprovement,
          badges,
        })
      }

      // Sort and assign ranks
      leaderboardData.sort((a, b) => b.averageScore - a.averageScore)
      leaderboardData.forEach((member, index) => {
        member.rank = index + 1
      })

      setLeaderboard(leaderboardData)
    } catch (error) {
      console.error("Error fetching leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getSortedLeaderboard = () => {
    const sorted = [...leaderboard]
    switch (sortBy) {
      case "technical":
        sorted.sort((a, b) => b.technicalScore - a.technicalScore)
        break
      case "communication":
        sorted.sort((a, b) => b.communicationScore - a.communicationScore)
        break
      case "problemSolving":
        sorted.sort((a, b) => b.problemSolvingScore - a.problemSolvingScore)
        break
      default:
        sorted.sort((a, b) => b.averageScore - a.averageScore)
    }
    return sorted
  }

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-600" />
    return null
  }

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Excellence":
        return "bg-yellow-100 text-yellow-700 border-yellow-200"
      case "Dedicated":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "Rising Star":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "Tech Expert":
        return "bg-green-100 text-green-700 border-green-200"
      case "Great Communicator":
        return "bg-pink-100 text-pink-700 border-pink-200"
      case "Consistent":
        return "bg-indigo-100 text-indigo-700 border-indigo-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading leaderboard...</p>
        </div>
      </div>
    )
  }

  const sortedLeaderboard = getSortedLeaderboard()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/institution-dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                Institution Leaderboard
              </h1>
              <p className="text-gray-600 mt-1">Top performing members and achievements</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {leaderboard.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No leaderboard data yet</p>
                <p className="text-sm mt-2">Members need to complete interviews to appear on the leaderboard</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Top 3 Podium */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500" />
                Top Performers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {sortedLeaderboard.slice(0, 3).map((member, index) => (
                  <Card
                    key={member.id}
                    className={`border-0 shadow-xl ${
                      index === 0
                        ? "md:order-2 bg-gradient-to-br from-yellow-50 via-yellow-100 to-orange-50"
                        : index === 1
                          ? "md:order-1 bg-gradient-to-br from-gray-50 via-gray-100 to-slate-50"
                          : "md:order-3 bg-gradient-to-br from-orange-50 via-orange-100 to-red-50"
                    }`}
                  >
                    <CardContent className="p-8 text-center">
                      <div className="mb-4">{getMedalIcon(index + 1)}</div>
                      <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-white shadow-lg">
                        <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {member.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{member.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{member.email}</p>
                      <div className="text-4xl font-bold text-blue-600 mb-2">{member.averageScore}%</div>
                      <p className="text-sm text-gray-600 mb-4">{member.totalInterviews} interviews</p>
                      {member.badges.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-center">
                          {member.badges.slice(0, 2).map((badge) => (
                            <Badge key={badge} className={`text-xs ${getBadgeColor(badge)}`}>
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Filters */}
            <Card className="border-0 shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Sort By Category
                </CardTitle>
                <CardDescription>View rankings by different skill areas</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={sortBy} onValueChange={(value: any) => setSortBy(value)} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                    <TabsTrigger value="overall">Overall</TabsTrigger>
                    <TabsTrigger value="technical">Technical</TabsTrigger>
                    <TabsTrigger value="communication">Communication</TabsTrigger>
                    <TabsTrigger value="problemSolving">Problem Solving</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            {/* Full Leaderboard */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Complete Rankings</CardTitle>
                <CardDescription>
                  All members ranked by {sortBy === "overall" ? "overall performance" : sortBy}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedLeaderboard.map((member, index) => (
                    <div
                      key={member.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                        index < 3
                          ? "bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-md"
                          : "bg-white border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank */}
                        <div className="flex items-center gap-2 w-16">
                          {getMedalIcon(index + 1)}
                          <span className="text-2xl font-bold text-gray-900">#{index + 1}</span>
                        </div>

                        {/* Avatar & Info */}
                        <Avatar className="w-12 h-12 border-2 border-white shadow">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold">
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {member.badges.map((badge) => (
                              <Badge key={badge} className={`text-xs ${getBadgeColor(badge)}`}>
                                {badge}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {sortBy === "overall"
                              ? member.averageScore
                              : sortBy === "technical"
                                ? member.technicalScore
                                : sortBy === "communication"
                                  ? member.communicationScore
                                  : member.problemSolvingScore}
                            %
                          </p>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>

                        <div className="text-center">
                          <p className="text-xl font-semibold text-gray-900">{member.totalInterviews}</p>
                          <p className="text-xs text-gray-500">Interviews</p>
                        </div>

                        {member.recentImprovement !== 0 && (
                          <div className="text-center">
                            <div className="flex items-center gap-1">
                              {member.recentImprovement > 0 ? (
                                <>
                                  <TrendingUp className="w-4 h-4 text-green-600" />
                                  <p className="text-lg font-bold text-green-600">+{member.recentImprovement}%</p>
                                </>
                              ) : (
                                <>
                                  <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
                                  <p className="text-lg font-bold text-red-600">{member.recentImprovement}%</p>
                                </>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">Trend</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievement Badges Legend */}
            <Card className="border-0 shadow-lg mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-purple-600" />
                  Achievement Badges
                </CardTitle>
                <CardDescription>Earn badges by reaching milestones</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <Zap className="w-8 h-8 text-yellow-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Excellence</p>
                      <p className="text-xs text-gray-600">Average score 90% or higher</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Target className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Dedicated</p>
                      <p className="text-xs text-gray-600">Complete 20+ interviews</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Rising Star</p>
                      <p className="text-xs text-gray-600">10%+ improvement recently</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Award className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Tech Expert</p>
                      <p className="text-xs text-gray-600">Technical score 85% or higher</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                    <Star className="w-8 h-8 text-pink-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Great Communicator</p>
                      <p className="text-xs text-gray-600">Communication score 85%+</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <Medal className="w-8 h-8 text-indigo-600" />
                    <div>
                      <p className="font-semibold text-gray-900">Consistent</p>
                      <p className="text-xs text-gray-600">10+ interviews, all 70%+</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
